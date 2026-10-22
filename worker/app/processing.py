# worker/app/processing.py
from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone

from psycopg.types.json import Jsonb

from .alerts import send_alert
from .db import get_setting
from .errors import BudgetExceeded, ProviderUnavailable
from .evaluate import assess_relevance, assess_same_event, decide_relevance
from .extract import fetch_fulltext
from .grouping import MAX_CANDIDATES, find_candidates, find_syndicated
from .prefilter import prefilter
from .risk import compute_risk
from .schemas import Relevance
from .signals import CORRECTION_RE, INJECTION_RE
from .stories import create_story, link_article, pick_label
from .summarize import build_evidence, generate_validated_summary, is_limited


def _set_state(conn, a, state: str, *, kind=None, reason=None) -> None:
    conn.execute("update source_articles set state = %s, reject_kind = %s, reason = %s where id = %s",
                 (state, kind, (reason or "")[:300] or None, a["id"]))


def _record_attempt_failure(conn, a, exc: Exception) -> None:
    msg = f"{type(exc).__name__}: {exc}"[:300]
    row = conn.execute("update source_articles set attempts = attempts + 1, reason = %s where id = %s returning attempts",
                       (msg, a["id"])).fetchone()
    if row["attempts"] >= 3:  # bounded: three failed runs and it needs a human
        _set_state(conn, a, "failed", reason=msg)


def process_article(conn, cfg, llm, a, freshness_hours: int, *, fetch_text=fetch_fulltext) -> str:
    ref = a["published_at"] or a["collected_at"]
    if datetime.now(timezone.utc) - ref > timedelta(hours=freshness_hours):
        _set_state(conn, a, "rejected", kind="stale", reason="older than the freshness window")
        return "rejected"
    reason = prefilter(a["title"], a["excerpt"])
    if reason:
        _set_state(conn, a, "rejected", kind="editorial", reason=reason)
        return "rejected"

    hint = bool(CORRECTION_RE.search(f"{a['title']} {a['excerpt'] or ''}"))
    synd = find_syndicated(conn, a)
    if synd:
        link_article(conn, synd, a, is_syndicated=True, adds_new=False, correction_hint=hint)
        return "grouped_syndicated"

    page_media: dict = {}
    try:
        text = fetch_text(a["canonical_url"], a["title"], cfg, out_media=page_media) if a["allow_fulltext"] else None
    except TypeError:
        text = fetch_text(a["canonical_url"], a["title"], cfg) if a["allow_fulltext"] else None

    if page_media.get("media_url") and not a.get("media_url"):
        conn.execute(
            """update source_articles set
                 media_url = %s, media_type = %s, media_source_name = %s,
                 media_source_url = %s, media_alt_text = %s, media_license = %s
               where id = %s""",
            (page_media["media_url"], page_media["media_type"],
             page_media.get("media_source_name") or a.get("publisher"),
             page_media.get("media_source_url") or a.get("canonical_url"),
             page_media.get("media_alt_text") or a.get("title"),
             page_media.get("media_license"), a["id"]))
        a = dict(a)
        a["media_url"] = page_media["media_url"]
        a["media_type"] = page_media["media_type"]
        a["media_source_name"] = page_media.get("media_source_name") or a.get("publisher")
        a["media_source_url"] = page_media.get("media_source_url") or a.get("canonical_url")
        a["media_alt_text"] = page_media.get("media_alt_text") or a.get("title")
        a["media_license"] = page_media.get("media_license")

    suspicious = bool(INJECTION_RE.search(" ".join(filter(None, [a["title"], a["excerpt"], text]))))

    cached = (a["analysis"] or {}).get("relevance")
    rel = Relevance.model_validate(cached) if cached else assess_relevance(llm, a, text)
    if not cached:
        conn.execute("update source_articles set analysis = %s where id = %s", (Jsonb({"relevance": rel.model_dump()}), a["id"]))
    verdict, why = decide_relevance(rel)
    if verdict == "reject":
        _set_state(conn, a, "rejected", kind="editorial", reason=why)
        return "rejected"

    follow_up_of = None
    for cand in find_candidates(conn, a["title"], [e.lower() for e in rel.entities])[:MAX_CANDIDATES]:
        se = assess_same_event(llm, a, cand)
        if se.relationship == "same_event":
            link_article(conn, cand["id"], a, is_syndicated=se.is_syndicated_copy,
                         adds_new=se.adds_new_information, correction_hint=hint)
            return "grouped_existing"
        if se.relationship == "follow_up":
            follow_up_of = cand["id"]
            break

    cap = int(get_setting(conn, "max_stories_per_day", 15))
    made = conn.execute("select count(*) as n from stories where created_at > now() - interval '24 hours'").fetchone()["n"]
    if made >= cap:
        return "deferred_cap"  # stays 'discovered' and is retried next run while still fresh

    evidence = build_evidence(cfg, [a], transient={str(a["id"]): text} if text else None, fetch_text=fetch_text)
    limited = is_limited(evidence)
    summary, outcome, detail = generate_validated_summary(llm, evidence, rel.story_type, limited)
    if summary is None:
        if outcome == "insufficient":
            _set_state(conn, a, "held", reason="insufficient evidence for a reliable summary")
            return "held"
        state = "quarantined" if suspicious else "held"
        _set_state(conn, a, state, kind="security" if suspicious else None, reason=f"summary validation failed: {detail}")
        return state

    label = pick_label(limited=limited, conflicting=summary.conflicting_reports,
                       has_primary=bool(a["is_primary"]), publishers=1)
    flags, priority = compute_risk(rel, summary, evidence[0].text, label=label, suspicious=suspicious)
    create_story(conn, article=a, rel=rel, summary=summary, evidence=evidence, limited=limited,
                 flags=flags, priority=priority, follow_up_of=follow_up_of, model=cfg.llm_model)
    return "story_created"


# worker/app/processing.py  (append at the end of the file)
def process_pending(conn, cfg, llm, run_id) -> dict:
    stats: Counter = Counter()
    freshness = int(get_setting(conn, "freshness_hours", 72))
    rows = conn.execute(
        """select a.*, s.name as publisher, s.is_primary, s.allow_fulltext, s.region_hint
           from source_articles a join sources s on s.id = a.source_id
           where a.state = 'discovered'
           order by coalesce(a.published_at, a.collected_at) asc limit %s""",
        (cfg.max_articles_per_run,)).fetchall()
    for a in rows:
        try:
            stats[process_article(conn, cfg, llm, a, freshness)] += 1
        except BudgetExceeded as exc:
            stats["stopped_budget"] += 1
            send_alert(conn, cfg, "llm-budget", "AI budget reached",
                       f"{exc}. AI processing is paused until tomorrow; queued items are preserved.")
            break
        except ProviderUnavailable as exc:
            stats["stopped_provider"] += 1
            send_alert(conn, cfg, "llm-down", "AI provider unavailable", str(exc))
            break
        except Exception as exc:  # one bad article must not stop the whole run
            stats["errors"] += 1
            _record_attempt_failure(conn, a, exc)
    return dict(stats)
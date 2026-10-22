# worker/app/stories.py
from __future__ import annotations

import re
import secrets

from psycopg.types.json import Jsonb

from .db import audit
from .evaluate import final_categories
from .summarize import claims_payload


def make_slug(headline: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", headline.lower()).strip("-")[:70].strip("-") or "story"
    return f"{base}-{secrets.token_hex(3)}"


def pick_label(*, limited: bool, conflicting: bool, has_primary: bool, publishers: int) -> str:
    if conflicting:
        return "reports_differ"
    if limited:
        return "verification_incomplete"
    if has_primary:
        return "primary_source_available"
    if publishers >= 2:
        return "multiple_publishers"
    return "single_source"


def refresh_label(conn, story_id) -> None:
    s = conn.execute("select is_limited, body, evidence_label from stories where id = %s", (story_id,)).fetchone()
    conflicting = bool((s["body"] or {}).get("conflicting"))
    if s["evidence_label"] == "independently_corroborated" and not conflicting:
        return  # only an admin can set this label, so never overwrite it
    r = conn.execute(
        """select count(distinct a.source_id) filter (where not sa.is_syndicated) as publishers,
                  coalesce(bool_or(so.is_primary and sa.role = 'primary'), false) as has_primary
           from story_articles sa join source_articles a on a.id = sa.article_id
           join sources so on so.id = a.source_id where sa.story_id = %s""", (story_id,)).fetchone()
    label = pick_label(limited=s["is_limited"], conflicting=conflicting,
                       has_primary=r["has_primary"], publishers=r["publishers"] or 0)
    conn.execute("update stories set evidence_label = %s where id = %s", (label, story_id))


def link_article(conn, story_id, a, *, is_syndicated: bool, adds_new: bool, correction_hint: bool = False) -> None:
    with conn.transaction():
        has_primary = conn.execute("select 1 from story_articles where story_id = %s and role = 'primary'",
                                   (story_id,)).fetchone()
        role = "additional" if is_syndicated else ("primary" if a["is_primary"] and not has_primary else "independent")
        conn.execute("insert into story_articles (story_id, article_id, role, is_syndicated) values (%s, %s, %s, %s)",
                     (story_id, a["id"], role, is_syndicated))
        conn.execute("update source_articles set state = 'grouped' where id = %s", (a["id"],))
        conn.execute("update stories set first_reported_at = least(first_reported_at, %s) where id = %s",
                     (a["published_at"] or a["collected_at"], story_id))
        attention = "correction_keyword" if correction_hint else ("new_info" if adds_new else None)
        if attention:
            conn.execute("update stories set needs_attention = %s where id = %s", (attention, story_id))
        if adds_new:
            conn.execute(
                """insert into jobs (job_type, payload, idempotency_key, created_by)
                   values ('regenerate_summary', %s, %s, 'pipeline') on conflict (idempotency_key) do nothing""",
                (Jsonb({"story_id": str(story_id)}), f"regen:{story_id}:{a['id']}"))
        refresh_label(conn, story_id)
        if a.get("media_url"):
            conn.execute(
                """update stories set
                     media_url = coalesce(media_url, %s),
                     media_type = coalesce(media_type, %s),
                     media_source_name = coalesce(media_source_name, %s),
                     media_source_url = coalesce(media_source_url, %s),
                     media_alt_text = coalesce(media_alt_text, %s),
                     media_license = coalesce(media_license, %s)
                   where id = %s and media_url is null""",
                (a.get("media_url"), a.get("media_type"),
                 a.get("media_source_name") or a.get("publisher"),
                 a.get("media_source_url") or a.get("canonical_url"),
                 a.get("media_alt_text"), a.get("media_license"), story_id))
        audit(conn, "pipeline", "story.article_linked", "story", str(story_id), None,
              {"article_id": str(a["id"]), "role": role, "syndicated": is_syndicated})


def create_story(conn, *, article, rel, summary, evidence, limited: bool, flags, priority, follow_up_of=None, model=None):
    body = {"what_happened": summary.what_happened, "why_it_matters": summary.why_it_matters,
            "uncertain": summary.uncertain, "conflicting": summary.conflicting_reports, "limited": limited}
    search_text = " ".join([summary.what_happened, summary.why_it_matters, " ".join(rel.entities), article.get("publisher") or ""])
    with conn.transaction():
        sid = conn.execute(
            """insert into stories (slug, headline, card_summary, body, search_text, categories, region, story_type,
                                    is_limited, risk_flags, review_priority, entities, entity_keys, first_reported_at,
                                    media_url, media_type, media_source_name, media_source_url, media_alt_text, media_license)
               values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) returning id""",
            (make_slug(summary.headline), summary.headline, summary.card_summary, Jsonb(body), search_text,
             final_categories(rel), rel.region, rel.story_type, limited, flags, priority, rel.entities,
             [e.lower() for e in rel.entities], article["published_at"] or article["collected_at"],
             article.get("media_url"), article.get("media_type"),
             article.get("media_source_name") or article.get("publisher"),
             article.get("media_source_url") or article.get("canonical_url"),
             article.get("media_alt_text") or summary.headline,
             article.get("media_license"))).fetchone()["id"]
        conn.execute("insert into story_articles (story_id, article_id, role) values (%s, %s, %s)",
                     (sid, article["id"], "primary" if article["is_primary"] else "independent"))
        conn.execute(
            """insert into story_versions (story_id, version, status, headline, card_summary, body, claims, reason,
                                           created_by, model,
                                           media_url, media_type, media_source_name, media_source_url, media_alt_text, media_license)
               values (%s, 1, 'current', %s, %s, %s, %s, 'initial draft', 'pipeline', %s, %s, %s, %s, %s, %s, %s)""",
            (sid, summary.headline, summary.card_summary, Jsonb(body), Jsonb(claims_payload(summary, evidence)), model,
             article.get("media_url"), article.get("media_type"),
             article.get("media_source_name") or article.get("publisher"),
             article.get("media_source_url") or article.get("canonical_url"),
             article.get("media_alt_text") or summary.headline,
             article.get("media_license")))
        conn.execute("update source_articles set state = 'grouped' where id = %s", (article["id"],))
        if follow_up_of:
            conn.execute("insert into story_links (from_story, to_story, link_type) values (%s, %s, 'follow_up')",
                         (sid, follow_up_of))
        refresh_label(conn, sid)
        conn.execute("update stories set status = 'awaiting_review' where id = %s", (sid,))
        audit(conn, "pipeline", "story.created", "story", str(sid), None, {"headline": summary.headline, "flags": flags})
    return sid
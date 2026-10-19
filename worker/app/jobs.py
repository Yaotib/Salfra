# worker/app/jobs.py
from __future__ import annotations

from collections import Counter

from psycopg.types.json import Jsonb

from .db import audit
from .errors import BudgetExceeded, PermanentError, ProviderUnavailable
from .stories import refresh_label
from .summarize import build_evidence, claims_payload, generate_validated_summary, is_limited


def requeue_stuck(conn, minutes: int = 30) -> int:
    rows = conn.execute(
        """update jobs set status = 'queued', available_at = now(), error = 'requeued after timeout'
           where status = 'running' and started_at < now() - make_interval(mins => %s) returning id""",
        (minutes,)).fetchall()
    return len(rows)


def claim_job(conn):
    with conn.transaction():
        job = conn.execute(
            """select * from jobs where status = 'queued' and available_at <= now()
               order by created_at limit 1 for update skip locked""").fetchone()
        if job is None:
            return None
        conn.execute("update jobs set status = 'running', started_at = now(), attempts = attempts + 1 where id = %s",
                     (job["id"],))
    return job


def _retry_later(conn, job, error: str, *, count_attempt: bool) -> None:
    error = error[:300]
    if not count_attempt:  # an outage is not the job's fault
        conn.execute("""update jobs set status = 'queued', attempts = greatest(attempts - 1, 0),
                        available_at = now() + interval '60 minutes', error = %s where id = %s""", (error, job["id"]))
    elif job["attempts"] + 1 >= job["max_attempts"]:
        conn.execute("update jobs set status = 'failed', finished_at = now(), error = %s where id = %s", (error, job["id"]))
    else:
        conn.execute("""update jobs set status = 'queued', error = %s,
                        available_at = now() + make_interval(mins => %s) where id = %s""",
                     (error, 15 * (job["attempts"] + 1), job["id"]))


def regenerate_summary(conn, cfg, llm, story_id: str) -> None:
    story = conn.execute("select id, story_type from stories where id = %s", (story_id,)).fetchone()
    if not story:
        raise PermanentError(f"story {story_id} not found")
    arts = conn.execute(
        """select a.id, a.title, a.excerpt, a.canonical_url, s.name as publisher, s.is_primary, s.allow_fulltext
           from story_articles sa join source_articles a on a.id = sa.article_id join sources s on s.id = a.source_id
           where sa.story_id = %s
           order by (sa.role = 'primary') desc, coalesce(a.published_at, a.collected_at) asc limit 6""",
        (story_id,)).fetchall()
    if not arts:
        raise PermanentError("story has no linked articles")
    evidence = build_evidence(cfg, arts)
    limited = is_limited(evidence)
    summary, outcome, detail = generate_validated_summary(llm, evidence, story["story_type"], limited)
    refresh_label(conn, story_id)
    if summary is None:
        conn.execute("update stories set needs_attention = coalesce(needs_attention, 'new_info') where id = %s", (story_id,))
        audit(conn, "pipeline", "story.regeneration_failed", "story", story_id, None, {"outcome": outcome}, detail)
        return
    body = {"what_happened": summary.what_happened, "why_it_matters": summary.why_it_matters,
            "uncertain": summary.uncertain, "conflicting": summary.conflicting_reports, "limited": limited}
    with conn.transaction():
        version = conn.execute("select coalesce(max(version), 0) + 1 as v from story_versions where story_id = %s",
                               (story_id,)).fetchone()["v"]
        conn.execute("update story_versions set status = 'superseded' where story_id = %s and status = 'proposed'", (story_id,))
        conn.execute(
            """insert into story_versions (story_id, version, status, headline, card_summary, body, claims, reason,
                                           created_by, model)
               values (%s, %s, 'proposed', %s, %s, %s, %s, 'regenerated after new evidence', 'pipeline', %s)""",
            (story_id, version, summary.headline, summary.card_summary, Jsonb(body),
             Jsonb(claims_payload(summary, evidence)), cfg.llm_model))
        conn.execute("update stories set needs_attention = 'proposed_revision' where id = %s", (story_id,))
        audit(conn, "pipeline", "story.revision_proposed", "story", story_id, None, {"version": version})


def run_jobs(conn, cfg, llm, limit: int = 10) -> dict:
    stats: Counter = Counter()
    requeue_stuck(conn)
    for _ in range(limit):
        job = claim_job(conn)
        if job is None:
            break
        try:
            if job["job_type"] == "regenerate_summary":
                regenerate_summary(conn, cfg, llm, job["payload"]["story_id"])
            conn.execute("update jobs set status = 'succeeded', finished_at = now(), error = null where id = %s", (job["id"],))
            stats["succeeded"] += 1
        except (BudgetExceeded, ProviderUnavailable) as exc:
            _retry_later(conn, job, str(exc), count_attempt=False)
            stats["deferred"] += 1
            break
        except Exception as exc:
            _retry_later(conn, job, f"{type(exc).__name__}: {exc}", count_attempt=True)
            stats["failed_attempts"] += 1
    return dict(stats)
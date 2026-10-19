# worker/app/publish.py
from __future__ import annotations

import psycopg

from .db import audit, get_setting

SAFE_LABELS = ["primary_source_available", "multiple_publishers"]


def auto_publish(conn, cfg) -> int:
    if not get_setting(conn, "auto_publish_enabled", False) or get_setting(conn, "publishing_paused", False):
        return 0
    risky_waiting = conn.execute(
        """select count(*) as n from stories where status = 'awaiting_review'
           and (cardinality(risk_flags) > 0 or review_priority > 0 or is_limited)""").fetchone()["n"]
    if risky_waiting > int(get_setting(conn, "review_queue_max", 40)):
        return 0  # reviews are piling up, so stop auto-publishing
    rows = conn.execute(
        """select id from stories where status = 'awaiting_review' and not is_limited
             and cardinality(risk_flags) = 0 and review_priority = 0 and needs_attention is null
             and evidence_label = any(%s)
           order by first_reported_at limit 10""", (SAFE_LABELS,)).fetchall()
    count = 0
    for r in rows:
        try:
            conn.execute("update stories set status = 'published', published_at = now() where id = %s", (r["id"],))
        except psycopg.errors.RaiseException:
            break  # kill switch or a rule refused it: stop, never work around it
        audit(conn, "auto-publish", "story.published", "story", str(r["id"]),
              {"status": "awaiting_review"}, {"status": "published"})
        count += 1
    return count
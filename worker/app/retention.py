# worker/app/retention.py
from __future__ import annotations

from .db import audit, connect


def run_retention(cfg) -> int:
    conn = connect(cfg.database_url)
    try:
        counts = {}
        # Items that never became part of a story are only needed briefly.
        counts["old_rejected_failed_held"] = len(conn.execute(
            """delete from source_articles a where a.collected_at < now() - interval '45 days'
                 and a.state in ('rejected','failed','held')
                 and not exists (select 1 from story_articles sa where sa.article_id = a.id) returning a.id""").fetchall())
        counts["old_quarantined"] = len(conn.execute(
            """delete from source_articles a where a.collected_at < now() - interval '90 days' and a.state = 'quarantined'
                 and not exists (select 1 from story_articles sa where sa.article_id = a.id) returning a.id""").fetchall())
        conn.execute("update source_articles set run_id = null where run_id in (select id from runs where started_at < now() - interval '30 days')")
        counts["runs"] = len(conn.execute("delete from runs where started_at < now() - interval '30 days' returning id").fetchall())
        counts["jobs"] = len(conn.execute("delete from jobs where status = 'succeeded' and finished_at < now() - interval '30 days' returning id").fetchall())
        counts["llm_usage"] = len(conn.execute("delete from llm_usage where at < now() - interval '60 days' returning id").fetchall())
        counts["analysis_cleared"] = len(conn.execute(
            """update source_articles set analysis = null where state = 'grouped' and analysis is not null
                 and collected_at < now() - interval '30 days' returning id""").fetchall())
        audit(conn, "system", "retention.run", "system", None, None, counts)
        print(f"Retention: {counts}")
        return 0
    finally:
        conn.close()
# worker/app/monitor.py
from __future__ import annotations

from .alerts import ping, send_alert
from .config import Config
from .db import connect, db_usage, get_setting
from .jobs import requeue_stuck


def run_monitor(cfg: Config) -> int:
    conn = connect(cfg.database_url)
    try:
        interval = int(get_setting(conn, "collection_interval_minutes", 120))
        problems: list[tuple[str, str, str, int]] = []  # key, subject, body, cooldown hours

        stuck = conn.execute(
            """update runs set status = 'failed', finished_at = now(), error = 'marked failed by monitor (over 45 minutes)'
               where status = 'running' and started_at < now() - interval '45 minutes' returning id""").fetchall()
        if stuck:
            problems.append(("stuck-run", "Collection run was stuck", f"{len(stuck)} run(s) exceeded 45 minutes and were marked failed.", 2))

        if not get_setting(conn, "collection_paused", False):
            last = conn.execute("select max(finished_at) as t, count(*) as n from runs where status in ('succeeded','partial')").fetchone()
            overdue = conn.execute("select (now() - %s::timestamptz) > make_interval(mins => %s) as late",
                                   (last["t"], 2 * interval + 30)).fetchone()["late"] if last["t"] else False
            if overdue:
                problems.append(("overdue", "Collection is overdue", f"No successful run for over {2 * interval + 30} minutes.", 3))

        if requeue_stuck(conn):
            problems.append(("stuck-jobs", "Background jobs were stuck", "Jobs running over 30 minutes were re-queued.", 6))
        failed_jobs = conn.execute("select count(*) as n from jobs where status = 'failed' and finished_at > now() - interval '24 hours'").fetchone()["n"]
        if failed_jobs:
            problems.append(("failed-jobs", "Background jobs failed", f"{failed_jobs} job(s) failed in the last 24 hours. See Jobs and items.", 12))

        q = conn.execute("""select count(*) as n, coalesce(extract(epoch from (now() - min(created_at))) / 3600, 0) as oldest_h,
                                   count(*) filter (where cardinality(risk_flags) > 0 or review_priority > 0 or is_limited) as risky
                            from stories where status = 'awaiting_review'""").fetchone()
        limit = int(get_setting(conn, "review_queue_max", 40))
        if q["risky"] > limit or q["oldest_h"] > 48:
            problems.append(("review-backlog", "Review queue is backing up",
                             f"{q['n']} waiting ({q['risky']} high-risk or limited); oldest is {q['oldest_h']:.0f}h old. Auto-publishing stops above {limit}.", 12))

        attention = conn.execute("""select count(*) as n from stories where status in ('published','updated')
                                    and needs_attention in ('source_changed','correction_keyword')""").fetchone()["n"]
        if attention:
            problems.append(("attention", "URGENT: live stories may need correction",
                             f"{attention} published stories were flagged for a possible source change or correction.", 3))

        _, pct = db_usage(conn)
        if pct >= 70:
            problems.append(("db-size", f"Database at {pct:.0f}% of limit", "Check retention. At 85% ingestion pauses.", 12))

        budget = int(get_setting(conn, "llm_daily_call_budget", 150))
        used = conn.execute("select count(*) as n from llm_usage where at >= date_trunc('day', now())").fetchone()["n"]
        if budget and used / budget >= 0.9:
            problems.append(("llm-budget-90", "AI daily budget almost used", f"{used} of {budget} calls used today.", 12))

        for key, subject, body, cooldown in problems:
            send_alert(conn, cfg, key, subject, body, cooldown_hours=cooldown)
        print(f"Monitor: {len(problems)} problem(s) found.")
        ping(cfg.monitor_heartbeat_url)
        return 0
    except Exception as exc:
        print(f"Monitor failed: {exc}")
        ping(cfg.monitor_heartbeat_url, "/fail")
        return 1
    finally:
        conn.close()


def print_usage(cfg: Config) -> int:
    """Cost evidence even on a free tier: tokens per collected item and per story."""
    conn = connect(cfg.database_url)
    try:
        rows = conn.execute(
            """select task, count(*) as calls, count(*) filter (where not ok) as invalid,
                      coalesce(sum(prompt_tokens), 0) as p, coalesce(sum(completion_tokens), 0) as c
               from llm_usage where at > now() - interval '7 days' group by task order by task""").fetchall()
        collected = conn.execute("select count(*) as n from source_articles where collected_at > now() - interval '7 days'").fetchone()["n"]
        stories = conn.execute("select count(*) as n from stories where created_at > now() - interval '7 days'").fetchone()["n"]
        total = sum(r["p"] + r["c"] for r in rows)
        for r in rows:
            print(f"{r['task']:<12} calls={r['calls']} invalid={r['invalid']} prompt_tokens={r['p']} completion_tokens={r['c']}")
        print(f"collected={collected} stories_created={stories} total_tokens={total}")
        print(f"tokens per collected item: {total / collected:.0f}" if collected else "no items collected")
        print(f"tokens per story created: {total / stories:.0f}" if stories else "no stories created")
        size, pct = db_usage(conn)
        print(f"database: {size / 1024 / 1024:.0f} MB ({pct:.0f}% of limit)")
        return 0
    finally:
        conn.close()
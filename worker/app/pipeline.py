# worker/app/pipeline.py   (final version)
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from psycopg.types.json import Jsonb

from .alerts import ping, send_alert
from .config import Config
from .db import connect, db_usage, get_setting
from .ingest import ingest_all
from .jobs import run_jobs
from .llm import LLMClient
from .processing import process_pending
from .publish import auto_publish

LOCK_ID = 727001


def _skip_reason(conn, cfg: Config, force: bool) -> str | None:
    if get_setting(conn, "collection_paused", False):
        return "collection paused by administrator"
    _, pct = db_usage(conn)
    if pct >= 85:
        send_alert(conn, cfg, "db-full", "Database nearly full",
                   f"Database is at {pct:.0f}% of its limit. Ingestion skipped so admin actions keep working.")
        return f"database at {pct:.0f}% of limit"
    if not force:
        interval = int(get_setting(conn, "collection_interval_minutes", 120))
        last = conn.execute("select max(started_at) as t from runs where status in ('succeeded','partial')").fetchone()["t"]
        if last and datetime.now(timezone.utc) - last < timedelta(minutes=max(15, interval - 30)):
            return "interval guard"
    return None


def run_collection(cfg: Config, *, trigger: str = "schedule", force: bool = False) -> int:
    conn = connect(cfg.database_url)
    try:
        if not conn.execute("select pg_try_advisory_lock(%s) as ok", (LOCK_ID,)).fetchone()["ok"]:
            print("Another collection run holds the lock; exiting.")
            return 0
        reason = _skip_reason(conn, cfg, force)
        if reason:
            conn.execute("insert into runs (trigger, status, finished_at, stats) values (%s, 'skipped', now(), %s)",
                         (trigger, Jsonb({"reason": reason})))
            print(f"Skipped: {reason}")
            ping(cfg.heartbeat_url)
            return 0
        run_id = conn.execute("insert into runs (trigger) values (%s) returning id", (trigger,)).fetchone()["id"]
        stats: dict = {}
        status, error = "succeeded", None
        try:
            stats["ingest"] = ingest_all(conn, cfg, run_id)
            degraded = bool(stats["ingest"].get("source_failures"))
            if cfg.llm_configured:
                llm = LLMClient(conn, cfg)
                stats["process"] = process_pending(conn, cfg, llm, run_id)
                stats["jobs"] = run_jobs(conn, cfg, llm)
                stats["auto_published"] = auto_publish(conn, cfg)
                degraded = degraded or any(k in stats["process"] for k in ("stopped_budget", "stopped_provider", "errors"))
            else:
                stats["process"] = {"skipped": "LLM not configured"}
            status = "partial" if degraded else "succeeded"
        except Exception as exc:
            status, error = "failed", f"{type(exc).__name__}: {exc}"[:500]
            send_alert(conn, cfg, "run-failed", "Collection run failed", error)
        conn.execute("update runs set status = %s, finished_at = now(), stats = %s, error = %s where id = %s",
                     (status, Jsonb(stats), error, run_id))
        ping(cfg.heartbeat_url, "/fail" if status == "failed" else "")
        print(f"Run {run_id}: {status} {stats}")
        return 1 if status == "failed" else 0
    finally:
        conn.close()
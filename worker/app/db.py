# worker/app/db.py
from __future__ import annotations

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


def connect(url: str) -> psycopg.Connection:
    return psycopg.connect(url, autocommit=True, row_factory=dict_row)


def get_setting(conn, key: str, default):
    row = conn.execute("select value from settings where key = %s", (key,)).fetchone()
    return row["value"] if row else default


def set_setting(conn, key: str, value, actor: str = "system") -> None:
    before = get_setting(conn, key, None)
    conn.execute(
        """insert into settings (key, value) values (%s, %s)
           on conflict (key) do update set value = excluded.value, updated_at = now()""",
        (key, Jsonb(value)),
    )
    audit(conn, actor, "setting.changed", "setting", key, {"value": before}, {"value": value})


def audit(conn, actor, action, target_type, target_id, before=None, after=None, note=None) -> None:
    conn.execute(
        """insert into audit_events (actor, action, target_type, target_id, before, after, note)
           values (%s, %s, %s, %s, %s, %s, %s)""",
        (actor, action, target_type, target_id,
         Jsonb(before) if before is not None else None,
         Jsonb(after) if after is not None else None, note),
    )


def db_usage(conn) -> tuple[int, float]:
    """Returns (bytes used, percent of the configured limit)."""
    size = conn.execute("select pg_database_size(current_database()) as b").fetchone()["b"]
    limit_mb = int(get_setting(conn, "db_limit_mb", 500))
    return size, size / (limit_mb * 1024 * 1024) * 100
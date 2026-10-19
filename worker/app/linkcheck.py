# worker/app/linkcheck.py
from __future__ import annotations

import time

from .alerts import send_alert
from .db import connect
from .errors import AccessDenied, MalformedContent, PermanentError, TransientError, UnsafeURL
from .fetcher import safe_get


def classify(url: str, cfg) -> str:
    try:
        safe_get(url, user_agent=cfg.user_agent, allow_private=cfg.allow_private, timeout=10, max_bytes=500_000)
        return "ok"
    except MalformedContent:
        return "ok"        # reachable, just large or oddly shaped
    except AccessDenied:
        return "blocked"   # many publishers block bots; not the same as a dead link
    except PermanentError:
        return "broken"    # 404 / 410
    except (TransientError, UnsafeURL):
        return "error"


def run_linkcheck(cfg) -> int:
    conn = connect(cfg.database_url)
    try:
        rows = conn.execute(
            """select a.id, a.canonical_url from source_articles a
               where a.id in (select sa.article_id from story_articles sa join stories s on s.id = sa.story_id
                              where s.status in ('published','updated'))
                 and (a.link_checked_at is null or a.link_checked_at < now() - interval '7 days')
               order by a.link_checked_at nulls first limit 100""").fetchall()
        for r in rows:
            status = classify(r["canonical_url"], cfg)
            conn.execute("update source_articles set link_status = %s, link_checked_at = now() where id = %s", (status, r["id"]))
            time.sleep(1)  # be polite to publishers
        broken = conn.execute(
            """select count(distinct a.id) as n from source_articles a
               join story_articles sa on sa.article_id = a.id join stories s on s.id = sa.story_id
               where a.link_status = 'broken' and s.status in ('published','updated')""").fetchone()["n"]
        print(f"Checked {len(rows)} links; {broken} broken on live stories.")
        if broken:
            send_alert(conn, cfg, "broken-links", "Broken source links on live stories",
                       f"{broken} source links on published stories look dead. See the editor's evidence table.", cooldown_hours=24)
        return 0
    finally:
        conn.close()
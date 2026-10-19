# worker/app/ingest.py
from __future__ import annotations

import hashlib
import html
import re
from calendar import timegm
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import feedparser

from .alerts import send_alert
from .db import audit, get_setting
from .errors import AccessDenied, MalformedContent, PermanentError, TransientError, UnsafeURL
from .fetcher import safe_get, with_retries
from .urls import normalize_url

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def clean_text(s: str | None, limit: int | None = None) -> str:
    s = html.unescape(TAG_RE.sub(" ", s or ""))
    s = WS_RE.sub(" ", s).strip()
    return s[:limit] if limit else s


def norm_title(title: str) -> str:
    return WS_RE.sub(" ", re.sub(r"[^a-z0-9 ]", "", clean_text(title).lower())).strip()


def title_hash(title_norm: str) -> str:
    return hashlib.sha256(title_norm.encode()).hexdigest()


@dataclass
class Candidate:
    title: str
    url: str
    published_at: datetime | None
    excerpt: str


def parse_feed(body: bytes) -> list[Candidate]:
    parsed = feedparser.parse(body)
    if parsed.bozo and not parsed.entries:
        raise MalformedContent("feed could not be parsed")
    out = []
    for e in parsed.entries:
        title = clean_text(e.get("title"), 300)
        link = e.get("link")
        if not title or not link:
            continue
        published = None
        for key in ("published_parsed", "updated_parsed"):
            if e.get(key):
                published = datetime.fromtimestamp(timegm(e[key]), tz=timezone.utc)
                break
        excerpt = clean_text(e.get("summary") or e.get("description") or "", 1200)
        out.append(Candidate(title, link, published, excerpt))
    return out


INSERT_SQL = """
insert into source_articles (source_id, run_id, canonical_url, title, title_norm, published_at, excerpt, content_hash)
values (%s, %s, %s, %s, %s, %s, %s, %s)
on conflict (canonical_url) do nothing
returning id
"""


def ingest_source(conn, cfg, run_id, source, *, now=None, fetch=safe_get) -> Counter:
    now = now or datetime.now(timezone.utc)
    freshness = timedelta(hours=int(get_setting(conn, "freshness_hours", 72)))
    stats: Counter = Counter()
    headers = {}
    if source["etag"]:
        headers["If-None-Match"] = source["etag"]
    if source["last_modified"]:
        headers["If-Modified-Since"] = source["last_modified"]
    resp = with_retries(lambda: fetch(source["feed_url"], user_agent=cfg.user_agent,
                                      extra_headers=headers, allow_private=cfg.allow_private))
    if resp.status == 304:
        stats["not_modified"] += 1
        return stats
    for c in parse_feed(resp.body)[: cfg.max_items_per_source]:
        try:
            url = normalize_url(c.url)
        except ValueError:
            stats["invalid_url"] += 1
            continue
        if c.published_at and c.published_at > now + timedelta(days=1):
            stats["future_date"] += 1
            continue
        if c.published_at and now - c.published_at > freshness:
            stats["stale"] += 1
            continue
        tnorm = norm_title(c.title)
        existing = conn.execute("select id, title_norm from source_articles where canonical_url = %s", (url,)).fetchone()
        if existing:
            if existing["title_norm"] != tnorm:
                _record_source_change(conn, existing["id"], c.title, tnorm)
                stats["source_changed"] += 1
            else:
                stats["seen"] += 1
            continue
        row = conn.execute(INSERT_SQL, (source["id"], run_id, url, c.title, tnorm, c.published_at,
                                        c.excerpt, title_hash(tnorm))).fetchone()
        stats["new" if row else "seen"] += 1
    conn.execute("update sources set etag = %s, last_modified = %s where id = %s",
                 (resp.headers.get("etag"), resp.headers.get("last-modified"), source["id"]))
    return stats


def _record_source_change(conn, article_id, new_title: str, new_norm: str) -> None:
    with conn.transaction():
        old = conn.execute("select title from source_articles where id = %s for update", (article_id,)).fetchone()
        conn.execute(
            "update source_articles set title = %s, title_norm = %s, content_hash = %s, source_changed_at = now() where id = %s",
            (new_title, new_norm, title_hash(new_norm), article_id))
        conn.execute(
            """update stories set needs_attention = 'source_changed'
               where id in (select story_id from story_articles where article_id = %s)
                 and status in ('published','updated','awaiting_review','approved')""", (article_id,))
        audit(conn, "system", "article.source_changed", "source_article", str(article_id),
              {"title": old["title"]}, {"title": new_title})


def _record_failure(conn, cfg, source, kind: str, message: str, threshold: int, immediate: bool) -> None:
    row = conn.execute(
        "update sources set failure_count = failure_count + 1, last_polled_at = now() where id = %s returning failure_count",
        (source["id"],)).fetchone()
    if immediate or row["failure_count"] >= threshold:
        conn.execute(
            "update sources set status = 'paused', paused_reason = %s where id = %s and status = 'active'",
            (f"{kind}: {message[:200]}", source["id"]))
        audit(conn, "system", "source.auto_paused", "source", str(source["id"]), None, {"reason": kind})
        send_alert(conn, cfg, f"source-paused:{source['id']}", f"Source paused: {source['name']}",
                   f"Reason: {kind}. {message[:200]}. Review the source's terms before resuming.")


def ingest_all(conn, cfg, run_id) -> dict:
    sources = conn.execute("select * from sources where status = 'active' order by name").fetchall()
    threshold = int(get_setting(conn, "source_failure_threshold", 3))
    total: Counter = Counter()
    for s in sources:
        interval = s["poll_interval_minutes"]
        if interval and s["last_polled_at"] and \
                datetime.now(timezone.utc) - s["last_polled_at"] < timedelta(minutes=interval * 0.9):
            total["skipped_interval"] += 1
            continue
        try:
            total.update(ingest_source(conn, cfg, run_id, s))
            conn.execute("update sources set failure_count = 0, last_success_at = now(), last_polled_at = now() where id = %s",
                         (s["id"],))
        except (AccessDenied, UnsafeURL) as exc:
            total["source_failures"] += 1
            _record_failure(conn, cfg, s, "access_denied", str(exc), threshold, immediate=True)
        except (TransientError, PermanentError, MalformedContent) as exc:
            total["source_failures"] += 1
            _record_failure(conn, cfg, s, "technical_failure", str(exc), threshold, immediate=False)
    return dict(total)
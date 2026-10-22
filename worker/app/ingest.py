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
from .urls import assert_public_url, normalize_url

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
VIDEO_EXTS = (".mp4", ".webm", ".ogg", ".mov", ".mkv")
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif")
VIDEO_DOMAINS = ("youtube.com", "youtu.be", "vimeo.com")


def is_video_url(url: str, mime: str | None = None) -> bool:
    if mime and mime.lower().startswith("video/"):
        return True
    lower = url.lower()
    path = lower.split("?")[0].split("#")[0]
    if any(path.endswith(ext) for ext in VIDEO_EXTS):
        return True
    if any(domain in lower for domain in VIDEO_DOMAINS):
        return True
    return False


def extract_feed_media(e) -> dict[str, str | None]:
    # 1. Media RSS media_content
    for mc in e.get("media_content", []):
        url = mc.get("url")
        if url and (url.startswith("http://") or url.startswith("https://")):
            mime = mc.get("type", "")
            medium = mc.get("medium", "")
            is_vid = medium == "video" or is_video_url(url, mime)
            credit = e.get("media_credit") or mc.get("credit")
            return {
                "media_url": url,
                "media_type": "video" if is_vid else "image",
                "media_source_name": clean_text(credit, 100) if credit else None,
                "media_source_url": e.get("link"),
                "media_alt_text": clean_text(e.get("title"), 200),
                "media_license": clean_text(e.get("license") or e.get("rights"), 100),
            }
    # 2. Enclosures
    for enc in e.get("enclosures", []):
        url = enc.get("href") or enc.get("url")
        if url and (url.startswith("http://") or url.startswith("https://")):
            mime = enc.get("type", "")
            is_vid = is_video_url(url, mime)
            is_img = mime.startswith("image/") or any(url.lower().split("?")[0].endswith(ext) for ext in IMAGE_EXTS)
            if is_vid or is_img:
                return {
                    "media_url": url,
                    "media_type": "video" if is_vid else "image",
                    "media_source_name": None,
                    "media_source_url": e.get("link"),
                    "media_alt_text": clean_text(e.get("title"), 200),
                    "media_license": clean_text(e.get("license") or e.get("rights"), 100),
                }
    # 3. Media thumbnail
    for mt in e.get("media_thumbnail", []):
        url = mt.get("url")
        if url and (url.startswith("http://") or url.startswith("https://")):
            return {
                "media_url": url,
                "media_type": "image",
                "media_source_name": None,
                "media_source_url": e.get("link"),
                "media_alt_text": clean_text(e.get("title"), 200),
                "media_license": clean_text(e.get("license") or e.get("rights"), 100),
            }
    # 4. Links with enclosure rel or image/video MIME
    for link in e.get("links", []):
        url = link.get("href")
        mime = link.get("type", "")
        if url and (url.startswith("http://") or url.startswith("https://")):
            if is_video_url(url, mime):
                return {
                    "media_url": url,
                    "media_type": "video",
                    "media_source_name": None,
                    "media_source_url": e.get("link"),
                    "media_alt_text": clean_text(e.get("title"), 200),
                    "media_license": clean_text(e.get("license") or e.get("rights"), 100),
                }
            if mime.startswith("image/") or any(url.lower().split("?")[0].endswith(ext) for ext in IMAGE_EXTS):
                return {
                    "media_url": url,
                    "media_type": "image",
                    "media_source_name": None,
                    "media_source_url": e.get("link"),
                    "media_alt_text": clean_text(e.get("title"), 200),
                    "media_license": clean_text(e.get("license") or e.get("rights"), 100),
                }
    return {
        "media_url": None, "media_type": None, "media_source_name": None,
        "media_source_url": None, "media_alt_text": None, "media_license": None
    }


def clean_text(s: str | None, limit: int | None = None) -> str:
    if isinstance(s, list):
        s = s[0] if s else ""
    if isinstance(s, dict):
        s = s.get("content") or s.get("value") or ""
    s = html.unescape(TAG_RE.sub(" ", str(s) if s is not None else ""))
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
    media_url: str | None = None
    media_type: str | None = None
    media_source_name: str | None = None
    media_source_url: str | None = None
    media_alt_text: str | None = None
    media_license: str | None = None


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
        media = extract_feed_media(e)
        out.append(Candidate(
            title=title,
            url=link,
            published_at=published,
            excerpt=excerpt,
            media_url=media["media_url"],
            media_type=media["media_type"],
            media_source_name=media["media_source_name"],
            media_source_url=media["media_source_url"],
            media_alt_text=media["media_alt_text"],
            media_license=media["media_license"]
        ))
    return out


INSERT_SQL = """
insert into source_articles (source_id, run_id, canonical_url, title, title_norm, published_at, excerpt, content_hash,
                             media_url, media_type, media_source_name, media_source_url, media_alt_text, media_license)
values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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

        media_url = None
        media_type = None
        media_source_name = None
        media_source_url = None
        media_alt_text = None
        media_license = None
        if c.media_url:
            try:
                norm_media = normalize_url(c.media_url)
                if not cfg.allow_private:
                    assert_public_url(norm_media)
                media_url = norm_media
                media_type = c.media_type
                media_source_name = c.media_source_name or source["name"]
                media_source_url = c.media_source_url or url
                media_alt_text = c.media_alt_text or c.title
                media_license = c.media_license
            except (ValueError, UnsafeURL):
                # Unsafe or invalid media url: reject media without dropping article
                media_url = None

        existing = conn.execute("select id, title_norm, media_url from source_articles where canonical_url = %s", (url,)).fetchone()
        if existing:
            if existing["title_norm"] != tnorm:
                _record_source_change(conn, existing["id"], c.title, tnorm)
                stats["source_changed"] += 1
            else:
                stats["seen"] += 1
            if media_url and not existing["media_url"]:
                conn.execute(
                    """update source_articles set
                         media_url = %s, media_type = %s, media_source_name = %s,
                         media_source_url = %s, media_alt_text = %s, media_license = %s
                       where id = %s""",
                    (media_url, media_type, media_source_name, media_source_url, media_alt_text, media_license, existing["id"]))
            continue
        row = conn.execute(INSERT_SQL, (source["id"], run_id, url, c.title, tnorm, c.published_at,
                                        c.excerpt, title_hash(tnorm),
                                        media_url, media_type, media_source_name,
                                        media_source_url, media_alt_text, media_license)).fetchone()
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
# worker/app/extract.py
from __future__ import annotations

import logging
import re
from urllib.parse import urljoin

import trafilatura

from .errors import AccessDenied, MalformedContent, PermanentError, TransientError, UnsafeURL
from .fetcher import robots_allows, safe_get, with_retries
from .urls import assert_public_url, normalize_url

logger = logging.getLogger(__name__)

OG_VIDEO_RE = re.compile(r'<meta\s+[^>]*property=["\']og:video(?::url)?["\']\s+[^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)
OG_VIDEO_RE_REV = re.compile(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*property=["\']og:video(?::url)?["\']', re.IGNORECASE)

OG_IMAGE_RE = re.compile(r'<meta\s+[^>]*property=["\']og:image(?::url)?["\']\s+[^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)
OG_IMAGE_RE_REV = re.compile(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*property=["\']og:image(?::url)?["\']', re.IGNORECASE)

TWITTER_IMG_RE = re.compile(r'<meta\s+[^>]*name=["\']twitter:image["\']\s+[^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)
TWITTER_IMG_RE_REV = re.compile(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*name=["\']twitter:image["\']', re.IGNORECASE)

OG_ALT_RE = re.compile(r'<meta\s+[^>]*property=["\']og:image:alt["\']\s+[^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)
OG_SITE_RE = re.compile(r'<meta\s+[^>]*property=["\']og:site_name["\']\s+[^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)


def extract_html_media(html_str: str, page_url: str) -> dict[str, str | None]:
    video_m = OG_VIDEO_RE.search(html_str) or OG_VIDEO_RE_REV.search(html_str)
    if video_m:
        raw_url = video_m.group(1).strip()
        abs_url = urljoin(page_url, raw_url)
        return {
            "media_url": abs_url,
            "media_type": "video",
            "media_source_name": None,
            "media_source_url": page_url,
            "media_alt_text": None,
            "media_license": None,
        }

    image_m = (
        OG_IMAGE_RE.search(html_str)
        or OG_IMAGE_RE_REV.search(html_str)
        or TWITTER_IMG_RE.search(html_str)
        or TWITTER_IMG_RE_REV.search(html_str)
    )
    if image_m:
        raw_url = image_m.group(1).strip()
        abs_url = urljoin(page_url, raw_url)
        alt_m = OG_ALT_RE.search(html_str)
        site_m = OG_SITE_RE.search(html_str)
        return {
            "media_url": abs_url,
            "media_type": "image",
            "media_source_name": site_m.group(1).strip() if site_m else None,
            "media_source_url": page_url,
            "media_alt_text": alt_m.group(1).strip() if alt_m else None,
            "media_license": None,
        }

    return {
        "media_url": None,
        "media_type": None,
        "media_source_name": None,
        "media_source_url": None,
        "media_alt_text": None,
        "media_license": None,
    }


def title_matches_text(title: str, text: str, threshold: float = 0.4) -> bool:
    words = {w for w in re.findall(r"[a-z0-9]+", title.lower()) if len(w) > 3}
    if not words:
        return True
    hay = text.lower()
    return sum(1 for w in words if w in hay) / len(words) >= threshold


def fetch_fulltext(
    url: str,
    title: str,
    cfg,
    *,
    fetch=safe_get,
    max_chars: int = 12000,
    out_media: dict | None = None,
) -> str | None:
    def fetcher(u, **kw):
        return fetch(u, user_agent=cfg.user_agent, allow_private=cfg.allow_private, **kw)

    try:
        if not robots_allows(url, cfg.user_agent, lambda u: fetcher(u)):
            return None
        resp = with_retries(lambda: fetcher(url), attempts=2)
    except (AccessDenied, UnsafeURL, TransientError, PermanentError, MalformedContent):
        return None

    if out_media is not None:
        try:
            head_snippet = resp.body[:16384].decode("utf-8", errors="ignore")
            extracted = extract_html_media(head_snippet, url)
            if extracted.get("media_url"):
                norm_media = normalize_url(extracted["media_url"])
                if not cfg.allow_private:
                    assert_public_url(norm_media)
                extracted["media_url"] = norm_media
                out_media.update(extracted)
        except Exception as exc:
            logger.debug(f"Media extraction from HTML failed for {url}: {exc}")

    text = trafilatura.extract(resp.body, include_comments=False, include_tables=False, favor_precision=True)
    if not text or len(text) < 200 or not title_matches_text(title, text):
        return None  # wrong or corrupted page: fall back to the excerpt rather than trust it
    return text[:max_chars]
# worker/app/extract.py
from __future__ import annotations

import re

import trafilatura

from .errors import AccessDenied, MalformedContent, PermanentError, TransientError, UnsafeURL
from .fetcher import robots_allows, safe_get, with_retries


def title_matches_text(title: str, text: str, threshold: float = 0.4) -> bool:
    words = {w for w in re.findall(r"[a-z0-9]+", title.lower()) if len(w) > 3}
    if not words:
        return True
    hay = text.lower()
    return sum(1 for w in words if w in hay) / len(words) >= threshold


def fetch_fulltext(url: str, title: str, cfg, *, fetch=safe_get, max_chars: int = 12000) -> str | None:
    def fetcher(u, **kw):
        return fetch(u, user_agent=cfg.user_agent, allow_private=cfg.allow_private, **kw)
    try:
        if not robots_allows(url, cfg.user_agent, lambda u: fetcher(u)):
            return None
        resp = with_retries(lambda: fetcher(url), attempts=2)
    except (AccessDenied, UnsafeURL, TransientError, PermanentError, MalformedContent):
        return None
    text = trafilatura.extract(resp.body, include_comments=False, include_tables=False, favor_precision=True)
    if not text or len(text) < 200 or not title_matches_text(title, text):
        return None  # wrong or corrupted page: fall back to the excerpt rather than trust it
    return text[:max_chars]
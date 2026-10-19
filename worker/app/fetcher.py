# worker/app/fetcher.py
from __future__ import annotations

import random
import time
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit
from urllib.robotparser import RobotFileParser

import httpx

from .errors import AccessDenied, MalformedContent, PermanentError, TransientError
from .urls import assert_public_url

MAX_REDIRECTS = 3


@dataclass
class Fetched:
    status: int
    body: bytes
    final_url: str
    headers: dict[str, str]


def safe_get(url: str, *, user_agent: str, extra_headers: dict[str, str] | None = None,
             timeout: float = 15.0, max_bytes: int = 2_000_000, allow_private: bool = False) -> Fetched:
    headers = {"User-Agent": user_agent, "Accept": "*/*"}
    headers.update(extra_headers or {})
    current = url
    with httpx.Client(timeout=timeout, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            assert_public_url(current, allow_private=allow_private)  # re-checked on every hop
            try:
                with client.stream("GET", current, headers=headers) as resp:
                    code = resp.status_code
                    if code in (301, 302, 303, 307, 308):
                        location = resp.headers.get("location")
                        if not location:
                            raise MalformedContent("redirect without a Location header")
                        current = urljoin(current, location)
                        continue
                    if code in (401, 403, 451):
                        raise AccessDenied(f"HTTP {code} from {urlsplit(current).netloc}")
                    if code == 429 or code >= 500:
                        raise TransientError(f"HTTP {code} from {urlsplit(current).netloc}")
                    if code == 304:
                        return Fetched(304, b"", current, dict(resp.headers))
                    if code >= 400:
                        raise PermanentError(f"HTTP {code} from {urlsplit(current).netloc}")
                    chunks, total = [], 0
                    for chunk in resp.iter_bytes():
                        total += len(chunk)
                        if total > max_bytes:
                            raise MalformedContent("response larger than the size cap")
                        chunks.append(chunk)
                    return Fetched(code, b"".join(chunks), current, dict(resp.headers))
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                raise TransientError(str(exc)) from exc
    raise MalformedContent("too many redirects")


def with_retries(fn, *, attempts: int = 3, base_delay: float = 2.0, sleep=time.sleep):
    """Retry only transient failures, with exponential backoff and jitter."""
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            sleep(base_delay * (2 ** i) + random.uniform(0, 0.5))


_robots_cache: dict[str, RobotFileParser] = {}


def robots_allows(url: str, user_agent: str, fetch) -> bool:
    """Fail closed: if robots.txt cannot be read reliably, do not fetch the page."""
    parts = urlsplit(url)
    origin = f"{parts.scheme}://{parts.netloc}"
    rp = _robots_cache.get(origin)
    if rp is None:
        rp = RobotFileParser()
        try:
            resp = fetch(origin + "/robots.txt")
            rp.parse(resp.body.decode("utf-8", "replace").splitlines())
        except PermanentError:       # 404/410: no robots file means no restrictions
            rp.allow_all = True
        except Exception:            # denied, unreachable, unsafe: assume disallowed
            rp.disallow_all = True
        _robots_cache[origin] = rp
    return rp.can_fetch(user_agent.split("/")[0], url)
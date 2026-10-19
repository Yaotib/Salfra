from __future__ import annotations

import ipaddress
import socket
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .errors import UnsafeURL

TRACKING_KEYS = {"fbclid", "gclid", "mc_cid", "mc_eid", "ref", "ref_src", "igshid", "spm", "cmpid"}


def normalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    scheme = parts.scheme.lower()
    if scheme not in ("http", "https"):
        raise ValueError(f"unsupported scheme: {parts.scheme!r}")
    host = parts.hostname
    if not host:
        raise ValueError("missing host")
    if parts.username or parts.password:
        raise ValueError("credentials in URL")
    host = host.lower().rstrip(".")
    if ":" in host:  # IPv6 literal
        host = f"[{host}]"
    port = parts.port
    default_port = 80 if scheme == "http" else 443
    netloc = host if port in (None, default_port) else f"{host}:{port}"
    query = sorted(
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if not (k.lower().startswith("utm_") or k.lower() in TRACKING_KEYS)
    )
    path = parts.path or "/"
    if len(path) > 1:
        path = path.rstrip("/") or "/"
    return urlunsplit((scheme, netloc, path, urlencode(query), ""))


def assert_public_url(url: str, *, allow_private: bool = False) -> None:
    """Raise UnsafeURL unless every address the host resolves to is publicly routable."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https"):
        raise UnsafeURL(f"unsupported scheme: {parts.scheme!r}")
    host = parts.hostname
    if not host:
        raise UnsafeURL("missing host")
    if parts.username or parts.password:
        raise UnsafeURL("credentials in URL")
    if allow_private:
        return
    try:
        infos = socket.getaddrinfo(host, parts.port or (443 if parts.scheme == "https" else 80),
                                   type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise UnsafeURL(f"cannot resolve {host}") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.version == 6 and ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        if not ip.is_global:
            raise UnsafeURL(f"{host} resolves to a non-public address")
# worker/app/alerts.py
from __future__ import annotations

import sys

import httpx


def send_alert(conn, cfg, key: str, subject: str, body: str, cooldown_hours: int = 6) -> bool:
    """Send an alert at most once per cooldown per key. Never include secrets in `body`."""
    row = conn.execute(
        "select (now() - last_sent_at) < make_interval(hours => %s) as recent from alert_log where key = %s",
        (cooldown_hours, key),
    ).fetchone()
    if row and row["recent"]:
        conn.execute("update alert_log set suppressed = suppressed + 1 where key = %s", (key,))
        return False
    conn.execute(
        """insert into alert_log (key, last_sent_at, suppressed) values (%s, now(), 0)
           on conflict (key) do update set last_sent_at = now(), suppressed = 0""", (key,))
    _deliver(cfg, subject, body)
    return True


def _deliver(cfg, subject: str, body: str) -> None:
    print(f"[ALERT] {subject}: {body}", file=sys.stderr)
    webhook_url = getattr(cfg, "alert_webhook_url", None)
    if not webhook_url:
        return
    try:
        # Payload supports Discord, Slack, and generic webhook endpoints
        payload = {
            "text": f"*[ALERT] {subject}*\n{body}",
            "content": f"**[ALERT] {subject}**\n{body}",
            "embeds": [{
                "title": f"[ALERT] {subject}",
                "description": body,
                "color": 0xFFA500,
            }],
        }
        resp = httpx.post(webhook_url, json=payload, timeout=10.0)
        if resp.status_code >= 400:
            print(f"alert webhook delivery error {resp.status_code}: {resp.text}", file=sys.stderr)
    except Exception as exc:  # an alerting failure must never crash a run
        print(f"alert delivery failed: {exc}", file=sys.stderr)


def ping(url: str | None, suffix: str = "") -> None:
    """Heartbeat ping. The `/fail` suffix convention depends on your service [VERIFY]."""
    if not url:
        return
    try:
        httpx.get(url.rstrip("/") + suffix, timeout=10)
    except httpx.HTTPError as exc:
        print(f"heartbeat ping failed: {exc}", file=sys.stderr)
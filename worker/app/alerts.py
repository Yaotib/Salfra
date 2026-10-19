# worker/app/alerts.py
from __future__ import annotations

import smtplib
import sys
from email.message import EmailMessage

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
    if not (cfg.smtp_host and cfg.alert_to):
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = f"[AI News] {subject}"
        msg["From"] = cfg.alert_from or cfg.alert_to
        msg["To"] = cfg.alert_to
        msg.set_content(body)
        with smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=20) as smtp:
            smtp.starttls()
            if cfg.smtp_user:
                smtp.login(cfg.smtp_user, cfg.smtp_password or "")
            smtp.send_message(msg)
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
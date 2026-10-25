# worker/tests/test_alerts.py
from unittest.mock import MagicMock, patch
import httpx
import pytest

from app.alerts import _deliver, ping
from app.config import Config, load_config


def test_deliver_without_webhook_url(capsys):
    cfg = MagicMock(alert_webhook_url=None)
    _deliver(cfg, "Test Subject", "Test Body")
    captured = capsys.readouterr()
    assert "[ALERT] Test Subject: Test Body" in captured.err


def test_deliver_with_webhook_url_success(capsys):
    cfg = MagicMock(alert_webhook_url="https://webhook.example/alerts")
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock(status_code=200)
        mock_post.return_value = mock_resp
        _deliver(cfg, "Disk Warning", "Disk space is low")

        mock_post.assert_called_once()
        call_args, call_kwargs = mock_post.call_args
        assert call_args[0] == "https://webhook.example/alerts"
        payload = call_kwargs["json"]
        assert "Disk Warning" in payload["text"]
        assert "Disk space is low" in payload["text"]
        assert "Disk Warning" in payload["content"]
        assert payload["embeds"][0]["title"] == "[ALERT] Disk Warning"

    captured = capsys.readouterr()
    assert "[ALERT] Disk Warning: Disk space is low" in captured.err


def test_deliver_with_webhook_http_error_logged(capsys):
    cfg = MagicMock(alert_webhook_url="https://webhook.example/alerts")
    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock(status_code=500, text="Internal Server Error")
        mock_post.return_value = mock_resp
        _deliver(cfg, "Error Subject", "Error Body")

    captured = capsys.readouterr()
    assert "alert webhook delivery error 500: Internal Server Error" in captured.err


def test_deliver_with_network_exception_logged(capsys):
    cfg = MagicMock(alert_webhook_url="https://webhook.example/alerts")
    with patch("httpx.post", side_effect=httpx.ConnectTimeout("Connection timed out")):
        _deliver(cfg, "Timeout Subject", "Timeout Body")

    captured = capsys.readouterr()
    assert "alert delivery failed: Connection timed out" in captured.err


def test_ping_success():
    with patch("httpx.get") as mock_get:
        ping("https://hc-ping.example/check-in")
        mock_get.assert_called_once_with("https://hc-ping.example/check-in", timeout=10)


def test_ping_failure_logged(capsys):
    with patch("httpx.get", side_effect=httpx.ConnectError("Ping failed")):
        ping("https://hc-ping.example/check-in")
    captured = capsys.readouterr()
    assert "heartbeat ping failed: Ping failed" in captured.err


def test_config_loads_alert_webhook_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://discord.com/api/webhooks/123/abc")
    cfg = load_config()
    assert cfg.alert_webhook_url == "https://discord.com/api/webhooks/123/abc"

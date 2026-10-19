from __future__ import annotations

import os
from dataclasses import dataclass


def _get(name: str, default: str | None = None, required: bool = False) -> str | None:
    value = os.environ.get(name, default)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value or None


@dataclass(frozen=True)
class Config:
    database_url: str
    env: str
    user_agent: str
    allow_private: bool
    llm_base_url: str | None
    llm_api_key: str | None
    llm_model: str | None
    llm_json_mode: bool
    llm_min_interval: float
    llm_reasoning_effort=_get("LLM_REASONING_EFFORT"),
    heartbeat_url: str | None
    monitor_heartbeat_url: str | None
    smtp_host: str | None
    smtp_port: int
    smtp_user: str | None
    smtp_password: str | None
    alert_to: str | None
    alert_from: str | None
    max_articles_per_run: int
    max_items_per_source: int

    @property
    def llm_configured(self) -> bool:
        return bool(self.llm_base_url and self.llm_api_key and self.llm_model)


def load_config() -> Config:
    env = _get("ENV", "prod")
    return Config(
        database_url=_get("DATABASE_URL", required=True),
        env=env,
        user_agent=_get("USER_AGENT", "AINewsCurator/0.1 (set USER_AGENT with a contact URL)"),
        # private-address fetching is only ever honoured in dev, never in production
        allow_private=(env == "dev" and _get("ALLOW_PRIVATE_FETCH") == "1"),
        llm_base_url=(_get("LLM_BASE_URL") or "").rstrip("/") or None,
        llm_api_key=_get("LLM_API_KEY"),
        llm_model=_get("LLM_MODEL"),
        llm_json_mode=_get("LLM_JSON_MODE", "1") == "1",
        llm_min_interval=float(_get("LLM_MIN_INTERVAL_SECONDS", "4")),
        heartbeat_url=_get("HEARTBEAT_URL"),
        monitor_heartbeat_url=_get("MONITOR_HEARTBEAT_URL"),
        smtp_host=_get("SMTP_HOST"),
        smtp_port=int(_get("SMTP_PORT", "587")),
        smtp_user=_get("SMTP_USER"),
        smtp_password=_get("SMTP_PASSWORD"),
        alert_to=_get("ALERT_EMAIL_TO"),
        alert_from=_get("ALERT_EMAIL_FROM"),
        max_articles_per_run=int(_get("MAX_ARTICLES_PER_RUN", "40")),
        max_items_per_source=int(_get("MAX_ITEMS_PER_SOURCE", "40")),
    )
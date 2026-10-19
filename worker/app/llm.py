# worker/app/llm.py
from __future__ import annotations

import json
import re
import time

import httpx
from pydantic import BaseModel, ValidationError

from .db import get_setting
from .errors import BudgetExceeded, InvalidModelOutput, ProviderUnavailable

FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.I)


class LLMClient:
    def __init__(self, conn, cfg, *, sleep=time.sleep):
        if not cfg.llm_configured:
            raise RuntimeError("LLM_BASE_URL, LLM_API_KEY and LLM_MODEL must be set")
        self.conn, self.cfg, self.sleep = conn, cfg, sleep
        self._last_call = 0.0

    def _check_budget(self) -> None:
        budget = int(get_setting(self.conn, "llm_daily_call_budget", 150))
        used = self.conn.execute("select count(*) as n from llm_usage where at >= date_trunc('day', now())").fetchone()["n"]
        if used >= budget:
            raise BudgetExceeded(f"daily LLM call budget of {budget} reached")

    def _pace(self) -> None:
        wait = self.cfg.llm_min_interval - (time.monotonic() - self._last_call)
        if wait > 0:
            self.sleep(wait)
        self._last_call = time.monotonic()

    def _log(self, task: str, usage: dict, ok: bool) -> None:
        self.conn.execute(
            "insert into llm_usage (task, model, prompt_tokens, completion_tokens, ok) values (%s, %s, %s, %s, %s)",
            (task, self.cfg.llm_model, usage.get("prompt_tokens"), usage.get("completion_tokens"), ok))

    def _post(self, messages: list[dict]) -> tuple[str, dict]:
        payload = {"model": self.cfg.llm_model, "messages": messages, "temperature": 0}
        if self.cfg.llm_json_mode:
            payload["response_format"] = {"type": "json_object"}
        if self.cfg.llm_reasoning_effort:
            payload["reasoning_effort"] = self.cfg.llm_reasoning_effort

        url = f"{self.cfg.llm_base_url.rstrip('/')}/chat/completions"
        headers = {"Authorization": f"Bearer {self.cfg.llm_api_key}"}  # never logged
        last = "no attempt made"
        for attempt in range(3):
            self._pace()
            try:
                r = httpx.post(url, json=payload, headers=headers, timeout=90)
            except httpx.HTTPError as exc:
                last = f"network error: {type(exc).__name__}: {str(exc)[:200]}"
                print(f"LLM attempt {attempt + 1}: {last} (url={url})", flush=True)
                self.sleep(2 ** attempt * 3)
                continue
            if r.status_code == 429 or r.status_code >= 500:
                last = f"HTTP {r.status_code}: {r.text[:300]}"
                print(f"LLM attempt {attempt + 1}: {last}", flush=True)
                retry_after = r.headers.get("retry-after", "")
                self.sleep(min(60, int(retry_after)) if retry_after.isdigit() else 2 ** attempt * 5)
                continue
            if r.status_code >= 400:
                print(f"LLM HTTP {r.status_code}: {r.text[:500]}", flush=True)
                raise ProviderUnavailable(f"provider returned HTTP {r.status_code}: {r.text[:200]}")
            body = r.json()
            try:
                return body["choices"][0]["message"]["content"] or "", body.get("usage") or {}
            except (KeyError, IndexError, TypeError) as exc:
                print(f"LLM unexpected response shape: {r.text[:300]}", flush=True)
                raise ProviderUnavailable("unexpected response shape from provider") from exc
        raise ProviderUnavailable(f"provider failed after retries; last: {last}")

    def complete_json(self, *, task: str, system: str, user: str, schema: type[BaseModel]) -> BaseModel:
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        last_error = ""
        for _ in range(2):  # one repair attempt
            self._check_budget()
            raw, usage = self._post(messages)
            try:
                result = schema.model_validate(json.loads(FENCE_RE.sub("", raw.strip())))
                self._log(task, usage, ok=True)
                return result
            except (json.JSONDecodeError, ValidationError) as exc:
                self._log(task, usage, ok=False)
                last_error = str(exc)[:300]
                messages += [
                    {"role": "assistant", "content": raw},
                    {"role": "user", "content": "That reply was invalid. Return ONLY a JSON object matching the "
                                                f"required keys and allowed values. Problem: {last_error}"},
                ]
        raise InvalidModelOutput(f"{task}: {last_error}")
# worker/app/schemas.py
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

StoryType = Literal["research", "product_release", "security", "policy", "funding_business",
                    "opinion", "educational", "event", "jobs", "other"]
Sensitivity = Literal["allegation", "legal_regulatory", "financial", "security_vulnerability",
                      "health_safety", "leaked_data", "other_high_impact"]


def _clip(v, n):
    return v[:n] if isinstance(v, str) else v


class Relevance(BaseModel):
    relevant: bool
    reason: str = ""
    story_type: StoryType = "other"
    categories: list[Literal["AI News", "Global Tech", "Product Releases"]] = Field(default_factory=list)
    region: Literal["global", "africa", "ghana"] = "global"
    entities: list[str] = Field(default_factory=list)
    is_rumor_or_leak: bool = False
    is_promotional: bool = False
    novelty: Literal["new", "follow_up", "rehash"] = "new"
    sensitivity: list[Sensitivity] = Field(default_factory=list)

    @field_validator("reason", mode="before")
    @classmethod
    def _reason(cls, v):
        return _clip(v, 300)

    @field_validator("entities", mode="before")
    @classmethod
    def _entities(cls, v):
        if not isinstance(v, list):
            return []
        out, seen = [], set()
        for item in v:
            if isinstance(item, str):
                item = item.strip()[:80]
                if item and item.lower() not in seen:
                    seen.add(item.lower())
                    out.append(item)
        return out[:12]


class SameEvent(BaseModel):
    relationship: Literal["same_event", "follow_up", "unrelated"]
    reason: str = ""
    adds_new_information: bool = False
    is_syndicated_copy: bool = False

    @field_validator("reason", mode="before")
    @classmethod
    def _reason(cls, v):
        return _clip(v, 300)


class Claim(BaseModel):
    text: str
    source_index: int
    quote: str


class Summary(BaseModel):
    sufficient_evidence: bool
    headline: str = ""
    card_summary: str = ""
    what_happened: str = ""
    why_it_matters: str = ""
    uncertain: str = ""
    conflicting_reports: bool = False
    claims: list[Claim] = Field(default_factory=list)

    @field_validator("headline", "card_summary", "what_happened", "why_it_matters", "uncertain", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else (v or "")
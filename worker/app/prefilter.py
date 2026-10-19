# worker/app/prefilter.py
from __future__ import annotations

import re

EXCLUDE = [
    re.compile(r"\b(deals?|discounts?|coupons?|promo code|giveaway|sponsored|black friday)\b", re.I),
    re.compile(r"^\s*(the\s+)?(top|best)\s+\d+\b", re.I),
    re.compile(r"\b\d+\s+(best|ways|things|tips|reasons)\b", re.I),
]


def prefilter(title: str, excerpt: str | None) -> str | None:
    """Return a rejection reason, or None to continue. Cheap rules run before any LLM call."""
    if len(title.strip()) < 15:
        return "title too short"
    for pattern in EXCLUDE:
        if pattern.search(title):
            return "deal, listicle or sponsored pattern in title"
    return None
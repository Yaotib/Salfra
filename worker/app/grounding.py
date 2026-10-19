# worker/app/grounding.py
from __future__ import annotations

import re
from dataclasses import dataclass

from .schemas import Summary

SMART = str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
                       "\u2013": "-", "\u2014": "-", "\u00a0": " "})
NUM_RE = re.compile(r"\d[\d,]*(?:\.\d+)?")
QUOTE_RE = re.compile(r'"([^"]{3,})"')
URL_RE = re.compile(r"https?://|www\.", re.I)


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.translate(SMART)).strip().lower()


@dataclass
class EvidenceItem:
    index: int
    article_id: str
    publisher: str
    url: str
    text: str
    is_primary: bool


@dataclass
class ValidationResult:
    ok: bool
    problems: list[str]


def validate_summary(summary: Summary, evidence: list[EvidenceItem], *, limited: bool) -> ValidationResult:
    problems: list[str] = []
    if not 10 <= len(summary.headline) <= 140:
        problems.append("headline must be 10-140 characters")
    if not 40 <= len(summary.card_summary) <= 450:
        problems.append("card_summary must be 40-450 characters")
    if len(summary.what_happened) < 40:
        problems.append("what_happened is too short")
    if limited and summary.why_it_matters:
        problems.append("limited entries must leave why_it_matters empty")

    texts = [norm(e.text) for e in evidence]
    corpus = " ".join(texts)
    corpus_digits = corpus.replace(",", "")

    need = 1 if limited else 2
    if len(summary.claims) < need:
        problems.append(f"at least {need} claim(s) with quotes are required")
    for i, c in enumerate(summary.claims):
        if not 0 <= c.source_index < len(evidence):
            problems.append(f"claim {i}: invalid source_index")
            continue
        q = norm(c.quote)
        if not 15 <= len(q) <= 240:
            problems.append(f"claim {i}: quote must be 15-240 characters")
        elif q not in texts[c.source_index]:
            problems.append(f"claim {i}: quote not found in source {c.source_index}")

    fields = {"headline": summary.headline, "card_summary": summary.card_summary,
              "what_happened": summary.what_happened, "why_it_matters": summary.why_it_matters,
              "uncertain": summary.uncertain}
    for name, text in fields.items():
        text = text.translate(SMART)
        if URL_RE.search(text):
            problems.append(f"{name}: contains a URL")
        for m in NUM_RE.findall(text):
            n = m.replace(",", "")
            if not re.search(rf"(?<![\d.]){re.escape(n)}(?!\d)", corpus_digits):
                problems.append(f"{name}: number '{m}' does not appear in the sources")
        for quoted in QUOTE_RE.findall(text):
            if len(quoted.split()) > 25:
                problems.append(f"{name}: quotation longer than 25 words")
            if norm(quoted) not in corpus:
                problems.append(f"{name}: quoted text not found in the sources")
    return ValidationResult(not problems, problems)
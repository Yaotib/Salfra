# worker/app/risk.py
from __future__ import annotations

from .schemas import Relevance, Summary
from .signals import ALLEGATION_RE, FINANCIAL_RE, SECURITY_RE

HIGH_IMPACT = {"allegation", "legal_regulatory", "financial", "health_safety", "leaked_data",
               "other_high_impact", "material_contradiction", "suspicious_content"}


def compute_risk(rel: Relevance, summary: Summary, evidence_text: str, *, label: str, suspicious: bool):
    flags = set(rel.sensitivity)
    if summary.conflicting_reports:
        flags.add("material_contradiction")
    blob = f"{summary.headline} {summary.what_happened} {evidence_text[:4000]}"
    if SECURITY_RE.search(blob):
        flags.add("security_vulnerability")
    if ALLEGATION_RE.search(blob):
        flags.add("allegation")
    if FINANCIAL_RE.search(blob):
        flags.add("financial")
    if suspicious:
        flags.add("suspicious_content")
    if label == "single_source" and flags & HIGH_IMPACT:
        flags.add("single_source_high_impact")
    if flags & HIGH_IMPACT:
        priority = 100
    elif "security_vulnerability" in flags:
        priority = 50
    else:
        priority = 0
    return sorted(flags), priority
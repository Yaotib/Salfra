# worker/app/signals.py
import re

CORRECTION_RE = re.compile(r"\b(correction|corrected|retraction|retracted|withdrawn|editor'?s note)\b", re.I)
INJECTION_RE = re.compile(
    r"(ignore (all |any )?(previous|prior|above) (instructions|prompts)"
    r"|disregard (the )?(system|previous) (prompt|instructions)"
    r"|reveal (your )?(system prompt|api key|secret)|<\s*/?\s*system\s*>)", re.I)
SECURITY_RE = re.compile(
    r"\b(CVE-\d{4}-\d{4,}|zero-day|0-day|exploit(ed|s|ation)?|ransomware|data breach"
    r"|vulnerabilit(y|ies)|remote code execution)\b", re.I)
ALLEGATION_RE = re.compile(r"\b(alleg(es|ed|ation|ations)|accused|lawsuit|sues|sued|fraud|indicted)\b", re.I)
FINANCIAL_RE = re.compile(r"\b(ipo|stock price|share price|market cap|short seller|insider trading)\b", re.I)
# worker/app/summarize.py
from __future__ import annotations

from .extract import fetch_fulltext
from .grounding import EvidenceItem, validate_summary
from .prompts import SUMMARY_TASK, build_prompt
from .schemas import Summary

LIMITED_MIN_CHARS = 400


def build_evidence(cfg, articles: list[dict], transient: dict | None = None, *, fetch_text=fetch_fulltext) -> list[EvidenceItem]:
    transient = transient or {}
    per_source = max(1500, 12000 // max(1, len(articles)))
    items = []
    for i, a in enumerate(articles):
        body = transient.get(str(a["id"]))
        if body is None and a["allow_fulltext"]:
            body = fetch_text(a["canonical_url"], a["title"], cfg)
        text = f"{a['title']}\n\n{body or a['excerpt'] or ''}"[:per_source]
        items.append(EvidenceItem(i, str(a["id"]), a["publisher"], a["canonical_url"], text, bool(a["is_primary"])))
    return items


def is_limited(evidence: list[EvidenceItem]) -> bool:
    return sum(len(e.text) for e in evidence) < LIMITED_MIN_CHARS


def llm_summarize(llm, evidence, story_type: str, limited: bool, feedback: str | None) -> Summary:
    trusted = "Sources:\n" + "\n".join(
        f"[{e.index}] {e.publisher}{' (official/primary source)' if e.is_primary else ''}" for e in evidence)
    trusted += f"\nStory type: {story_type}\nMode: " + (
        "LIMITED (only a headline and short excerpt are available)" if limited else "FULL")
    if feedback:
        trusted += f"\nYour previous attempt was rejected. Fix these problems: {feedback}"
    system, user = build_prompt(SUMMARY_TASK, trusted, {f"SOURCE {e.index}": e.text for e in evidence})
    return llm.complete_json(task="summary", system=system, user=user, schema=Summary)


def generate_validated_summary(llm, evidence, story_type: str, limited: bool):
    """Returns (summary | None, outcome, detail); outcome is 'ok', 'insufficient' or 'invalid'."""
    feedback = None
    for _ in range(2):
        summary = llm_summarize(llm, evidence, story_type, limited, feedback)
        if not summary.sufficient_evidence:
            return None, "insufficient", "model reported insufficient evidence"
        result = validate_summary(summary, evidence, limited=limited)
        if result.ok:
            return summary, "ok", ""
        feedback = "; ".join(result.problems)[:600]
    return None, "invalid", feedback


def claims_payload(summary: Summary, evidence: list[EvidenceItem]) -> list[dict]:
    return [{"text": c.text, "quote": c.quote, "article_id": evidence[c.source_index].article_id,
             "publisher": evidence[c.source_index].publisher, "url": evidence[c.source_index].url}
            for c in summary.claims if 0 <= c.source_index < len(evidence)]
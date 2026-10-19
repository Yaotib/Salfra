# worker/app/evaluate.py
from __future__ import annotations

from .prompts import RELEVANCE_TASK, SAME_EVENT_TASK, build_prompt
from .schemas import Relevance, SameEvent


def assess_relevance(llm, a, text: str | None) -> Relevance:
    trusted = f"Publisher: {a['publisher']} (region hint: {a['region_hint']})"
    system, user = build_prompt(RELEVANCE_TASK, trusted, {
        "TITLE": a["title"], "EXCERPT": a["excerpt"] or "", "TEXT": (text or "")[:4000]})
    return llm.complete_json(task="relevance", system=system, user=user, schema=Relevance)


def decide_relevance(rel: Relevance) -> tuple[str, str | None]:
    if not rel.relevant:
        return "reject", f"not relevant: {rel.reason}"
    if rel.is_rumor_or_leak:
        return "reject", "rumour or unverified leak"
    if rel.is_promotional:
        return "reject", "promotional content"
    if rel.novelty == "rehash":
        return "reject", "rehash with no new information"
    return "continue", None


def final_categories(rel: Relevance) -> list[str]:
    cats = list(rel.categories) or ["Global Tech"]
    if rel.story_type == "product_release" and "Product Releases" not in cats:
        cats.append("Product Releases")
    if rel.region in ("africa", "ghana") and "African Tech" not in cats:
        cats.append("African Tech")
    return cats


def assess_same_event(llm, a, candidate) -> SameEvent:
    system, user = build_prompt(SAME_EVENT_TASK, "", {
        "NEW_ITEM": f"{a['title']}\n{a['excerpt'] or ''}",
        "EXISTING_STORY": f"{candidate['headline']}\n{candidate['card_summary']}"})
    return llm.complete_json(task="same_event", system=system, user=user, schema=SameEvent)
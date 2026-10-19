# worker/app/grouping.py
from __future__ import annotations

WINDOW_DAYS = 5
MAX_CANDIDATES = 2  # LLM calls spent per article on same-event checks


def find_syndicated(conn, a):
    """Exact normalised-title match from a different publisher within 3 days: same wire copy, no LLM needed."""
    if len(a["title_norm"]) < 30:
        return None
    row = conn.execute(
        """select sa.story_id from source_articles o join story_articles sa on sa.article_id = o.id
           where o.content_hash = %s and o.source_id <> %s
             and coalesce(o.published_at, o.collected_at) > now() - interval '3 days' limit 1""",
        (a["content_hash"], a["source_id"])).fetchone()
    return row["story_id"] if row else None


def find_candidates(conn, title: str, entity_keys: list[str]) -> list[dict]:
    rows = conn.execute(
        """select s.id, s.headline, s.card_summary, s.entity_keys, similarity(s.headline, %(t)s) as sim
           from stories s
           where s.status <> 'withdrawn' and s.merged_into is null
             and s.first_reported_at > now() - make_interval(days => %(d)s)
             and (similarity(s.headline, %(t)s) > 0.2 or s.entity_keys && %(e)s::text[])
           order by sim desc limit 15""",
        {"t": title, "d": WINDOW_DAYS, "e": entity_keys}).fetchall()
    mine, scored = set(entity_keys), []
    for r in rows:
        theirs = set(r["entity_keys"])
        union = mine | theirs
        jaccard = len(mine & theirs) / len(union) if union else 0.0
        r["shared"] = sorted(mine & theirs)
        r["score"] = 0.6 * r["sim"] + 0.4 * jaccard
        if r["score"] >= 0.30 and (r["shared"] or r["sim"] >= 0.45):
            scored.append(r)
    return sorted(scored, key=lambda r: r["score"], reverse=True)[:MAX_CANDIDATES]
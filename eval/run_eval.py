# eval/run_eval.py
"""Usage (from repo root, with worker/.env loaded): python eval/run_eval.py relevance|grouping [--limit N]"""
from __future__ import annotations

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parents[1] / "worker"))

from app.config import load_config          # noqa: E402
from app.db import connect                  # noqa: E402
from app.evaluate import assess_relevance, assess_same_event  # noqa: E402
from app.llm import LLMClient               # noqa: E402

DATA = pathlib.Path(__file__).parent / "data"
OUT = pathlib.Path(__file__).parent / "out"


def load(name):
    return [json.loads(line) for line in (DATA / name).read_text().splitlines() if line.strip()]


def prf(tp, fp, fn):
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    return p, r, (2 * p * r / (p + r) if p + r else 0.0)


def main():
    mode = sys.argv[1]
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    cfg = load_config()
    conn = connect(cfg.database_url)
    llm = LLMClient(conn, cfg)
    OUT.mkdir(exist_ok=True)
    mismatches = []

    if mode == "relevance":
        rows = load("relevance.jsonl")[:limit]
        tp = fp = fn = tn = 0
        for row in rows:
            a = {**row, "publisher": row.get("publisher", "?"), "region_hint": row.get("region_hint", "global")}
            rel = assess_relevance(llm, a, None)
            pred = rel.relevant and not rel.is_rumor_or_leak and not rel.is_promotional and rel.novelty != "rehash"
            exp = row["expected_relevant"]
            tp += pred and exp
            fp += pred and not exp
            fn += (not pred) and exp
            tn += (not pred) and not exp
            if pred != exp:
                mismatches.append({"id": row["id"], "expected": exp, "got": pred, "reason": rel.reason})
        p, r, f1 = prf(tp, fp, fn)
        print(f"items={len(rows)} TP={tp} FP={fp} FN={fn} TN={tn} precision={p:.2f} recall={r:.2f} f1={f1:.2f}")
    else:
        rows = load("grouping.jsonl")[:limit]
        correct = 0
        for row in rows:
            a = {"title": row["b"]["title"], "excerpt": row["b"]["excerpt"]}
            cand = {"headline": row["a"]["title"], "card_summary": row["a"]["excerpt"]}
            got = assess_same_event(llm, a, cand).relationship
            correct += got == row["expected"]
            if got != row["expected"]:
                mismatches.append({"id": row["id"], "expected": row["expected"], "got": got})
        print(f"items={len(rows)} accuracy={correct / len(rows):.2f}")

    (OUT / f"{mode}_mismatches.json").write_text(json.dumps(mismatches, indent=2))
    print(f"{len(mismatches)} mismatches written to eval/out/{mode}_mismatches.json")


if __name__ == "__main__":
    main()
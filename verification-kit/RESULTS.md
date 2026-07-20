# Results

All numbers below are recomputable from this repo with `node verify.js`.
Dataset: **LongMemEval-M**. Grader: `scoring.js` (heuristic + `flexible` LLM judge).

## Headline

| Configuration | Variant | Score | Published rows |
|---|---|---|---|
| **Full engine** (baseline + consolidation) | full-haystack | **72.9%** (35/48) — *lower bound* | transcripts on request |
| **Baseline** (retrieval only, no consolidation) | full-haystack | **64.6%** (31/48) | ✅ `results/baseline-longmemeval-m-48q.jsonl` |
| **Local sovereign** (3B on-device, zero cloud) | oracle sample | **50.0%** (6/12) | ✅ `results/local-sovereign-12q.jsonl` |

The consolidation engine's contribution is concentrated where memory actually
gets hard — **multi-session aggregation: 1/8 → 5/8**. See `METHODOLOGY.md §5`
for why 72.9% is reported as a lower bound and how the 3 remaining misses are
accounted for.

## Baseline, per category (full-haystack, 48q)

| Category | Score |
|---|---|
| Single-session (assistant) | 8/8 |
| Single-session (user) | 6/8 |
| Knowledge-update | 6/8 |
| Temporal reasoning | 5/8 |
| Single-session (preference) | 5/8 |
| Multi-session | 1/8 |
| **Overall** | **31/48 = 64.6%** |

## Reference points (kept separate on purpose)

| Reference | Setting | ~Score |
|---|---|---|
| Full engine, oracle-evidence vaults (no distractors) | easier | ~84% |
| Literature GPT-4o full-context | *easier* -S variant | ~60% |
| Local sovereign (3B, zero cloud) | oracle sample | ~50% |

> These are not compared like-for-like — the point of listing them is to be
> explicit about which variant each number belongs to, since that is exactly
> where memory benchmarks tend to get quietly inflated.

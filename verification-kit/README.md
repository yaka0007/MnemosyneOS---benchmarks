# Verification kit

**You don't have to trust the numbers — recompute them.**

This folder makes the Mnemosyne OS memory benchmarks auditable without shipping
the engine that produces the answers. It contains the exact grader, the
per-question verdicts behind the headline, and a one-command tool that re-derives
the score from those verdicts.

## The 30-second check

```bash
node verify.js          # recompute every published score from its per-question rows
node scoring.js --selftest   # watch the grader decide real cases
```

`verify.js` reads the per-question ledgers in `results/`, recomputes accuracy and
the per-category breakdown, and asserts they equal the claimed headline. It needs
nothing but Node — no memory engine, no network, no dependencies.

Expected output ends with:

```
✓ ALL LEDGERS CONSISTENT — the published headline is the exact sum of the published rows.
```

## What's here

| File | What it is |
|---|---|
| `scoring.js` | The **entire** grading logic — heuristic matcher + the verbatim LLM-judge prompt. This is what turns an answer into HIT/MISS. |
| `verify.js` | Independent re-scorer: recomputes each headline from the published rows. |
| `results/*.jsonl` | Per-question verdicts (id, category, HIT/MISS, answer excerpt, ground-truth excerpt). Every `question_id` is the official LongMemEval id. |
| `RESULTS.md` | The results table. |
| `METHODOLOGY.md` | Exactly how it's run and graded — benchmark, variant, models, discipline, honest framing of the headline. |

## What this proves — and what it doesn't

- ✅ The advertised score is the **exact sum of the published per-question rows** —
  no hidden questions, no arithmetic massaging.
- ✅ The grader is **fully open and auditable** — point it at the public
  LongMemEval ground truth and check it isn't tuned to inflate.
- ✅ Every row is **traceable** to the public dataset by its `question_id`.
- ⚠️ It does **not** re-run the memory engine — that's private (see below). Full
  untruncated answer transcripts are available on motivated request; open an
  issue describing what you'd like to verify.

## Why the engine isn't here

The harness that drives the memory engine is coupled to Mnemosyne's private core;
it isn't a standalone tool, and publishing it would expose engine internals
without adding anything you need to check the numbers. Everything required to
audit the **scoring and methodology** is in this folder. See `METHODOLOGY.md §7`.

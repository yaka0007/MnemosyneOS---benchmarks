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
✓ COMPOSED HEADLINE — full engine, LongMemEval-M full-haystack
  This number is COMPOSED from two ledgers, not measured in one 48q run:
    30/40  carried unchanged from the baseline ledger (5 categories NEVER re-run with the engine)
     5/8   measured with the engine (multi-session only)
    35/48  = 72.9%   recomputed
          claimed: 35/48 = 72.9%  → ok

✓ ALL LEDGERS CONSISTENT — every published headline, including the composed one,
  is the exact sum of the published rows.
```

**Read that composition before quoting 72.9%.** It was never measured in a single
48-question engine run — only the multi-session category was re-run, and the other
40 rows are carried from the baseline. `verify.js` prints this every time so the
number can't quietly detach from how it was built. See `RESULTS.md`.

## What's here

| File | What it is |
|---|---|
| `scoring.js` | The **entire** grading logic — heuristic matcher + the verbatim LLM-judge prompt. This is what turns an answer into HIT/MISS. |
| `verify.js` | Independent re-scorer: recomputes each headline from the published rows. |
| `results/baseline-longmemeval-m-48q.jsonl` | The 48 baseline verdicts (id, category, HIT/MISS, answer excerpt, ground truth). Every `question_id` is the official LongMemEval id. |
| `results/engine-multisession-8q.jsonl` | The 8 multi-session verdicts **with the engine** — each naming both runs behind it, whether the baseline already had it, and the discarded first-run HITs. |
| `results/local-sovereign-12q.jsonl` | The 12 fully-on-device verdicts (3B local model, zero cloud). |
| `RESULTS.md` | The results table. |
| `METHODOLOGY.md` | Exactly how it's run and graded — benchmark, variant, models, discipline, honest framing of the headline. |

## What this proves — and what it doesn't

- ✅ The advertised score is the **exact sum of the published per-question rows** —
  no hidden questions, no arithmetic massaging.
- ✅ The grader is **fully open and auditable** — point it at the public
  LongMemEval ground truth and check it isn't tuned to inflate.
- ✅ Every row is **traceable** to the public dataset by its `question_id`.
- ✅ **Replay discipline is checkable, not asserted** — the engine ledger names
  both runs behind every verdict, including the two first-run HITs that were
  discarded for failing to reproduce. Disagree with discarding them? The data to
  argue the other way is published.
- ⚠️ The 72.9% headline is **composed from two ledgers**, not measured in one
  48-question run. `verify.js` prints the composition; `RESULTS.md` explains it.
- ⚠️ It does **not** re-run the memory engine — that's private (see below). So
  this kit lets you audit the **scoring**, not reproduce the **retrieval**. Full
  untruncated answer transcripts are available on motivated request; open an
  issue describing what you'd like to verify.

## Why the engine isn't here

The harness that drives the memory engine is coupled to Mnemosyne's private core;
it isn't a standalone tool, and publishing it would expose engine internals
without adding anything you need to check the numbers. Everything required to
audit the **scoring and methodology** is in this folder. See `METHODOLOGY.md §7`.

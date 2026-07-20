# LongMemEval-M full-haystack — campaign summary (2026-07-13/14)

**Status: closed.** Every HIT below was replayed before being counted (§4).

## Headline

| Measurement | Value |
|---|---|
| LongMemEval-M full-haystack, 48-question stratified set, baseline (topK32, no consolidation) | **64.6 %** (31/48) |
| Same, with the full engine on the multi-session category | **72.9 %** (35/48) — a *lower bound* |
| Multi-session category | **1/8 → 5/8** (12.5 % → 62.5 %), every HIT replay-stable |
| Reference: the LongMemEval paper's GPT-4o full-context result | ~60 % — on the **easier** `-S` variant |
| Reference: oracle-variant ceiling (evidence-only vaults, no distractors) | ~84 % |
| Reference: fully local (Qwen2.5-3B, zero cloud calls) | ~50 % (n=12) |

**"Full-haystack" is the hard variant**: ~480 distractor sessions surround the
evidence for every question, mixing dozens of unrelated personas' first-person
conversations into the corpus. It is the variant closest to a real, lived-in
memory vault — not the easier `-S` slice most published numbers use.

**72.9 % is a stated lower bound**, not a final number: only the multi-session
category was re-run with the full engine (spine-sort → per-topic consolidation
→ dream-tier retrieval) against the 64.6 % baseline. The knowledge-update and
preference-tracking categories were never retried with the same engine — they
may have headroom too (see "Open next steps" below).

## What was tested

The engine under test: **LLM spine-sort** (an unsupervised pass that groups
raw memory chunks into clean per-topic buckets) → **per-topic consolidation
ledgers** (a separate model reads each topic and writes a dense, dated summary
— written *question-blind*, never told what will be asked) → **dream-tier
retrieval** (the ledgers ride alongside raw chunks at answer time).

The hypothesis: multi-session questions — the ones needing facts stitched
across many separate conversations — fail under full-haystack load because the
raw chunks are undifferentiated `SESSION`-type text with no topic structure.
Clean per-topic consolidation should recover them. **Confirmed** — but only
after two false starts (see root causes below).

## Campaign log

| # | Experiment | Config | Result | Verdict | Log |
|---|---|---|---|---|---|
| 0 | Grand run | 48q, topK32, no consolidation | 64.6 %, multi 1/8 | baseline | [`grand-run.log`](logs/grand-run.log) |
| 1 | K-means preflight | 20 fuzzy clusters, ledgers | MISS unchanged | fuzzy topics don't work | — |
| 2 | Spine-sort preflight, q1 | real spine-sort + top-40 ledgers | all MISS | a size-cap on ledgers kills it | [`spine-dream-preflight.log`](logs/spine-dream-preflight.log) |
| 3 | Preflight q1, round 2 | uncapped ledger coverage | HIT | **hypothesis confirmed** | [`spine-dream-preflight2.log`](logs/spine-dream-preflight2.log) |
| 4 | Validation, q2 | 110 ledgers | over-count, MISS | a distinct precision failure mode found | [`spine-dream-q2.log`](logs/spine-dream-q2.log) |
| 5 | Flash A/B | same topics, cheaper writer model | HIT lost | **the stronger writer model is load-bearing** | [`spine-dream-flashab.log`](logs/spine-dream-flashab.log) |
| 6 | Remaining multi-session, ×6 | full engine, uncapped | 6/6 raw | 2 were judge noise → | [`spine-dream-multirun.log`](logs/spine-dream-multirun.log) |
| 7 | Replay all 8, ×2 | same config | **5/8 stable** | **the cited number: 72.9 %** | (folded into #6's replay) |
| 8 | Temporal case | 1 MISS + 1 HIT | HIT held | consolidation neutral on temporal questions | [`spine-dream-temporal-riquiqui.log`](logs/spine-dream-temporal-riquiqui.log) |
| 9 | Relation-tagged ledgers | added relation tags | worse | **refuted** | [`spine-dream-relations-test.log`](logs/spine-dream-relations-test.log) |
| 10 | Reserve-slot sweep | 5 and 8 reserved slots | no gain | noise | [`exp-reserve5.log`](logs/exp-reserve5.log) · [`exp-reserve8.log`](logs/exp-reserve8.log) |
| 11 | Self-verify pass | answer self-check | 5 HITs kept, 3 MISSes kept | safe, but bench-neutral | [`exp-verify.log`](logs/exp-verify.log) |
| 12 | Slice validation | 40-chunk windows | one MISS→HIT | mechanism proven | [`exp-slice-aae.log`](logs/exp-slice-aae.log) |
| 13 | Slice, all 8, ×2 | uniform slicing | one category gained, one lost | net 5/8 — a trade-off, not a gain | [`exp-slice-all8.log`](logs/exp-slice-all8.log) · [`exp-slice-all8-replay.log`](logs/exp-slice-all8-replay.log) |
| 14 | Master-merge, ×2 | + map-reduce totals pass | worse overall | **stop — regression** | [`exp-master-all8.log`](logs/exp-master-all8.log) · [`exp-master-all8-replay.log`](logs/exp-master-all8-replay.log) |

No configuration reaches 6/8. Two configs tie at 5/8 with **disjoint** wins —
each recovers a different question the other misses — which is itself the
finding in root cause #3 below.

## Root causes of the remaining misses

1. **A size-based cap on ledger coverage.** The first attempt kept only the
   40 largest topics; the missing evidence lived in an 8-chunk topic that got
   cut. Evidence hides in *small* topics — never cap consolidation coverage by
   topic size. Fixed in the production writer (backfill-first topic
   selection).
2. **Benchmark-structural distractor contamination.** Two of the three
   remaining misses trace to *other personas'* first-person conversations in
   the shared haystack being indistinguishable, in isolation, from the target
   user's. This failure mode is an artifact of a shared-haystack benchmark
   format — it does not exist in a real, single-user memory vault.
3. **Write/read coverage is a coupled equilibrium.** The third miss traced to
   one evidence chunk sitting one position past a 40-chunk-per-topic write cap
   in a large topic. Removing the cap (windowed slicing) recovers that
   question — but shifts which single pre-computed fact the ledger
   emphasizes, costing a *different* question. Slicing alone is a trade, not a
   net win; it needs retrieval-side dedupe to ship as a net gain.

## Methodology rules

1. **Replay before you cite.** Five false verdicts were caught this campaign
   (judge noise, sampling variance) — a HIT counts only once it reproduces on
   a second, independent run.
2. **One config for the cited number.** No per-question cherry-picking: 72.9 %
   uses one uniform configuration across all 8 multi-session questions.
3. **Question-blind writers.** Every consolidation prompt says "summarize this
   topic" — never "answer question X." The model writing the memory never
   sees the benchmark question.
4. **Trace every lever to the exact failing line before building it.** The two
   levers that worked (uncapped ledger coverage, windowed slicing) both came
   from tracing one missing fact to its exact source chunk. The two levers
   that were tried and refused (relation tags, map-reduce merging) came from
   plausible-sounding reasoning without that trace — and made things worse.

## Open next steps

- Re-run the knowledge-update and preference-tracking categories with the same
  engine — they were never retried, so 72.9 % is an honest lower bound, not a
  ceiling.
- Ship windowed slicing with retrieval-side per-topic dedupe, to capture its
  gain without its cost (root cause #3).
- A query-decomposition pass for temporal questions that compare two dates.

## Reproducing this

The harness that produced these logs (`spine-dream-fh.cjs` and its
supporting scripts) is not published in this repo — it's tightly coupled to
Mnemosyne's internal memory engine and isn't a standalone tool. It's
**available on motivated request** (open an issue on this repo, or reach out
via the links in the [main Mnemosyne OS README](https://github.com/yaka0007/Mnemosyne-Neural-OS)).

The dataset itself is the public [LongMemEval](https://github.com/xiaowu0162/LongMemEval)
benchmark (Wu et al.) — the `-M` full-haystack variant, 48 questions
stratified across its 5 question categories (single-session-user,
single-session-assistant, single-session-preference, temporal-reasoning,
knowledge-update, multi-session).

---

*Measured 2026-07-13/14, against the real production query path (not a
simplified eval harness): Vertex `gemini-2.5-pro` for answers, `gemini-2.5-flash`
as a flexible judge, e5 embeddings throughout.*

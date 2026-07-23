# AGENTS.md — the contract for publishing a number in this repo

You are about to add or update a benchmark result here. This repo is a public
transparency archive: everything in it is read by skeptics who will grep the logs
and run the tools. **A number that cannot survive that reading damages the project
more than publishing nothing.**

Read this file before touching `verification-kit/` or adding a campaign folder.

---

## The one rule everything else serves

> **Every published number must be recomputable, by a stranger, from rows
> published in this repo, using only `node verify.js`.**

If `verify.js` cannot re-derive a figure from committed per-question rows, that
figure does not go in a headline. Not in `README.md`, not in `RESULTS.md`, not in
`index.html`, not in a campaign `SUMMARY.md`.

`node verify.js` must exit 0 before any commit that touches results. It is the
gate, not a formality.

---

## Never do these

1. **Never hand-write a ledger row.** Every row must be extracted from a real run
   log that is committed in this repo. If a verdict has no log behind it, it is
   not a verdict — it's a claim. (Extract from the logs; do not retype numbers
   from a summary, and never reconstruct a row from memory or from a chat
   transcript.)
2. **Never publish the harness, the core engine, or anything that reveals engine
   internals.** The harness lives in the private monorepo and stays there. This
   repo publishes *evidence*, not implementation.
3. **Never present a composed number as a measured one.** See below — this is the
   mistake that was already made once here and had to be corrected.
4. **Never silently drop a verdict.** A discarded HIT stays in the ledger with
   `replay_stable: false` and a `discard_reason`. Deleting it is indistinguishable
   from hiding it.
5. **Never quote a number whose judge verdicts haven't been audited** for the
   failure modes listed under "Judge false positives" below.

---

## Ledger format

One JSONL file per measured configuration, in `verification-kit/results/`.
First line is a `_meta` object; every following line is one question.

**`_meta` — required keys** (`verify.js` reads these):

```jsonc
{"_meta":{
  "run": "human-readable name of the exact configuration",
  "date": "YYYY-MM-DD",
  "dataset": "LongMemEval-M",
  "variant": "full-haystack (~480 distractor sessions per question)",
  "answer_model": "...", "judge_model": "...", "judge_leniency": "flexible",
  "retrieval": "topK=..., maxSourceChars=...",
  "embeddings": "...",
  "expected_hits": 5, "expected_total": 8, "expected_accuracy_pct": 62.5
}}
```

Add `scope` whenever the ledger covers less than the full question set, and
`composition_note` whenever its rows feed a composed headline. `verify.js` prints
`scope` back out — that is deliberate, so a partial ledger cannot be mistaken for
a full one.

**Row — required keys:** `question_id` (the *official* dataset id, so any row can
be traced to public ground truth), `category`, `correct` (boolean), `match_type`,
`generated`, `expected`.

**Row — provenance keys, required for any engine run:**

- `runs: [{log, verdict, answer}, …]` — **both** runs behind the verdict, each
  pointing at a log file committed in this repo.
- `replay_stable` — boolean.
- `baseline_correct` — was this already a HIT without the engine? Without this
  field nobody can tell a recovery from a coincidence.
- `discarded_verdict` + `discard_reason` — when a first-run HIT did not reproduce.
- `miss_class` — for a MISS you understand, say what class of failure it is.

Follow `results/engine-multisession-8q.jsonl`. It is the reference implementation
of this format; match it rather than inventing a variant.

---

## Replay discipline

A HIT counts **only if it reproduces on a second independent run of the same
config.** One run is an anecdote.

When a first-run HIT fails to reproduce, work out *which kind* of instability it
was and say so — they are different findings and conflating them looks evasive:

- **Judge noise** — same answer both runs, different verdict. The judge was wrong
  once.
- **Answer variance** — the engine gave a different answer on the replay. The
  judge was right both times; the engine wasn't stable.

Both are scored MISS. Both stay visible in the ledger.

---

## Composed numbers — the trap this repo already fell into

If you re-run only *part* of the question set and combine it with carried rows
from another ledger, the resulting figure is **composed, not measured**. That is
legitimate — but it must be labelled everywhere the number appears, and
`verify.js` must print the composition explicitly, e.g.:

```
30/40  carried unchanged from the baseline ledger (never re-run)
 5/8   measured with the engine
35/48  = 72.9%
```

Composition and "lower bound" are **two separate caveats**. Do not merge them into
one vague sentence — collapsing them hides the fact that no single full run ever
happened. Extend the composed-headline block in `verify.js` for any new composed
figure; never assert one in prose alone.

---

## Judge false positives — audit before you publish

The LLM judge produces false HITs in at least two known ways. Audit every
category you intend to publish, not just the ones you improved:

1. **Abstention.** An answer that declines ("cannot determine from the memory")
   is scored **NO** unless the ground truth itself is "not mentioned". Judges
   sometimes reward the abstention as cautious-and-correct. Check these by hand.
2. **A-vs-B substitution.** The answer names a *different* entity, quantity or
   date than the ground truth, and the judge accepts it as close enough. Check
   every numeric and named answer against ground truth yourself.

Also watch for **in-sample tuning**: if a lever was developed by tracing failures
on the same questions it is then scored on, the result is in-sample and must be
labelled as such, or re-measured on held-out questions before publication.

---

## Checklist before committing

```bash
cd verification-kit
node verify.js            # must exit 0
node scoring.js --selftest
```

- [ ] `verify.js` exits 0 and its printed totals match every headline in
      `README.md`, `RESULTS.md`, `index.html` and the campaign `SUMMARY.md`.
- [ ] Every new ledger row traces to a log file committed in this repo.
- [ ] Every HIT has two runs behind it; every discarded HIT is still visible.
- [ ] Composed figures are labelled composed **everywhere**, and the composition
      is computed by `verify.js`, not written by hand.
- [ ] Caveats are attached to the number itself, not buried in a later section.
- [ ] No harness code, no engine internals, no private paths.
- [ ] `index.html` updated — it is the page most people actually read, and a
      stale live page is worse than no live page.
- [ ] If a claim got weaker, the weakening is stated plainly rather than dropped.

---

## Adding a new campaign

1. `<campaign-name>-YYYY-MM/` at the repo root, with `SUMMARY.md` and `logs/`.
2. Commit the **raw** logs, including the runs that failed or regressed. Negative
   results belong in the record — a campaign log with only wins reads as curated.
3. In `SUMMARY.md`, include a **reading key**: which config produced the cited
   number, which logs are rejected configs, and which questions are the cited
   HITs. Without it, a reader grepping several configs sees contradictory totals
   and concludes cherry-picking. (See `fullhaystack-2026-07/SUMMARY.md`.)
4. Add the ledger to `verification-kit/results/` and link the campaign from the
   root `README.md` table.

---

## Tone

Understate. The credibility of this repo comes from caveats a reader did not have
to discover on their own. If you find yourself choosing between a number that
sounds better and a sentence that is harder to attack, take the sentence.

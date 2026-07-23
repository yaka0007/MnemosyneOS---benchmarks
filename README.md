# Mnemosyne Benchmarks

Transparency archive for benchmark campaigns run against
[Mnemosyne OS](https://github.com/yaka0007/Mnemosyne-Neural-OS)'s memory
engine — methodology, honest caveats, and the raw run logs behind every
published number.

> **📊 [Live results page →](https://yaka0007.github.io/MnemosyneOS---benchmarks/verification-kit/)** — the numbers, the per-question ledger, and how to recompute them yourself.

**Why a separate repo:** a benchmark claim deserves scrutiny the product
README isn't the place for. Everything here is real run output — not curated
screenshots — so the numbers can be checked, not just trusted.

## Recompute the numbers yourself

Don't take the headline on faith — re-derive it. The
[**verification kit**](verification-kit/) ships the exact grader, the
per-question verdicts behind each score, and a one-command tool that recomputes
the accuracy from those verdicts — no memory engine, no network, no
dependencies:

```bash
cd verification-kit
node verify.js          # recompute every score from its per-question rows
node scoring.js --selftest   # audit the grader on real cases
```

`verify.js` proves each advertised score is the **exact sum of the published
per-question rows** — no hidden questions, no arithmetic massaging. All three
ledgers recompute in full: baseline (64.6%), engine multi-session (5/8), and
local-sovereign (50%).

**The 72.9% headline is composed, and `verify.js` says so out loud.** It was
never measured in a single 48-question engine run — only the multi-session
category was re-run with the engine, and the other 40 rows are carried from the
baseline ledger. The tool recomputes and prints that composition
(`30/40 carried + 5/8 measured = 35/48`) on every run, so the number cannot
quietly detach from how it was built. It is therefore a **lower bound**: the 40
carried questions were never retried, so a full re-run can only raise it.
Details in the kit's `RESULTS.md` and `METHODOLOGY.md §5`.

**➡️ Rendered results page:
[yaka0007.github.io/MnemosyneOS---benchmarks/verification-kit](https://yaka0007.github.io/MnemosyneOS---benchmarks/verification-kit/)**
— that's the live site; the files in [`verification-kit/`](verification-kit/)
are the source behind it.

## Campaigns

| Campaign | Headline | |
|---|---|---|
| [LongMemEval-M full-haystack](fullhaystack-2026-07/SUMMARY.md) (2026-07) | **64.6 % → 72.9 %**, multi-session recall **1/8 → 5/8** | [16 raw run logs](fullhaystack-2026-07/logs/) |

## What "full-haystack" means

[LongMemEval](https://github.com/xiaowu0162/LongMemEval) is a public,
independent long-term-memory benchmark. Its **full-haystack** variant surrounds
every question's evidence with ~480 distractor sessions from other personas —
the closest published setup to a real, lived-in memory vault. Most reported
numbers (including the original paper's) use the easier `-S` variant instead.
Mnemosyne's numbers above are on the harder one.

## Ground rules for anything published here

1. **A HIT is only counted if it replays.** Judge noise and sampling variance
   produce false positives; every cited result was independently re-run.
2. **One configuration, no cherry-picking.** The number in a headline is one
   uniform config across the full question set, not a best-of-N.
3. **Caveats stay attached to the number.** If a result is a lower bound, or a
   trade-off rather than a clean win, that's stated next to it — see each
   campaign's summary.

These rules are written down as an enforceable contract in [`AGENTS.md`](AGENTS.md)
— the ledger format, the replay discipline, the rule that a composed figure may
never be presented as a measured one, and the checklist that has to pass before
anything here is updated. It's addressed to whoever (or whatever) publishes the
next number, and it's public for the same reason the logs are.

## Reproducing a campaign

**Be clear about what this repo does and doesn't let you do.** It lets you audit
the **scoring** — the grader, the per-question verdicts, the arithmetic, the
replay discipline, and every row traced back to the public dataset. It does not
let you reproduce the **retrieval**: the engine that produced the answers is
closed, so you cannot re-run generation and get these logs back. That is a real
limit and we'd rather state it than let the word "reproducible" imply otherwise.

The internal harness scripts aren't published here — they're coupled to
Mnemosyne's core engine, not standalone tools. They're available on
**motivated request**: open an issue on this repo explaining what you'd like
to verify or extend.

The benchmark datasets themselves are public (linked in each campaign's
summary) — the logs here are enough to check the scoring and methodology
against them independently.

## License

- **Data** — logs, ledgers, summaries and documentation: [CC-BY 4.0](LICENSE).
  Reuse them, cite them, requote the numbers, just credit the source.
- **Code** — `verification-kit/verify.js`, `scoring.js`, `index.html`:
  [MIT](LICENSE-CODE), so you can fork the grader and check it against your own
  results without a content licence getting in the way.

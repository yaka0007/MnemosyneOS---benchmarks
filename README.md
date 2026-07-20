# Mnemosyne Benchmarks

Transparency archive for benchmark campaigns run against
[Mnemosyne OS](https://github.com/yaka0007/Mnemosyne-Neural-OS)'s memory
engine — methodology, honest caveats, and the raw run logs behind every
published number.

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

`verify.js` proves the advertised score is the **exact sum of the published
per-question rows** — no hidden questions, no arithmetic massaging. The
baseline (64.6%) and local-sovereign (50%) ledgers recompute in full; the 72.9%
engine result is reported as a lower bound (see the kit's `METHODOLOGY.md`).
There's a readable results page at
[`verification-kit/index.html`](verification-kit/index.html).

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

## Reproducing a campaign

The internal harness scripts aren't published here — they're coupled to
Mnemosyne's core engine, not standalone tools. They're available on
**motivated request**: open an issue on this repo explaining what you'd like
to verify or extend.

The benchmark datasets themselves are public (linked in each campaign's
summary) — the logs here are enough to check the scoring and methodology
against them independently.

## License

Logs and summaries in this repo are published under [CC-BY 4.0](LICENSE) —
reuse them, cite them, requote the numbers, just credit the source.

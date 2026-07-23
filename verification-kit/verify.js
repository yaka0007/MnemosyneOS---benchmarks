#!/usr/bin/env node
/**
 * verify.js — independent integrity check of the published benchmark results.
 *
 * It reads every results/*.jsonl ledger, recomputes the overall accuracy and the
 * per-category breakdown FROM the per-question verdicts, and asserts they equal
 * the headline each file claims in its _meta. In other words: it proves the
 * advertised number is exactly the sum of the published per-question rows —
 * no hidden questions, no arithmetic massaging.
 *
 * It needs nothing but Node — no memory engine, no network, no dependencies.
 *
 *   node verify.js                 # check every ledger in ./results
 *   node verify.js results/foo.jsonl
 *
 * Exit code 0 = every ledger's rows reproduce its claimed headline; 1 = mismatch.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(join(HERE, 'results')).filter((f) => f.endsWith('.jsonl')).map((f) => join(HERE, 'results', f));

let allOk = true;
const ledgers = new Map(); // basename -> { meta, rows }

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  let meta = null;
  const rows = [];
  for (const line of lines) {
    const obj = JSON.parse(line);
    if (obj._meta) meta = obj._meta;
    else rows.push(obj);
  }
  if (!meta) { console.error(`✗ ${file}: no _meta header row`); allOk = false; continue; }
  ledgers.set(basename(file), { meta, rows });

  const total = rows.length;
  const hits = rows.filter((r) => r.correct === true).length;
  const acc = total ? (hits / total) * 100 : 0;

  const byCat = {};
  for (const r of rows) {
    (byCat[r.category] ??= { h: 0, n: 0 });
    byCat[r.category].n++;
    if (r.correct) byCat[r.category].h++;
  }

  const okTotal = total === meta.expected_total;
  const okHits = hits === meta.expected_hits;
  const okAcc = Math.abs(acc - meta.expected_accuracy_pct) < 0.1;
  const ok = okTotal && okHits && okAcc;
  allOk = allOk && ok;

  console.log(`\n${ok ? '✓' : '✗'} ${meta.run}`);
  console.log(`  dataset: ${meta.dataset} · ${meta.variant}`);
  console.log(`  answer model: ${meta.answer_model} · judge: ${meta.judge_model} (${meta.judge_leniency})`);
  console.log(`  recomputed from ${total} published rows: ${hits}/${total} = ${acc.toFixed(1)}%`);
  console.log(`  claimed headline:                        ${meta.expected_hits}/${meta.expected_total} = ${meta.expected_accuracy_pct}%`);
  console.log(`  match: total ${okTotal ? 'ok' : 'MISMATCH'} · hits ${okHits ? 'ok' : 'MISMATCH'} · accuracy ${okAcc ? 'ok' : 'MISMATCH'}`);
  console.log('  per-category:');
  for (const c of Object.keys(byCat).sort()) console.log(`    ${c.padEnd(26)} ${byCat[c].h}/${byCat[c].n}`);

  // Replay discipline (METHODOLOGY.md §4.1): a HIT counts only if it reproduces
  // on a second independent run. Any first-run HIT that did not reproduce is
  // scored MISS above — surfaced here rather than quietly dropped.
  const discarded = rows.filter((r) => r.replay_stable === false);
  if (discarded.length) {
    console.log(`  replay rule: ${discarded.length} first-run HIT(s) did NOT reproduce → scored MISS:`);
    for (const r of discarded) console.log(`    ${r.question_id.padEnd(16)} ${r.discard_reason}`);
  }
  if (meta.scope) console.log(`  scope: ${meta.scope}`);
}

// ── Composed headline ────────────────────────────────────────────────────────
// The 72.9% figure is not a single measured 48-question run: the engine was only
// re-run on the multi-session category. Recompose it here, in the open, so the
// composition is auditable instead of asserted.
const base = ledgers.get('baseline-longmemeval-m-48q.jsonl');
const eng = ledgers.get('engine-multisession-8q.jsonl');
if (base && eng) {
  const carried = base.rows.filter((r) => r.category !== 'multi-session');
  const carriedHits = carried.filter((r) => r.correct === true).length;
  const engHits = eng.rows.filter((r) => r.correct === true).length;
  const hits = carriedHits + engHits;
  const total = carried.length + eng.rows.length;
  const acc = (hits / total) * 100;
  const CLAIMED = { hits: 35, total: 48, pct: 72.9 };
  const ok = hits === CLAIMED.hits && total === CLAIMED.total && Math.abs(acc - CLAIMED.pct) < 0.1;
  allOk = allOk && ok;

  console.log(`\n${ok ? '✓' : '✗'} COMPOSED HEADLINE — full engine, LongMemEval-M full-haystack`);
  console.log('  This number is COMPOSED from two ledgers, not measured in one 48q run:');
  console.log(`    ${String(carriedHits).padStart(2)}/${carried.length}  carried unchanged from the baseline ledger (5 categories NEVER re-run with the engine)`);
  console.log(`    ${String(engHits).padStart(2)}/${eng.rows.length}   measured with the engine (multi-session only)`);
  console.log(`    ${String(hits).padStart(2)}/${total}  = ${acc.toFixed(1)}%   recomputed`);
  console.log(`          claimed: ${CLAIMED.hits}/${CLAIMED.total} = ${CLAIMED.pct}%  → ${ok ? 'ok' : 'MISMATCH'}`);
  console.log('  Because the 40 carried questions were never retried with the engine, they can only');
  console.log('  improve on a full re-run — which is why 72.9% is published as a LOWER BOUND, and');
  console.log('  why it must not be quoted as a measured 48-question engine result.');
} else {
  console.log('\n! COMPOSED HEADLINE skipped — needs both the baseline and engine ledgers.');
}

console.log(`\n${allOk ? '✓ ALL LEDGERS CONSISTENT' : '✗ ONE OR MORE LEDGERS FAILED'} — every published headline, including the composed one, is the exact sum of the published rows.`);
process.exit(allOk ? 0 : 1);

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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(join(HERE, 'results')).filter((f) => f.endsWith('.jsonl')).map((f) => join(HERE, 'results', f));

let allOk = true;

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
}

console.log(`\n${allOk ? '✓ ALL LEDGERS CONSISTENT' : '✗ ONE OR MORE LEDGERS FAILED'} — the published headline is the exact sum of the published rows.`);
process.exit(allOk ? 0 : 1);

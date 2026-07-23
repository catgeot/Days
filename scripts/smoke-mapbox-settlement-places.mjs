#!/usr/bin/env node
/**
 * 정착지 resolve 스모크 — 시드 회귀 + 선택 쿼리.
 * Usage: node scripts/smoke-mapbox-settlement-places.mjs [extraQuery...]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(
  readFileSync(join(root, 'src/pages/Home/data/mapboxSettlementPlaces.json'), 'utf8')
);

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const byKey = new Map();
for (const row of rows) {
  for (const s of row.settlements || []) {
    for (const k of [s.name, s.name_en, s.placeId, ...(s.aliases || [])]) {
      const nk = normalizeKey(k);
      if (nk && !byKey.has(nk)) byKey.set(nk, { hubId: row.hubId, name: s.name });
    }
  }
}

const required = ['설악동', '베르사유', 'Seorak-dong', 'Versailles'];
const extra = process.argv.slice(2);
const queries = [...required, ...extra];
let fail = 0;

for (const q of queries) {
  const hit = byKey.get(normalizeKey(q));
  if (!hit) {
    console.error(`FAIL: no resolve for "${q}"`);
    fail += 1;
  } else {
    console.log(`OK: "${q}" → ${hit.hubId} / ${hit.name}`);
  }
}

if (fail) process.exit(1);
console.log('SMOKE OK');

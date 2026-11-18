/**
 * GYG fallback (items=null) — bulk false-positive guard.
 * Words: scripts/health/fixtures/tour-activity-fallback-en-words.txt (not in product code).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const healthDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(healthDir, '..', '..');

const { listKnownServiceRegions, resolveTourActivitySearchCommitMeta } = await import(
  join(rootDir, 'src/shared/serviceRegion/serviceRegionSearchModel.js'),
);

const khaoLak = listKnownServiceRegions().find((r) => r.slug === 'khao-lak');
const paris = listKnownServiceRegions().find((r) => r.slug === 'paris');
const bangkok = listKnownServiceRegions().find((r) => r.slug === 'bangkok');

function keywordSearchFallback(kw, loc = khaoLak, searchText = kw) {
  return resolveTourActivitySearchCommitMeta(kw, loc, null, searchText).keywordSearchFallback;
}

const MUST_SHOW = ['asdf', 'qwer', 'aaaa', 'zzqx', 'qwxz', 'hjkl', 'dfghjkl'];

const MUST_HIDE = [
  'myth',
  'spry',
  '코끼리',
  'snorkeling',
  'kayak',
  'spa',
  'tour',
  'louvre',
  '루브르',
  '시미란 스노클링',
  '방콕 수상시장',
];

function pickLocation(kw) {
  if (kw === '루브르' || kw === 'louvre') return paris;
  if (kw === '수상시장' || kw === '방콕 수상시장') return bangkok;
  if (kw === '시미란 스노클링') return khaoLak;
  return khaoLak;
}

const enWordBlob = readFileSync(
  join(healthDir, 'fixtures/tour-activity-fallback-en-words.txt'),
  'utf8',
);
const enWords = enWordBlob.split(/\s+/).filter(Boolean);

function collectRegionTokens() {
  const regionTokens = new Set();
  for (const r of listKnownServiceRegions()) {
    if (r.slug) regionTokens.add(r.slug.replace(/-/g, ' '));
    for (const key of ['name', 'name_en', 'name_ko']) {
      const v = String(r[key] || '').trim();
      if (!v) continue;
      regionTokens.add(v);
      for (const part of v.split(/[\s,·/()]+/)) {
        const p = part.trim();
        if (p.length >= 3) regionTokens.add(p);
      }
    }
  }
  return regionTokens;
}

test('tour fallback bulk — meaningless inputs show notice', () => {
  for (const kw of MUST_SHOW) {
    assert.equal(
      keywordSearchFallback(kw),
      true,
      `expected fallback for meaningless input: ${kw}`,
    );
  }
});

test('tour fallback bulk — explicit real keywords hide notice', () => {
  for (const kw of MUST_HIDE) {
    const loc = pickLocation(kw);
    assert.equal(
      keywordSearchFallback(kw, loc, kw),
      false,
      `expected no fallback for: ${kw} @ ${loc?.slug}`,
    );
  }
});

test('tour fallback bulk — common English words zero false positives', () => {
  const falsePositives = [];
  let checked = 0;
  for (const w of enWords) {
    if (w.length < 3) continue;
    checked += 1;
    if (keywordSearchFallback(w)) falsePositives.push(w);
  }
  assert.ok(checked >= 700, `expected large en word corpus, got ${checked}`);
  assert.deepEqual(
    falsePositives,
    [],
    `en word false positives: ${falsePositives.slice(0, 20).join(', ')}`,
  );
});

test('tour fallback bulk — region slug/name Latin tokens zero false positives', () => {
  const regionTokens = collectRegionTokens();
  const falsePositives = [];
  let checked = 0;
  for (const tok of regionTokens) {
    if (tok.length < 3) continue;
    if (!/^[a-zA-Z\s-]+$/.test(tok)) continue;
    checked += 1;
    if (keywordSearchFallback(tok)) falsePositives.push(tok);
  }
  assert.ok(checked >= 500, `expected region token corpus, got ${checked}`);
  assert.deepEqual(
    falsePositives,
    [],
    `region token false positives: ${falsePositives.slice(0, 20).join(', ')}`,
  );
});
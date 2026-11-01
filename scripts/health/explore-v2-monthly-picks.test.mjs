import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

import { TRAVEL_SPOTS } from '../../src/pages/Home/data/travelSpots.js';
import {
  EXPLORE_V2_MONTHLY_PICK_KEY,
  MONTHLY_PICKS,
} from '../../src/pages/Home/data/spotTraits.js';
import {
  isValidMonthlyPickSource,
  normalizeMonthlyPickSource,
  readExploreV2QueryParam,
  isExploreV2MonthlyRowVisible,
} from '../../src/pages/Home/lib/exploreMonthlyPicks.js';
import {
  GATEO_ENV_FLAG_NAMES,
  isGateoExploreV2Enabled,
} from '../../src/shared/gateoFeatureFlags.js';

const MONTH_KEY = EXPLORE_V2_MONTHLY_PICK_KEY;
const EXPECTED_SLUGS = [
  'kyoto',
  'chiang-mai',
  'phu-quoc',
  'jeju',
  'dubai',
  'melbourne',
];

test('MONTHLY_PICKS 2026-11 has six slugs in TRAVEL_SPOTS with sources and checked', () => {
  const entries = MONTHLY_PICKS[MONTH_KEY];
  assert.ok(Array.isArray(entries));
  assert.equal(entries.length, 6);

  const spotSlugs = new Set(TRAVEL_SPOTS.map((s) => String(s.slug || '').toLowerCase()));
  const slugs = entries.map((e) => e.slug);
  assert.deepEqual(slugs, EXPECTED_SLUGS);

  for (const entry of entries) {
    assert.ok(spotSlugs.has(entry.slug), `missing TRAVEL_SPOTS slug ${entry.slug}`);
    assert.ok(typeof entry.reason === 'string' && entry.reason.trim().length > 0);
    assert.ok(Array.isArray(entry.sources) && entry.sources.length >= 1);
    for (const raw of entry.sources) {
      const source = normalizeMonthlyPickSource(raw);
      assert.ok(source, `invalid source ${JSON.stringify(raw)}`);
      assert.ok(isValidMonthlyPickSource(source.url), `invalid url ${source.url}`);
      assert.ok(source.label.length > 0 && source.label !== '출처');
    }
    assert.match(String(entry.checked || ''), /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('jeju monthly pick keeps estimate: true', () => {
  const jeju = MONTHLY_PICKS[MONTH_KEY].find((e) => e.slug === 'jeju');
  assert.ok(jeju);
  assert.equal(jeju.estimate, true);
  assert.match(jeju.reason, /추정/);
});

test('VITE_GATEO_EXPLORE_V2 defaults off when unset', () => {
  const key = GATEO_ENV_FLAG_NAMES.EXPLORE_V2;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    delete globalThis.__VITE_ENV__[key];
    assert.equal(isGateoExploreV2Enabled(), false);
    globalThis.__VITE_ENV__[key] = '';
    assert.equal(isGateoExploreV2Enabled(), false);
    globalThis.__VITE_ENV__[key] = '1';
    assert.equal(isGateoExploreV2Enabled(), true);
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[key];
    else globalThis.__VITE_ENV__[key] = prev;
  }
});

test('readExploreV2QueryParam — preview flag only (not monthly row gate)', () => {
  assert.equal(readExploreV2QueryParam(''), false);
  assert.equal(readExploreV2QueryParam('?foo=1'), false);
  assert.equal(readExploreV2QueryParam('?explore_v2=1'), true);
  assert.equal(readExploreV2QueryParam('?explore_v2=0'), false);
});

test('monthly row visible by default; VITE_GATEO_EXPLORE_V2 stays off for other v2', () => {
  const key = GATEO_ENV_FLAG_NAMES.EXPLORE_V2;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    delete globalThis.__VITE_ENV__[key];
    assert.equal(isGateoExploreV2Enabled(), false);
    assert.equal(isExploreV2MonthlyRowVisible(''), true);
    assert.equal(isExploreV2MonthlyRowVisible('?explore_v2=1'), true);
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[key];
    else globalThis.__VITE_ENV__[key] = prev;
  }
});

test('explore_v2=1 query sets robots noindex on Home SEO only', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  const seo = readFileSync(join(root, 'src/components/SEO/index.jsx'), 'utf8');
  assert.match(home, /readExploreV2QueryParam\(routeLocation\.search\)/);
  assert.match(home, /robotsNoIndex=\{exploreV2QueryNoIndex\}/);
  assert.match(seo, /robotsNoIndex \? <meta name="robots" content="noindex" \/>/);
});

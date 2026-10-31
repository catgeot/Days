import assert from 'node:assert/strict';
import test from 'node:test';

import { TRAVEL_SPOTS } from '../../src/pages/Home/data/travelSpots.js';
import {
  EXPLORE_V2_MONTHLY_PICK_KEY,
  MONTHLY_PICKS,
} from '../../src/pages/Home/data/spotTraits.js';
import { isValidMonthlyPickSource } from '../../src/pages/Home/lib/exploreMonthlyPicks.js';
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
    for (const url of entry.sources) {
      assert.ok(isValidMonthlyPickSource(url), `invalid source ${url}`);
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

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
  isExploreV2MonthlyRowVisible,
  buildVisibleMonthlyPickCards,
  resolveExploreMonthlyPickHeroUrl,
  partitionExploreMonthlyPickCardsByHero,
  exploreV2MonthlyPickHeadline,
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

test('monthly row is code default ON; VITE_GATEO_EXPLORE_V2 stays off', () => {
  const key = GATEO_ENV_FLAG_NAMES.EXPLORE_V2;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    delete globalThis.__VITE_ENV__[key];
    assert.equal(isGateoExploreV2Enabled(), false);
    assert.equal(isExploreV2MonthlyRowVisible(), true);
    globalThis.__VITE_ENV__[key] = '1';
    assert.equal(isExploreV2MonthlyRowVisible(), true);
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[key];
    else globalThis.__VITE_ENV__[key] = prev;
  }
});

test('explore_v2 monthly heading is month label only (no spot count)', () => {
  assert.equal(exploreV2MonthlyPickHeadline(MONTH_KEY), '11월의 여행지');
});

test('2026-11 monthly picks resolve verified place gallery hero (no OG overrides)', () => {
  const cards = buildVisibleMonthlyPickCards(MONTH_KEY);
  const { withHero, excluded } = partitionExploreMonthlyPickCardsByHero(cards);
  assert.deepEqual(excluded, []);
  assert.equal(withHero.length, 6);
  for (const slug of EXPECTED_SLUGS) {
    const url = resolveExploreMonthlyPickHeroUrl({ slug });
    assert.ok(url, `no hero for ${slug}`);
    assert.match(url, /^https:\/\//);
    assert.doesNotMatch(
      url,
      /photo-1436491865332|photo-1500530855697|photo-1539037116277/,
      `stale OG-like hero for ${slug}`,
    );
  }
});

test('monthly row renders mosaic B only (no layout query branch)', () => {
  const dir = join(root, 'src/pages/Home/components/SearchDiscovery');
  const section = readFileSync(join(dir, 'ExploreMonthlyPicksSection.jsx'), 'utf8');
  assert.match(section, /ExploreMonthlyPicksLayoutB/);
  assert.doesNotMatch(section, /LayoutA|readExploreV2LayoutParam|layout === /);
  assert.equal(existsSync(join(dir, 'ExploreMonthlyPicksLayoutA.jsx')), false);
  const lib = readFileSync(join(root, 'src/pages/Home/lib/exploreMonthlyPicks.js'), 'utf8');
  assert.doesNotMatch(lib, /readExploreV2LayoutParam|readExploreV2QueryParam/);
});

test('Home /explore SEO has no explore_v2 query noindex', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  assert.doesNotMatch(home, /readExploreV2QueryParam|exploreV2QueryNoIndex|robotsNoIndex=/);
});

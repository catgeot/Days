import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

import { TRAVEL_SPOTS } from '../../src/pages/Home/data/travelSpots.js';
import { MONTHLY_PICKS } from '../../src/pages/Home/data/spotTraits.js';
import {
  isValidMonthlyPickSource,
  normalizeMonthlyPickSource,
  isExploreV2MonthlyRowVisible,
  buildVisibleMonthlyPickCards,
  resolveExploreMonthlyPickHeroUrl,
  partitionExploreMonthlyPickCardsByHero,
  exploreV2MonthlyPickHeadline,
  exploreV2MonthlyPickPreviewHeadline,
  getExploreMonthlyPickSchedule,
  isExploreNextMonthPreviewWindowOpen,
  resolveExploreCurrentMonthPickKey,
  resolveExploreNextMonthPreviewPickKey,
  resolveExploreV2MonthlyPickKey,
  seoulExploreCalendarParts,
} from '../../src/pages/Home/lib/exploreMonthlyPicks.js';
import {
  GATEO_ENV_FLAG_NAMES,
  isGateoExploreV2Enabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  groupExploreMonthlyPickColumns,
  resolveExploreMonthlyPickGridSlot,
} from '../../src/pages/Home/components/SearchDiscovery/exploreMonthlyGridLayout.js';

const MONTH_KEY = '2026-11';

/** @param {number} y @param {number} m @param {number} d @param {number} [h] @param {number} [min] @param {number} [sec] */
function instantAtKst(y, m, d, h = 0, min = 0, sec = 0) {
  return new Date(Date.UTC(y, m - 1, d, h - 9, min, sec));
}
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
    assert.ok(entry.reason.length <= 40, `${entry.slug} summary too long`);
    assert.match(entry.reason, /월|\//, `${entry.slug} summary should say when`);
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
  assert.equal(exploreV2MonthlyPickPreviewHeadline('2026-12'), '12월의 여행지 미리 보기');
});

test('KST monthly pick schedule hides preview before 15th and after month rollover', () => {
  const beforePreview = instantAtKst(2026, 11, 14, 23, 59, 59);
  assert.equal(isExploreNextMonthPreviewWindowOpen(beforePreview), false);
  assert.equal(resolveExploreNextMonthPreviewPickKey(beforePreview), null);

  const previewStart = instantAtKst(2026, 11, 15, 0, 0, 0);
  assert.equal(isExploreNextMonthPreviewWindowOpen(previewStart), true);
  assert.equal(resolveExploreNextMonthPreviewPickKey(previewStart), '2026-12');

  const previewEnd = instantAtKst(2026, 11, 30, 23, 59, 59);
  assert.equal(isExploreNextMonthPreviewWindowOpen(previewEnd), true);
  assert.equal(resolveExploreNextMonthPreviewPickKey(previewEnd), '2026-12');

  const decFirst = instantAtKst(2026, 12, 1, 0, 0, 0);
  assert.equal(resolveExploreCurrentMonthPickKey(decFirst), '2026-12');
  assert.equal(isExploreNextMonthPreviewWindowOpen(decFirst), false);
  assert.equal(resolveExploreNextMonthPreviewPickKey(decFirst), null);
});

test('UTC instant can differ from KST calendar day at preview boundary', () => {
  const utc = new Date(Date.UTC(2026, 10, 14, 15, 0, 0));
  assert.equal(seoulExploreCalendarParts(utc).day, 15);
  assert.equal(isExploreNextMonthPreviewWindowOpen(utc), true);
  assert.equal(resolveExploreNextMonthPreviewPickKey(utc), '2026-12');
});

test('next month key rolls year at December', () => {
  const kst = instantAtKst(2026, 12, 31, 12, 0, 0);
  assert.equal(seoulExploreCalendarParts(kst).nextMonthKey, '2027-01');
  const janFirst = instantAtKst(2027, 1, 1, 0, 0, 0);
  assert.equal(resolveExploreCurrentMonthPickKey(janFirst), '2027-01');
});

test('missing MONTHLY_PICKS month hides resolved key (no previous-month fallback)', () => {
  const novMid = getExploreMonthlyPickSchedule(instantAtKst(2026, 11, 20));
  assert.equal(novMid.currentPickKey, '2026-11');
  assert.equal(novMid.previewPickKey, null);

  const decFirst = getExploreMonthlyPickSchedule(instantAtKst(2026, 12, 1));
  assert.equal(decFirst.currentMonthKey, '2026-12');
  assert.equal(decFirst.currentPickKey, null);
  assert.equal(decFirst.previewPickKey, null);
});

test('preview row appears when next month data exists (injected picks)', () => {
  const injected = {
    ...MONTHLY_PICKS,
    '2026-12': MONTHLY_PICKS[MONTH_KEY],
  };
  const schedule = getExploreMonthlyPickSchedule(instantAtKst(2026, 11, 15), injected);
  assert.equal(schedule.currentPickKey, '2026-11');
  assert.equal(schedule.previewPickKey, '2026-12');
  assert.equal(injected['2026-12'].length, 6);
  const previewCards = buildVisibleMonthlyPickCards(MONTH_KEY);
  const { withHero } = partitionExploreMonthlyPickCardsByHero(previewCards);
  assert.equal(withHero.length, 6);
  assert.equal(resolveExploreV2MonthlyPickKey('2099-01', injected), null);
});

test('November explore row matches fixed-key era when preview window closed', () => {
  const nov10 = getExploreMonthlyPickSchedule(instantAtKst(2026, 11, 10));
  assert.equal(nov10.currentPickKey, '2026-11');
  assert.equal(nov10.showPreview, false);
  assert.equal(nov10.previewPickKey, null);
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

test('monthly layout B uses two columns without row span or full-width banners', () => {
  const dir = join(root, 'src/pages/Home/components/SearchDiscovery');
  const layoutB = readFileSync(join(dir, 'ExploreMonthlyPicksLayoutB.jsx'), 'utf8');
  const gridLayout = readFileSync(join(dir, 'exploreMonthlyGridLayout.js'), 'utf8');
  assert.match(layoutB, /exploreMonthlyGridLayout/);
  assert.match(layoutB, /groupExploreMonthlyPickColumns/);
  assert.match(layoutB, /EXPLORE_MONTHLY_PICK_BOARD_CLASS/);
  assert.doesNotMatch(layoutB, /distributeExploreMonthlyPickColumns|matchMedia/);
  assert.match(gridLayout, /items-start/);
  assert.match(gridLayout, /lg:grid-cols-3/);
  assert.match(gridLayout, /lg:contents/);
  assert.doesNotMatch(gridLayout, /col-span-12|row-span|row-start|col-start|grid-cols-6/);
  assert.equal(resolveExploreMonthlyPickGridSlot('kyoto').variant, 'portrait');
  assert.equal(resolveExploreMonthlyPickGridSlot('kyoto').photoClass, 'aspect-[4/5]');
  assert.equal(resolveExploreMonthlyPickGridSlot('chiang-mai').photoClass, 'aspect-[3/2]');
  assert.equal(resolveExploreMonthlyPickGridSlot('phu-quoc').photoClass, 'aspect-[3/2]');
  assert.equal(resolveExploreMonthlyPickGridSlot('jeju').variant, 'landscape');
  assert.equal(resolveExploreMonthlyPickGridSlot('jeju').photoClass, 'aspect-[3/2]');
  assert.equal(resolveExploreMonthlyPickGridSlot('dubai').photoClass, 'aspect-[4/5]');
  assert.equal(resolveExploreMonthlyPickGridSlot('melbourne').photoClass, 'aspect-[4/3]');
  const grouped = groupExploreMonthlyPickColumns(
    EXPECTED_SLUGS.map((slug) => ({ spot: { slug }, entry: { slug } })),
  );
  assert.deepEqual(
    grouped.map((column) => column.map((card) => card.spot.slug)),
    [
      ['kyoto', 'chiang-mai', 'dubai'],
      ['jeju', 'phu-quoc', 'melbourne'],
    ],
  );
  assert.doesNotMatch(layoutB, /distributeFestivalHubMasonryColumns|partitionFestivalHubSegments/);
  assert.doesNotMatch(layoutB, /sourcesBelow/);
  assert.equal(existsSync(join(dir, 'exploreMonthlyMasonryLayout.js')), false);
});

test('Home /explore SEO has no explore_v2 query noindex', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  assert.doesNotMatch(home, /readExploreV2QueryParam|exploreV2QueryNoIndex|robotsNoIndex=/);
});

test('monthly pick card places text panel below photo frame so caption does not cover photo', () => {
  const item = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/ExploreMonthlyPickItem.jsx'),
    'utf8',
  );
  assert.match(item, /explore-v2-monthly-photo-/);
  assert.match(item, /explore-v2-monthly-text-panel/);
  assert.match(item, /explore-v2-monthly-summary/);
  assert.match(item, /entry\?\.reason/);
  assert.doesNotMatch(item, /spot\?\.desc/);
  assert.doesNotMatch(item, /explore-v2-monthly-source-link/);
  assert.doesNotMatch(item, /파일·정책|SourceLinks|PhotoCreditLine/);
  assert.doesNotMatch(item, /bg-gradient-to-t from-black\/95/);
});

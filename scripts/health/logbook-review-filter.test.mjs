import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  filterLogbookOfficialReviewRows,
  groupLogbookOfficialReviews,
  isLogbookReviewPlaceDomestic,
  LOGBOOK_REVIEW_FILTER_MAJOR,
} from '../../src/logbookOfficialReviews/groupLogbookOfficialReviews.js';
import {
  buildLogbookReviewCityChipLayout,
  LOGBOOK_REVIEW_CITY_CHIP_VISIBLE_MAX,
} from '../../src/logbookOfficialReviews/logbookReviewCityChips.js';
import { shortenLogbookReviewPlaceName } from '../../src/logbookOfficialReviews/logbookReviewPlaceLabel.js';
import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import {
  LOGBOOK_OFFICIAL_REVIEW_HUB_CARD_PAGE_SIZE,
  LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE,
} from '../../src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx';
import { buildPlaceReviewsHref } from '../../src/utils/placeReviewFocus.js';
import {
  optimizeLogbookReviewCardThumbUrl,
  wikimediaCommonsCardThumbUrl,
} from '../../src/logbookOfficialReviews/logbookReviewCardThumbUrl.js';
import {
  logbookReviewFilterUrlNeedsNormalize,
  parseLogbookReviewFilterFromSearch,
} from '../../src/logbookOfficialReviews/logbookReviewFilterUrl.js';

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('isLogbookReviewPlaceDomestic uses travelSpots-list (jeju)', () => {
  assert.equal(isLogbookReviewPlaceDomestic('jeju'), true);
  assert.equal(isLogbookReviewPlaceDomestic('paris'), false);
});

test('isLogbookReviewPlaceDomestic — domestic fallback slugs (approved 11/13)', () => {
  assert.equal(isLogbookReviewPlaceDomestic('hwaseong-fortress'), true);
  assert.equal(isLogbookReviewPlaceDomestic('suncheon-bay-wetland'), true);
});

test('shortenLogbookReviewPlaceName trims venue suffix', () => {
  assert.equal(shortenLogbookReviewPlaceName('파리 · 루브르'), '파리');
  assert.equal(shortenLogbookReviewPlaceName('제주'), '제주');
});

test('groupLogbookOfficialReviews — counts and city sort', () => {
  const rows = [
    { place_slug: 'jeju', place_name: '제주' },
    { place_slug: 'jeju', place_name: '제주' },
    { place_slug: 'paris', place_name: '파리 · 루브르' },
    { place_slug: 'paris', place_name: '파리' },
    { place_slug: 'paris', place_name: '파리' },
    { place_slug: 'bangkok', place_name: '방콕' },
  ];
  const g = groupLogbookOfficialReviews(rows);
  assert.equal(g.total, 6);
  assert.equal(g.domesticCount, 2);
  assert.equal(g.overseasCount, 4);
  assert.deepEqual(
    g.cities.map((c) => c.slug),
    ['paris', 'jeju', 'bangkok'],
  );
  assert.equal(g.cities[0].shortPlaceName, '파리');
  assert.equal(g.cities[0].count, 3);
});

test('buildLogbookReviewCityChipLayout — top 8 + other count', () => {
  const cities = Array.from({ length: 12 }, (_, i) => ({
    slug: `city-${i}`,
    placeName: `도시${i}`,
    shortPlaceName: `도시${i}`,
    count: 12 - i,
    domestic: false,
  }));
  const layout = buildLogbookReviewCityChipLayout(cities);
  assert.equal(layout.primary.length, LOGBOOK_REVIEW_CITY_CHIP_VISIBLE_MAX);
  assert.equal(layout.overflowCount, 4);
});

test('buildLogbookReviewCityChipLayout — promotes selected overflow chip', () => {
  const cities = Array.from({ length: 10 }, (_, i) => ({
    slug: `city-${i}`,
    placeName: `도시${i}`,
    shortPlaceName: `도시${i}`,
    count: 10 - i,
    domestic: false,
  }));
  const layout = buildLogbookReviewCityChipLayout(cities, 'city-9');
  assert.ok(layout.primary.some((c) => c.slug === 'city-9'));
  assert.equal(layout.primary.length, LOGBOOK_REVIEW_CITY_CHIP_VISIBLE_MAX);
});

test('filterLogbookOfficialReviewRows — major and city', () => {
  const rows = [
    { id: '1', place_slug: 'jeju' },
    { id: '2', place_slug: 'paris' },
    { id: '3', place_slug: 'paris' },
  ];
  const domestic = filterLogbookOfficialReviewRows(rows, LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC, null);
  assert.equal(domestic.length, 1);
  const parisOnly = filterLogbookOfficialReviewRows(
    rows,
    LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS,
    'paris',
  );
  assert.equal(parisOnly.length, 2);
});

test('card page size is 12 when filter grid is on', () => {
  assert.equal(LOGBOOK_OFFICIAL_REVIEW_HUB_CARD_PAGE_SIZE, 12);
  assert.equal(LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE, 10);
});

test('hub card wires filter flag without forced scroll', () => {
  const hub = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx'),
    'utf8',
  );
  const filter = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewFilter.jsx'),
    'utf8',
  );
  const grid = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewCardGrid.jsx'),
    'utf8',
  );
  assert.match(hub, /isGateoLogbookReviewFilterEnabled/);
  assert.match(hub, /LogbookOfficialReviewFilter/);
  assert.match(hub, /LogbookOfficialReviewCardGrid/);
  assert.match(hub, /logbookReviewFilterUrlNeedsNormalize/);
  assert.match(hub, /replace: false/);
  assert.match(hub, /location\.search/);
  assert.match(filter, /data-testid="logbook-review-filter"/);
  assert.match(filter, /logbook-review-filter-other-cities/);
  assert.match(filter, /overflow-x-auto/);
  assert.match(filter, /flex-nowrap/);
  assert.match(grid, /grid-cols-2/);
  assert.match(grid, /xl:grid-cols-3/);
  assert.match(grid, /aspect-\[4\/3\]/);
  assert.match(grid, /logbook-official-review-hub-card-fallback/);
  assert.match(grid, /setLoadState\('fail'\)/);
  assert.match(grid, /optimizeLogbookReviewCardThumbUrl/);
  assert.match(grid, /loading: preferEager \? 'eager' : 'lazy'/);
  assert.match(grid, /logbook-official-review-hub-card-summary/);
  assert.match(grid, /buildPlaceReviewsHref/);
  assert.doesNotMatch(hub, /scrollIntoView/);
  assert.doesNotMatch(filter, /scrollIntoView/);
});

test('logbookReviewFilterUrlNeedsNormalize — invalid region only', () => {
  assert.equal(logbookReviewFilterUrlNeedsNormalize('?region=overseas'), false);
  assert.equal(logbookReviewFilterUrlNeedsNormalize('?region=nope'), true);
  assert.equal(parseLogbookReviewFilterFromSearch('?region=nope').major, 'all');
});

test('wikimedia card thumb rewrite — encoded filename', () => {
  const original =
    'https://upload.wikimedia.org/wikipedia/commons/5/5b/Colosseum_of_Rome%2C_Italy.jpg';
  assert.equal(
    wikimediaCommonsCardThumbUrl(original, 640),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Colosseum_of_Rome%2C_Italy.jpg/640px-Colosseum_of_Rome%2C_Italy.jpg',
  );
  assert.equal(
    wikimediaCommonsCardThumbUrl(original, 960),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Colosseum_of_Rome%2C_Italy.jpg/960px-Colosseum_of_Rome%2C_Italy.jpg',
  );
  const { src, srcSet } = optimizeLogbookReviewCardThumbUrl(original);
  assert.match(src, /\/thumb\/5\/5b\//);
  assert.match(src, /960px-Colosseum_of_Rome%2C_Italy\.jpg/);
  assert.match(srcSet, /1280px-Colosseum_of_Rome%2C_Italy\.jpg/);
});

test('optimizeLogbookReviewCardThumbUrl — unsplash only when imgix params exist', () => {
  const bare = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34';
  assert.equal(optimizeLogbookReviewCardThumbUrl(bare).src, bare);
  const tuned = `${bare}?w=400&fit=crop`;
  const out = optimizeLogbookReviewCardThumbUrl(tuned).src;
  assert.match(out, /[?&]w=640/);
  assert.match(out, /[?&]q=70/);
});

test('card href includes review deep link', () => {
  assert.equal(
    buildPlaceReviewsHref('/place/paris', 'abc'),
    '/place/paris/reviews?review=abc',
  );
});

test('LOGBOOK_REVIEW_FILTER env defaults off', async () => {
  const key = GATEO_ENV_FLAG_NAMES.LOGBOOK_REVIEW_FILTER;
  const prev = globalThis.__VITE_ENV__?.[key];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [key]: '' };
  const { isGateoLogbookReviewFilterEnabled: envOnly } = await import(
    '../../src/shared/gateoFeatureFlags.js'
  );
  assert.equal(envOnly(), false);
  if (prev === undefined) delete globalThis.__VITE_ENV__[key];
  else globalThis.__VITE_ENV__[key] = prev;
});
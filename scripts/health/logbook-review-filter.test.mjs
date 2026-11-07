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
import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('isLogbookReviewPlaceDomestic uses travelSpots-list (jeju)', () => {
  assert.equal(isLogbookReviewPlaceDomestic('jeju'), true);
  assert.equal(isLogbookReviewPlaceDomestic('paris'), false);
});

test('groupLogbookOfficialReviews — counts and city sort', () => {
  const rows = [
    { place_slug: 'jeju', place_name: '제주' },
    { place_slug: 'jeju', place_name: '제주' },
    { place_slug: 'paris', place_name: '파리' },
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
  assert.equal(g.cities[0].count, 3);
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

test('hub card wires filter flag without forced scroll', () => {
  const hub = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx'),
    'utf8',
  );
  const filter = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewFilter.jsx'),
    'utf8',
  );
  assert.match(hub, /isGateoLogbookReviewFilterEnabled/);
  assert.match(hub, /LogbookOfficialReviewFilter/);
  assert.match(filter, /data-testid="logbook-review-filter"/);
  assert.doesNotMatch(hub, /scrollIntoView/);
  assert.doesNotMatch(filter, /scrollIntoView/);
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

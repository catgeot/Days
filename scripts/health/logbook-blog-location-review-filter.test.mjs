import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveLogbookBlogLocationReviewFilter } from '../../src/logbookOfficialReviews/logbookBlogLocationReviewFilter.js';
import { LOGBOOK_REVIEW_FILTER_MAJOR } from '../../src/logbookOfficialReviews/groupLogbookOfficialReviews.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('resolveLogbookBlogLocationReviewFilter maps Korean place names to review slugs', () => {
  const gbr = resolveLogbookBlogLocationReviewFilter('그레이트 배리어 리프');
  assert.equal(gbr.citySlug, 'great-barrier-reef');
  assert.equal(gbr.major, LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS);

  const jeju = resolveLogbookBlogLocationReviewFilter('제주');
  assert.equal(jeju.citySlug, 'jeju');
  assert.equal(jeju.major, LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC);
});

test('Dashboard reorders feed before review hub when location filter is active', () => {
  const dash = readFileSync(join(root, 'src/pages/DailyReport/Dashboard.jsx'), 'utf8');
  assert.match(dash, /blogPlaceFilterActive/);
  assert.match(dash, /blogLocationFilter=\{locationFilter\}/);
  assert.match(dash, /RecentList reports=\{reports/);
});
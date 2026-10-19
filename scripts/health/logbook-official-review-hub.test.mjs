import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM,
  LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE,
  LOGBOOK_OFFICIAL_REVIEWER_DROPDOWN_ORDER,
} from '../../src/logbookOfficialReviews/constants.js';
import {
  countPersonaLabels,
  fetchEditorialReviewIndex,
  sortPersonaLabelsForDropdown,
} from '../../src/logbookOfficialReviews/editorialReviewIndex.js';
import {
  formatGateoReviewerBadge,
  normalizePersonaLabel,
} from '../../src/utils/placeReviewEditorial.js';
import { LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE } from '../../src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx';
import {
  isGateoReviewDeeplinkEnabled,
  isLogbookOfficialReviewHubEnabled,
} from '../../src/utils/logbookOfficialReviewHubFlag.js';

test('fixed product strings (CEO 2026-10-19)', () => {
  assert.equal(LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE, 'GATEO 리뷰어 리뷰');
  assert.equal(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM, 'review');
});

test('reviewer dropdown order includes 가족나들이', () => {
  assert.ok(LOGBOOK_OFFICIAL_REVIEWER_DROPDOWN_ORDER.includes('가족나들이'));
});

test('normalizePersonaLabel strips GATEO reviewer prefix', () => {
  assert.equal(normalizePersonaLabel('야경렌즈'), '야경렌즈');
  assert.equal(normalizePersonaLabel('GATEO 리뷰어 · 문턱없이'), '문턱없이');
  assert.equal(normalizePersonaLabel('GATEO 리뷰어·로컬하루'), '로컬하루');
});

test('sortPersonaLabelsForDropdown — known order, 이틀컷 after constants', () => {
  const sorted = sortPersonaLabelsForDropdown([
    '이틀컷',
    '야경렌즈',
    '가족나들이',
    '미식갑니다',
    'GATEO 리뷰어 · 문턱없이',
  ]);
  assert.deepEqual(sorted, ['미식갑니다', '야경렌즈', '가족나들이', '문턱없이', '이틀컷']);
});

test('countPersonaLabels aggregates', () => {
  const counts = countPersonaLabels([
    { persona_label: '야경렌즈' },
    { persona_label: '야경렌즈' },
    { persona_label: '' },
  ]);
  assert.equal(counts['야경렌즈'], 2);
  assert.equal(counts['(empty)'], 1);
});

test('fetchEditorialReviewIndex uses is_editorial filter', async () => {
  const calls = [];
  const mockClient = {
    from(table) {
      assert.equal(table, 'place_reviews');
      return {
        select(cols) {
          calls.push(['select', cols]);
          return this;
        },
        eq(col, val) {
          calls.push(['eq', col, val]);
          return this;
        },
        order(col, opts) {
          calls.push(['order', col, opts]);
          return this;
        },
        limit(n) {
          calls.push(['limit', n]);
          return Promise.resolve({ data: [{ id: 'x' }], error: null });
        },
      };
    },
  };
  const rows = await fetchEditorialReviewIndex(mockClient, { limit: 10 });
  assert.equal(rows.length, 1);
  assert.ok(calls.some((c) => c[0] === 'eq' && c[1] === 'is_editorial' && c[2] === true));
  assert.ok(calls.some((c) => c[0] === 'eq' && c[1] === 'is_public' && c[2] === true));
});

test('feature flags default off', () => {
  const prev = globalThis.__VITE_ENV__;
  globalThis.__VITE_ENV__ = {
    ...(prev || {}),
    VITE_GATEO_LOGBOOK_REVIEW_HUB: '',
    VITE_GATEO_REVIEW_DEEPLINK: '',
  };
  assert.equal(isLogbookOfficialReviewHubEnabled(), false);
  assert.equal(isGateoReviewDeeplinkEnabled(), false);
  globalThis.__VITE_ENV__ = prev;
});

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('useLogbookOfficialReviewHub logs fetch failures only in DEV', () => {
  const src = readFileSync(
    join(healthRoot, 'src/logbookOfficialReviews/useLogbookOfficialReviewHub.js'),
    'utf8',
  );
  assert.match(src, /import\.meta\.env\.DEV/);
  assert.doesNotMatch(src, /console\.error\(\s*'\[logbook-review-hub\]/);
});

test('hub card shows loadFailed retry UI (not blank)', () => {
  const src = readFileSync(
    join(
      healthRoot,
      'src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx',
    ),
    'utf8',
  );
  assert.match(src, /리뷰를 불러오지 못했어요/);
  assert.match(src, /logbook-official-review-hub-retry/);
  assert.match(src, /data-hub-state="load-failed"/);
});

test('이틀컷 persona badge uses DB label (no rename to 문턱없이)', () => {
  assert.equal(formatGateoReviewerBadge('이틀컷'), 'GATEO 리뷰어 · 이틀컷');
  assert.equal(normalizePersonaLabel('이틀컷'), '이틀컷');
});

test('hub pagination reaches Paris editorial row at rank 28', () => {
  const parisId = '62190bb0-b77d-4485-9e83-98ec5e3d85f6';
  const rows = Array.from({ length: 32 }, (_, i) => ({
    id: i === 27 ? parisId : `row-${i}`,
    created_at: `2026-01-${String(32 - i).padStart(2, '0')}`,
  }));
  let visibleCount = LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE;
  const moreClicks = [];
  while (visibleCount < rows.length) {
    const prev = visibleCount;
    visibleCount = Math.min(
      visibleCount + LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE,
      rows.length,
    );
    moreClicks.push(visibleCount - prev);
    const slice = rows.slice(0, visibleCount);
    if (slice.some((r) => r.id === parisId)) break;
  }
  const visible = rows.slice(0, visibleCount);
  assert.ok(visible.some((r) => r.id === parisId));
  assert.equal(moreClicks.length, 2);
  assert.equal(visibleCount, 30);
});

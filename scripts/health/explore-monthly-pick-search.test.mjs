import assert from 'node:assert/strict';
import test from 'node:test';

const { buildLocalSearchSuggestions, buildHybridSearchSuggestions } = await import(
  '../../src/pages/Home/lib/searchSuggestions.js'
);
const {
  buildMonthlyPickSearchSuggestionsFromCards,
  parseExploreMonthlyPickSearchQuery,
} = await import('../../src/pages/Home/lib/exploreMonthlyPickSearchSuggestions.js');

const NOVEMBER_SLUGS = ['kyoto', 'chiang-mai', 'phu-quoc', 'jeju', 'dubai', 'melbourne'];

function monthlyRows(items) {
  return (items || []).filter((item) => item.source === 'monthly-pick');
}

test('«11월 여행» returns every MONTHLY_PICKS spot without separate search registration', () => {
  const items = buildLocalSearchSuggestions('11월 여행');
  const picks = monthlyRows(items);
  assert.deepEqual(
    picks.map((item) => item.slug),
    NOVEMBER_SLUGS,
  );
  assert.ok(picks.every((item) => item.groupTitle === '11월의 여행지'));
  assert.ok(picks.every((item) => item.kind === 'spot' && item.slug));
  assert.ok(picks.every((item) => String(item.searchOverlayDesc || '').length > 0));
});

test('monthly pick search aliases: headline, year, and English month', () => {
  for (const query of ['11월의 여행지', '2026년 11월 여행', 'November travel', '11월']) {
    assert.deepEqual(
      monthlyRows(buildLocalSearchSuggestions(query)).map((item) => item.slug),
      NOVEMBER_SLUGS,
      query,
    );
  }
});

test('«11월 해외여행» excludes the domestic pick', () => {
  const slugs = monthlyRows(buildLocalSearchSuggestions('11월 해외여행')).map((item) => item.slug);
  assert.deepEqual(slugs, ['kyoto', 'chiang-mai', 'phu-quoc', 'dubai', 'melbourne']);
});

test('reason keywords are searchable without a month («단풍 여행», «멜버른컵 여행»)', () => {
  assert.deepEqual(
    monthlyRows(buildLocalSearchSuggestions('단풍 여행')).map((item) => item.slug),
    ['kyoto'],
  );
  assert.deepEqual(
    monthlyRows(buildLocalSearchSuggestions('멜버른컵 여행')).map((item) => item.slug),
    ['melbourne'],
  );
  assert.deepEqual(
    monthlyRows(buildLocalSearchSuggestions('11월 단풍 여행')).map((item) => item.slug),
    ['kyoto'],
  );
});

test('non-monthly queries are not hijacked', () => {
  assert.equal(monthlyRows(buildLocalSearchSuggestions('여행')).length, 0);
  assert.equal(monthlyRows(buildLocalSearchSuggestions('교토')).length, 0);
  assert.equal(monthlyRows(buildLocalSearchSuggestions('교토 11월')).length, 0);
  assert.equal(parseExploreMonthlyPickSearchQuery('교토 11월 날씨'), null);
});

test('hybrid search keeps monthly picks and skips Mapbox noise', async () => {
  const items = await buildHybridSearchSuggestions('11월 여행');
  assert.deepEqual(
    items.map((item) => item.slug),
    NOVEMBER_SLUGS,
  );
  assert.ok(items.every((item) => item.source === 'monthly-pick'));
});

test('a future month pick is searchable from its SSOT entry alone', () => {
  const futureCards = {
    '2027-12': [
      {
        entry: {
          slug: 'sapporo',
          reason: '12월 눈축제 시즌',
          sources: [{ url: 'https://example.com', label: '공식' }],
          checked: '2027-12-01',
        },
        spot: {
          slug: 'sapporo',
          name: '삿포로',
          name_en: 'Sapporo',
          country: '일본',
          country_en: 'Japan',
          lat: 43.0618,
          lng: 141.3545,
        },
      },
    ],
  };
  assert.deepEqual(
    buildMonthlyPickSearchSuggestionsFromCards('12월 여행', futureCards).map((i) => i.slug),
    ['sapporo'],
  );
  assert.deepEqual(
    buildMonthlyPickSearchSuggestionsFromCards('눈축제 여행', futureCards).map((i) => i.slug),
    ['sapporo'],
  );
  assert.deepEqual(
    buildMonthlyPickSearchSuggestionsFromCards('December travel', futureCards).map((i) => i.slug),
    ['sapporo'],
  );
});

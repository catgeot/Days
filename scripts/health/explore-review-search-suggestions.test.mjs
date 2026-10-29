import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_SITE_SEARCH: '1' };

const {
  buildExploreReviewSuggestionsFromPool,
  filterExploreReviewSearchQuery,
  reviewRowToExploreSuggestion,
  resetExploreReviewSearchPoolForTests,
} = await import('../../src/pages/Home/lib/exploreReviewSearchSuggestions.js');
const { resolveSearchSuggestionGroup } = await import(
  '../../src/pages/Home/lib/normalizeSearchSuggestions.js'
);

const POOL = [
  {
    id: 'rev-bin',
    place_slug: 'vienna',
    place_name: '비엔나',
    persona_label: '야경렌즈',
    content: '빈 거리에서 걸으며 본 오페라 하우스',
    is_public: true,
    is_editorial: true,
  },
  {
    id: 'rev-paris',
    place_slug: 'paris',
    place_name: '파리',
    persona_label: '미식갑니다',
    content: '파리 골목 브런치',
    is_public: true,
    is_editorial: true,
  },
];

test('filterExploreReviewSearchQuery matches editorial public rows', () => {
  resetExploreReviewSearchPoolForTests();
  const binHits = filterExploreReviewSearchQuery(POOL, '빈');
  assert.equal(binHits.length, 1);
  assert.equal(binHits[0].id, 'rev-bin');
});

test('reviewRowToExploreSuggestion uses kind=review + exploreHref', () => {
  const row = reviewRowToExploreSuggestion(POOL[0]);
  assert.equal(row.kind, 'review');
  assert.equal(resolveSearchSuggestionGroup(row), 'review');
  assert.match(row.exploreHref, /\/place\/vienna\/reviews\?review=rev-bin/);
});

test('buildExploreReviewSuggestionsFromPool caps maxItems', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({
    ...POOL[0],
    id: `rev-${i}`,
    content: `빈 리뷰 ${i}`,
  }));
  const hits = buildExploreReviewSuggestionsFromPool(many, '빈', { maxItems: 3 });
  assert.equal(hits.length, 3);
});

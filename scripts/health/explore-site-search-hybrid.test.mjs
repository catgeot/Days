import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_SITE_SEARCH: '1' };

const { buildHybridSearchSuggestions } = await import('../../src/pages/Home/lib/searchSuggestions.js');
const { buildExploreSiteSearchHybridSuggestions, EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS } =
  await import('../../src/pages/Home/lib/exploreSiteSearchHybrid.js');
const { buildExploreSubmitParityDisambiguation } = await import(
  '../../src/pages/Home/lib/exploreSearchSubmitParity.js'
);
const { runExploreHybridSuggestUpdate } = await import(
  '../../src/pages/Home/lib/exploreHybridSuggestUpdate.js'
);
const {
  appendExploreFestivalBelowPlaceBlock,
  buildExploreFestivalSuggestionsFromPool,
} = await import('../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js');
const {
  appendExploreReviewBelowPlaceBlock,
  buildExploreReviewSuggestionsFromPool,
} = await import('../../src/pages/Home/lib/exploreReviewSearchSuggestions.js');
const { resolveSearchSuggestionGroup } = await import(
  '../../src/pages/Home/lib/normalizeSearchSuggestions.js'
);

const NOW = new Date('2026-10-28T12:00:00+09:00');

const FEST_POOL = [
  {
    contentId: '888',
    title: '빈거리 포항스틸아트페스티벌',
    eventStartDate: '20261001',
    eventEndDate: '20261005',
    addr1: '경상북도 포항시',
  },
];

const REVIEW_POOL = [
  {
    id: 'rev-vienna',
    place_slug: 'vienna',
    place_name: '비엔나',
    persona_label: '야경렌즈',
    content: '빈 거리 산책',
    is_public: true,
    is_editorial: true,
  },
];

function countKinds(items) {
  const counts = {
    festival: 0,
    review: 0,
    attraction: 0,
    city_destination: 0,
    other: 0,
  };
  for (const item of items || []) {
    const g = resolveSearchSuggestionGroup(item);
    if (g === 'festival') counts.festival += 1;
    else if (g === 'review') counts.review += 1;
    else if (g === 'attraction') counts.attraction += 1;
    else if (g === 'city' || g === 'destination') counts.city_destination += 1;
    else counts.other += 1;
  }
  return counts;
}

async function mergedHybridForQuery(query) {
  const base = await buildHybridSearchSuggestions(query);
  const fest = buildExploreFestivalSuggestionsFromPool(FEST_POOL, query, { now: NOW });
  const reviews = buildExploreReviewSuggestionsFromPool(REVIEW_POOL, query);
  let items = appendExploreFestivalBelowPlaceBlock(fest, base, {
    maxItems: EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS,
  });
  items = appendExploreReviewBelowPlaceBlock(reviews, items, {
    maxItems: EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS,
  });
  return items;
}

test('buildExploreSiteSearchHybridSuggestions merges festival + review fixtures for «빈»', async () => {
  const items = await buildExploreSiteSearchHybridSuggestions('빈', {
    festPool: FEST_POOL,
    reviewPool: REVIEW_POOL,
    now: NOW,
  });
  const counts = countKinds(items);
  assert.ok(counts.festival >= 1, 'festival row present');
  assert.ok(counts.review >= 1, 'review row present');
});

test('submit parity Enter candidates match autocomplete kind counts', async () => {
  const query = '빈';
  let autoItems = [];
  await runExploreHybridSuggestUpdate(
    query,
    1,
    () => 1,
    {
      onPaint: (items) => {
        autoItems = items;
      },
    },
    {
      isSiteSearchEnabled: () => true,
      isSubmitParityEnabled: () => true,
      buildHybrid: (q) => buildHybridSearchSuggestions(q),
      buildFest: async () => buildExploreFestivalSuggestionsFromPool(FEST_POOL, query, { now: NOW }),
      applyMerge: async (_q, items, opts) => {
        const fest = await opts.festPromise;
        return {
          items: appendExploreFestivalBelowPlaceBlock(fest, items, {
            maxItems: EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS,
          }),
          late: null,
        };
      },
      mergeReview: async (_q, items) => {
        const reviews = buildExploreReviewSuggestionsFromPool(REVIEW_POOL, query);
        return appendExploreReviewBelowPlaceBlock(reviews, items, {
          maxItems: EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS,
        });
      },
    },
  );

  const enter = await buildExploreSubmitParityDisambiguation(query, {
    festPool: FEST_POOL,
    reviewPool: REVIEW_POOL,
    now: NOW,
  });
  assert.ok(enter?.candidates?.length, 'enter candidates');
  assert.deepEqual(
    countKinds(autoItems),
    countKinds(enter.candidates),
    'autocomplete vs Enter kind counts must match',
  );
  assert.ok(
    enter.candidates.some((row) => resolveSearchSuggestionGroup(row) === 'festival'),
    'Enter must include festival visible in autocomplete',
  );
});

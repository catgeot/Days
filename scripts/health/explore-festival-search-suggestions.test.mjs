import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_SITE_SEARCH: '1' };

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const {
  buildExploreFestivalSuggestionsFromPool,
  exploreFestivalSearchTokens,
  festivalItemToExploreSuggestion,
  appendExploreFestivalBelowPlaceBlock,
  applyExploreFestivalMergeStrategy,
  explorePlaceBlockInsertIndex,
  prependExploreFestivalSuggestions,
  rankExploreFestivalSearchHits,
  filterExploreFestivalSearchQuery,
} = await import('../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js');
const { isFestivalEnded } = await import('../../src/pages/Korea/festivalDeepLinkItem.js');
const { buildLocalSearchSuggestions } = await import('../../src/pages/Home/lib/searchSuggestions.js');
const { pickEnterSuggestionMatches } = await import('../../src/pages/Home/lib/searchEnterMatch.js');
const { EXPLORE_BADGE_FESTIVAL } = await import('../../src/i18n/exploreUi.js');

const FIXTURE_POOL = [
  {
    contentId: '111',
    title: '진주남강유등축제',
    eventStartDate: '20261001',
    eventEndDate: '20261012',
    addr1: '경상남도 진주시',
  },
  {
    contentId: '222',
    title: '마산가고파국화축제',
    eventStartDate: '20261031',
    eventEndDate: '20261108',
    addr1: '경상남도 창원시 마산합포구',
  },
  {
    contentId: '333',
    title: '화천산천어축제',
    eventStartDate: '20260110',
    eventEndDate: '20260126',
    addr1: '강원특별자치도 화천군',
  },
  {
    contentId: '444',
    title: '강릉커피축제',
    eventStartDate: '20261109',
    eventEndDate: '20261113',
    addr1: '강원특별자치도 강릉시',
    titleEn: 'Gangneung Coffee Festival',
  },
  {
    contentId: '901',
    title: '강릉 종료축제A',
    eventStartDate: '20250901',
    eventEndDate: '20250905',
    addr1: '강원특별자치도 강릉시',
  },
  {
    contentId: '902',
    title: '강릉 종료축제B',
    eventStartDate: '20250801',
    eventEndDate: '20250805',
    addr1: '강원특별자치도 강릉시',
  },
  {
    contentId: '903',
    title: '강릉 종료축제C',
    eventStartDate: '20250701',
    eventEndDate: '20250705',
    addr1: '강원특별자치도 강릉시',
  },
];

const NOW = new Date('2026-10-28T12:00:00+09:00');

test('buildHybridSearchSuggestions does not import explore festival merge', () => {
  const src = readFileSync(join(root, 'src/pages/Home/lib/searchSuggestions.js'), 'utf8');
  assert.doesNotMatch(src, /exploreFestivalSearchSuggestions/);
  assert.doesNotMatch(src, /buildExploreFestivalSearchSuggestions/);
});

test('exploreFestivalSearchTokens supports spaced queries only on explore', () => {
  assert.deepEqual(exploreFestivalSearchTokens('진주 유등'), ['진주', '유등']);
  assert.deepEqual(exploreFestivalSearchTokens('  산 천 어 '), ['산천어']);
});

test('buildExploreFestivalSuggestionsFromPool matches acceptance queries', () => {
  const cases = [
    { query: '진주 유등', contentId: '111' },
    { query: '마산 국화', contentId: '222' },
    { query: '산천어', contentId: '333' },
    { query: '강릉', contentId: '444' },
  ];
  for (const { query, contentId } of cases) {
    const hits = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, query, { now: NOW });
    assert.equal(hits.length >= 1, true, query);
    assert.equal(hits[0].festivalContentId, contentId, query);
    assert.equal(hits[0].kind, 'festival');
    assert.equal(hits[0].badge, EXPLORE_BADGE_FESTIVAL);
    assert.match(hits[0].exploreHref, new RegExp(`festival=${contentId}`));
  }
});

test('filterExploreFestivalSearchQuery matches English titleEn (Gangneung)', () => {
  const pool = [
    {
      contentId: '444',
      title: '강릉커피축제',
      titleEn: 'Gangneung Coffee Festival',
      eventStartDate: '20261109',
      eventEndDate: '20261113',
      addr1: '강원특별자치도 강릉시',
    },
    {
      contentId: '999',
      title: '서울빛초롱축제',
      titleEn: 'Seoul Lantern Festival',
      eventStartDate: '20261101',
      eventEndDate: '20261103',
      addr1: '서울특별시 중구',
    },
  ];
  const hits = filterExploreFestivalSearchQuery(pool, 'Gangneung', { locale: 'en' });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].contentId, '444');
});

test('rankExploreFestivalSearchHits caps ended festivals and ranks active first', () => {
  const hits = filterExploreFestivalSearchQuery(FIXTURE_POOL, '강릉', { locale: 'ko' });
  const ranked = rankExploreFestivalSearchHits(hits, NOW, { maxActive: 3, maxEnded: 2 });
  assert.equal(ranked[0].contentId, '444');
  const endedIds = ranked.filter((r) => ['901', '902', '903'].includes(r.contentId));
  assert.equal(endedIds.length, 2);
});

test('festivalItemToExploreSuggestion localizes EN title lines', () => {
  const item = FIXTURE_POOL.find((row) => row.contentId === '444');
  const en = festivalItemToExploreSuggestion(item, 'en');
  assert.equal(en.name, 'Gangneung Coffee Festival');
  assert.equal(en.name_en, '강릉커피축제');
});

test('appendExploreFestivalBelowPlaceBlock inserts after local place block', () => {
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉', { now: NOW });
  const hybrid = [
    { id: 'city-1', kind: 'city', name: '강릉', source: 'ssot' },
    { id: 'map-1', kind: 'city', name: 'Gangneung KR', source: 'mapbox' },
  ];
  assert.equal(explorePlaceBlockInsertIndex(hybrid), 1);
  const merged = appendExploreFestivalBelowPlaceBlock(festivals, hybrid);
  assert.equal(merged[0].id, 'city-1');
  assert.equal(merged[1]?.kind, 'festival');
  assert.equal(merged[merged.length - 1].id, 'map-1');
});

test('applyExploreFestivalMergeStrategy prepends when festivals resolve within 300ms', async () => {
  const hybrid = [{ id: 'city-1', kind: 'city', source: 'ssot' }];
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉', { now: NOW });
  const festPromise = Promise.resolve(festivals);
  const { items, late } = await applyExploreFestivalMergeStrategy('강릉', hybrid, {
    startedAt: Date.now(),
    festPromise,
  });
  assert.equal(late, null);
  assert.equal(items[0]?.kind, 'festival');
});

test('applyExploreFestivalMergeStrategy appends when festivals resolve after wait window', async () => {
  const hybrid = [
    { id: 'city-1', kind: 'city', source: 'ssot' },
    { id: 'map-1', source: 'mapbox' },
  ];
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉', { now: NOW });
  const festPromise = new Promise((resolve) => {
    setTimeout(() => resolve(festivals), 50);
  });
  const { items, late } = await applyExploreFestivalMergeStrategy('강릉', hybrid, {
    startedAt: Date.now() - 301,
    festPromise,
  });
  assert.equal(items[0].id, 'city-1');
  assert.ok(late);
  const merged = await late();
  assert.equal(merged[0].id, 'city-1');
  assert.equal(merged[1]?.kind, 'festival');
});

test('prependExploreFestivalSuggestions keeps festivals before local hits', () => {
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉', { now: NOW });
  const local = buildLocalSearchSuggestions('강릉');
  const merged = prependExploreFestivalSuggestions(festivals, local);
  assert.equal(merged[0]?.kind, 'festival');
});

test('pickEnterSuggestionMatches skips festival rows without coords', () => {
  const fest = festivalItemToExploreSuggestion(FIXTURE_POOL[0], 'ko');
  assert.equal(
    pickEnterSuggestionMatches('진주남강유등축제', [fest]).length,
    0,
  );
});

function assertActiveFestivalsBeforeEndedInList(merged, pool, now) {
  const festRows = (merged || []).filter((row) => row.kind === 'festival');
  let seenEnded = false;
  for (const row of festRows) {
    const poolItem = pool.find((p) => p.contentId === row.festivalContentId);
    const ended = poolItem ? isFestivalEnded(poolItem.eventEndDate, now) : false;
    if (ended) seenEnded = true;
    else if (seenEnded) {
      assert.fail(`active festival ${row.festivalContentId} after ended row`);
    }
  }
}

test('merged explore list keeps active festivals before ended (prepend path)', () => {
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉', { now: NOW });
  const local = buildLocalSearchSuggestions('강릉');
  const merged = prependExploreFestivalSuggestions(festivals, local);
  assertActiveFestivalsBeforeEndedInList(merged, FIXTURE_POOL, NOW);
});

test('merged explore list keeps active festivals before ended (late-append path)', async () => {
  const hybrid = [
    { id: 'city-1', kind: 'city', source: 'ssot', name: '강릉' },
    { id: 'map-1', source: 'mapbox' },
  ];
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉', { now: NOW });
  const festPromise = Promise.resolve(festivals);
  const { late } = await applyExploreFestivalMergeStrategy('강릉', hybrid, {
    startedAt: Date.now() - 301,
    festPromise,
  });
  assert.ok(late);
  const merged = await late();
  assertActiveFestivalsBeforeEndedInList(merged, FIXTURE_POOL, NOW);
});

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
  prependExploreFestivalSuggestions,
  rankExploreFestivalSearchHits,
  filterExploreFestivalSearchQuery,
} = await import('../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js');
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

test('rankExploreFestivalSearchHits caps ended festivals and ranks active first', () => {
  const hits = filterExploreFestivalSearchQuery(FIXTURE_POOL, '강릉');
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

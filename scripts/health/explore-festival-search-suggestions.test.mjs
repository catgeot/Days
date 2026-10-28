import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExploreFestivalSuggestionsFromPool,
  festivalItemToExploreSuggestion,
  prependExploreFestivalSuggestions,
} from '../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { EXPLORE_BADGE_FESTIVAL } from '../../src/i18n/exploreUi.js';

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
    eventStartDate: '20261009',
    eventEndDate: '20261013',
    addr1: '강원특별자치도 강릉시',
    titleEn: 'Gangneung Coffee Festival',
  },
  {
    contentId: '555',
    title: '서울 빛초롱축제',
    eventStartDate: '20261101',
    eventEndDate: '20261103',
    addr1: '서울특별시 중구',
  },
];

test('buildExploreFestivalSuggestionsFromPool matches title and addr like /korea search', () => {
  const cases = [
    { query: '진주 유등', contentId: '111' },
    { query: '마산 국화', contentId: '222' },
    { query: '산천어', contentId: '333' },
    { query: '강릉', contentId: '444' },
  ];
  for (const { query, contentId } of cases) {
    const hits = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, query);
    assert.equal(hits.length >= 1, true, query);
    assert.equal(hits[0].festivalContentId, contentId, query);
    assert.equal(hits[0].kind, 'festival');
    assert.equal(hits[0].badge, EXPLORE_BADGE_FESTIVAL);
    assert.match(hits[0].exploreHref, new RegExp(`festival=${contentId}`));
    assert.match(hits[0].desc || '', /\d/, `${query} meta includes dates`);
  }
});

test('festivalItemToExploreSuggestion localizes EN title lines', () => {
  const item = FIXTURE_POOL.find((row) => row.contentId === '444');
  const en = festivalItemToExploreSuggestion(item, 'en');
  assert.equal(en.name, 'Gangneung Coffee Festival');
  assert.equal(en.name_en, '강릉커피축제');
});

test('prependExploreFestivalSuggestions keeps festivals before local hits', () => {
  const festivals = buildExploreFestivalSuggestionsFromPool(FIXTURE_POOL, '강릉');
  const local = buildLocalSearchSuggestions('강릉');
  const merged = prependExploreFestivalSuggestions(festivals, local);
  assert.equal(merged[0]?.kind, 'festival');
  assert.equal(merged[0]?.festivalContentId, '444');
});

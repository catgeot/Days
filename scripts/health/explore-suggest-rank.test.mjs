import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  VITE_GATEO_SITE_SEARCH: '1',
  VITE_GATEO_EXPLORE_SEARCH_SUBMIT_PARITY: '1',
  VITE_GATEO_EXPLORE_CHOSEONG: '1',
};

const { buildLocalSearchSuggestions } = await import('../../src/pages/Home/lib/searchSuggestions.js');
const {
  exploreSuggestionNameMatchRank,
  mergeHubAliasSuggestions,
  normalizeSearchSuggestions,
} = await import('../../src/pages/Home/lib/normalizeSearchSuggestions.js');
const {
  appendExploreFestivalBelowPlaceBlock,
  applyExploreFestivalMergeStrategy,
  buildExploreFestivalSuggestionsFromPool,
} = await import('../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js');
const { hubToSuggestion, resolveCityAttractionHub } = await import(
  '../../src/pages/Home/lib/cityAttractionHubs.js'
);
const { resetExploreChoseongIndexForTests } = await import(
  '../../src/pages/Home/lib/exploreChoseongMatch.js'
);

resetExploreChoseongIndexForTests();

const NOW = new Date('2026-11-15T12:00:00+09:00');

const FESTIVAL_POOL = [
  {
    contentId: 'jeju-ended',
    title: '제주 반려동물 문화산업 한마당',
    eventStartDate: '20261101',
    eventEndDate: '20261108',
    addr1: '제주특별자치도 제주시',
  },
  {
    contentId: 'jeju-active',
    title: '제주 겨울빛 축제',
    eventStartDate: '20261201',
    eventEndDate: '20261231',
    addr1: '제주특별자치도 제주시',
  },
  {
    contentId: 'seoul-1',
    title: '서울 왕궁수문장 교대의식',
    eventStartDate: '20260101',
    eventEndDate: '20261231',
    addr1: '서울특별시 종로구',
  },
  {
    contentId: 'seoul-2',
    title: '2026 서울거리공연 구석구석라이브',
    eventStartDate: '20260501',
    eventEndDate: '20261231',
    addr1: '서울특별시',
  },
  {
    contentId: 'seoul-3',
    title: '2026 쉬엄쉬엄모닝',
    eventStartDate: '20261018',
    eventEndDate: '20261122',
    addr1: '서울특별시 강동구',
  },
  {
    contentId: 'seoul-4',
    title: '서울빛초롱축제',
    eventStartDate: '20261211',
    eventEndDate: '20270131',
    addr1: '서울특별시 중구',
  },
  {
    contentId: 'geumnam',
    title: '2026 금남로 차 없는 거리',
    eventStartDate: '20260404',
    eventEndDate: '20261107',
    addr1: '광주광역시 동구',
  },
  {
    contentId: 'busan-1',
    title: '부산국제매직페스티벌',
    eventStartDate: '20260628',
    eventEndDate: '20261226',
    addr1: '부산광역시',
  },
];

function festivalsFor(query) {
  return buildExploreFestivalSuggestionsFromPool(FESTIVAL_POOL, query, { now: NOW });
}

function indexOfName(items, name) {
  return items.findIndex((row) => row?.name === name);
}

test('exact and prefix ranks beat choseong, and empty or null labels match nothing', () => {
  assert.equal(exploreSuggestionNameMatchRank('제주', { name: '제주', name_en: null }), 0);
  assert.equal(exploreSuggestionNameMatchRank('제주', { name: '제주시', name_en: 'Jeju City' }), 1);
  assert.equal(exploreSuggestionNameMatchRank('ㅈㅈ', { name: '제주', name_en: null }), 2);
  assert.equal(exploreSuggestionNameMatchRank('ㅈㅈ', { name: '제주시', name_en: '' }), 3);
  assert.equal(exploreSuggestionNameMatchRank('Seoul', { name: '서울', name_en: 'Seoul' }), 0);
  assert.equal(exploreSuggestionNameMatchRank('', { name: '서울', name_en: null }), 9);
  assert.equal(exploreSuggestionNameMatchRank('   ', { name: '서울', name_en: '' }), 9);
  assert.doesNotThrow(() => exploreSuggestionNameMatchRank('서울', { name: '서울', name_en: null }));
  assert.doesNotThrow(() => exploreSuggestionNameMatchRank('서울', { name_en: null }));
});

test('merge keeps 제주 when the hub label is the longer 제주시', () => {
  const hub = resolveCityAttractionHub('제주');
  assert.equal(hub?.name, '제주시');
  const merged = mergeHubAliasSuggestions([
    {
      id: 'spot-jeju',
      kind: 'spot',
      badge: '여행지',
      name: '제주',
      name_en: 'Jeju',
      slug: 'jeju',
      hubId: 'jeju',
    },
    hubToSuggestion(hub),
  ]);
  assert.equal(merged.some((row) => row.id === 'spot-jeju'), true);
  assert.equal(merged.some((row) => row.id === 'hub-jeju'), true);
});

test('ㅈㅈ and 제주 keep the Jeju destination first and put the ended festival below it', async () => {
  for (const query of ['ㅈㅈ', '제주']) {
    const local = buildLocalSearchSuggestions(query);
    const festivals = festivalsFor(query);
    assert.ok(festivals.some((row) => row.festivalEnded));
    assert.ok(festivals.some((row) => row.kind === 'festival' && !row.festivalEnded));
    const { items, late } = await applyExploreFestivalMergeStrategy(query, local, {
      startedAt: Date.now(),
      festPromise: Promise.resolve(festivals),
    });
    assert.equal(late, null);
    const normalized = normalizeSearchSuggestions(query, items);
    const destAt = normalized.findIndex((row) => row.name === '제주' && row.badge === '여행지');
    const endedAt = normalized.findIndex((row) => row.festivalContentId === 'jeju-ended');
    const activeAt = normalized.findIndex((row) => row.festivalContentId === 'jeju-active');
    assert.equal(destAt, 0, query);
    assert.ok(activeAt > destAt, query);
    assert.ok(endedAt > destAt, query);
    assert.ok(endedAt > activeAt, query);
  }
});

test('warm festival results stay below 서울, 강남, and 부산', async () => {
  const cases = [
    {
      query: 'ㅅㅇ',
      topName: '서울',
      festId: 'seoul-1',
    },
    {
      query: 'ㄱㄴ',
      topName: '강남',
      festId: 'geumnam',
    },
    {
      query: 'ㅂㅅ',
      topName: '부산',
      festId: 'busan-1',
    },
  ];
  for (const { query, topName, festId } of cases) {
    const local = buildLocalSearchSuggestions(query);
    assert.equal(local[0]?.name, topName, query);
    const festivals = festivalsFor(query);
    assert.ok(festivals.some((row) => row.festivalContentId === festId), query);
    const merged = appendExploreFestivalBelowPlaceBlock(festivals, local);
    const { items } = await applyExploreFestivalMergeStrategy(query, local, {
      startedAt: Date.now(),
      festPromise: Promise.resolve(festivals),
    });
    const normalized = normalizeSearchSuggestions(query, items);
    assert.equal(normalized[0]?.name, topName, query);
    const topAt = indexOfName(normalized, topName);
    const festAt = normalized.findIndex((row) => row.festivalContentId === festId);
    assert.ok(festAt > topAt, query);
    assert.equal(merged[0]?.name, topName, query);
    if (query === 'ㄱㄴ') {
      const gangnam = indexOfName(normalized, '강남');
      const geumnam = normalized.findIndex((row) => String(row.name || '').includes('금남로'));
      assert.ok(gangnam >= 0 && geumnam > gangnam);
    }
  }
});

test('completed 서울 and English Seoul keep the hub city and the same attraction order', () => {
  const ko = normalizeSearchSuggestions('서울', buildLocalSearchSuggestions('서울'));
  const en = normalizeSearchSuggestions('Seoul', buildLocalSearchSuggestions('Seoul'));
  assert.equal(ko[0]?.id, 'hub-seoul');
  assert.equal(en[0]?.id, 'hub-seoul');
  assert.equal(ko.some((row) => row.id === 'spot-seoul'), false);
  assert.deepEqual(
    ko.slice(0, 5).map((row) => row.id),
    en.slice(0, 5).map((row) => row.id),
  );
  assert.deepEqual(ko.slice(0, 5).map((row) => row.name), [
    '서울',
    '경복궁',
    '남산서울타워',
    '북촌한옥마을',
    '인사동',
  ]);
});

test('vienna alias merge still collapses the destination into the hub card', () => {
  const hub = resolveCityAttractionHub('vienna');
  const merged = mergeHubAliasSuggestions([
    {
      id: 'spot-vienna',
      kind: 'spot',
      badge: '여행지',
      name: '빈',
      slug: 'vienna',
      hubId: 'vienna',
    },
    hubToSuggestion(hub),
  ]);
  assert.equal(merged.some((row) => row.id === 'spot-vienna'), false);
  assert.equal(merged.find((row) => row.id === 'hub-vienna')?.searchOverlayDesc, '빈');
});

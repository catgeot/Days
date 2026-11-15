import assert from 'node:assert/strict';
import test from 'node:test';

import { collectKoreaTourTitleSearchCandidates } from '../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { resolveExploreSearchAlias } from '../../src/pages/Home/lib/exploreSearchAliases.js';
import { tourRowTitleMatchesCompactQuery } from '../../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
import { buildHybridSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';

const UNESCO = {
  contentId: '125565',
  title: '강화 고인돌 유적 [유네스코 세계유산]',
  name: '강화 고인돌 유적 [유네스코 세계유산]',
  addr1: '인천광역시 강화군 하점면 강화대로 994-12',
  lat: 37.7740846284,
  lng: 126.4367939868,
};

const OSANG = {
  contentId: '2765210',
  title: '강화 오상리 고인돌군',
  name: '강화 오상리 고인돌군',
  addr1: '인천광역시 강화군 내가면',
  lat: 37.7309554253,
  lng: 126.4022107557,
};

const GOCHANG = {
  contentId: '126000',
  title: '고창 고인돌 유적 [유네스코 세계유산]',
  name: '고창 고인돌 유적 [유네스코 세계유산]',
  addr1: '전라북도 고창군',
  lat: 35.43,
  lng: 126.7,
};

const RESTAURANT = {
  contentId: '999001',
  title: '고인돌식당',
  name: '고인돌식당',
  addr1: '광주광역시 광산구',
  lat: 35.14,
  lng: 126.79,
};

const GEOCHANG = {
  contentId: '888001',
  title: '거창 지석묘',
  name: '거창 지석묘',
  addr1: '경상남도 거창군',
  lat: 35.68,
  lng: 127.9,
};

test('tourRowTitleMatchesCompactQuery — 고인돌 공식 접미사만', () => {
  assert.equal(tourRowTitleMatchesCompactQuery(UNESCO, '고인돌'), true);
  assert.equal(tourRowTitleMatchesCompactQuery(OSANG, '고인돌'), true);
  assert.equal(
    tourRowTitleMatchesCompactQuery(
      { title: '화순 고인돌군 유적 [유네스코 세계유산]' },
      '고인돌',
    ),
    true,
  );
  assert.equal(tourRowTitleMatchesCompactQuery(UNESCO, '강화 고인돌'), true);
  assert.equal(tourRowTitleMatchesCompactQuery(OSANG, '강화 고인돌'), true);
  assert.equal(tourRowTitleMatchesCompactQuery(GOCHANG, '강화 고인돌'), false);
  assert.equal(tourRowTitleMatchesCompactQuery(RESTAURANT, '고인돌'), false);
  assert.equal(tourRowTitleMatchesCompactQuery({ title: '서울군' }, '서울'), false);
  assert.equal(tourRowTitleMatchesCompactQuery({ title: '로마 유적' }, '로마'), false);
  assert.equal(tourRowTitleMatchesCompactQuery({ title: '갯벌 유적' }, '갯벌'), false);
  assert.equal(tourRowTitleMatchesCompactQuery({ title: '조선왕릉군' }, '조선왕릉'), false);
  assert.equal(tourRowTitleMatchesCompactQuery({ title: '고산사(홍성)' }, '고산사(장흥)'), false);
});

test('강화 고인돌 — 125565가 오상리보다 앞, 타 지역·식당 제목은 제외', async () => {
  const asked = [];
  const rows = await collectKoreaTourTitleSearchCandidates('강화 고인돌', {
    lookupRows: async (title) => {
      asked.push(title);
      return [OSANG, GOCHANG, RESTAURANT, UNESCO];
    },
    lookupByContentId: async () => {
      throw new Error('강화 고인돌은 contentId 별칭으로 붙이지 않는다');
    },
  });
  assert.deepEqual(asked, ['고인돌']);
  const ids = rows.map((row) => row.contentId);
  assert.ok(ids.indexOf('125565') >= 0);
  assert.ok(ids.indexOf('125565') < ids.indexOf('2765210'));
  assert.equal(ids.includes('126000'), false);
  assert.equal(ids.includes('999001'), false);
  assert.equal(resolveExploreSearchAlias('강화 고인돌'), null);
  assert.equal(
    resolveSearchResultSelect({ ...rows[0], originalQuery: '강화 고인돌' })?.param,
    'tour-125565',
  );
  const osang = rows.find((row) => row.contentId === '2765210');
  assert.equal(
    resolveSearchResultSelect({ ...osang, originalQuery: '강화 고인돌' })?.param,
    'tour-2765210',
  );
});

test('고인돌 — 카탈로그에 없어도 125565 카드', async () => {
  const items = await buildHybridSearchSuggestions('고인돌', {
    includeMapbox: false,
    restaurantLookupItems: async () => [],
    tourTitleLookupRows: async () => [OSANG, GOCHANG, RESTAURANT, UNESCO],
    tourTitleLookupByContentId: async () => null,
  });
  const card = items.find((item) => item.contentId === '125565');
  assert.ok(card);
  assert.equal(resolveSearchResultSelect({ ...card, originalQuery: '고인돌' })?.param, 'tour-125565');
  assert.equal(items.some((item) => item.contentId === '999001'), false);
});

test('부근리·지석묘 별칭 — 제목 검색 없이 125565', async () => {
  for (const query of ['부근리 고인돌', '부근리 지석묘', '강화 지석묘', '강화지석묘']) {
    const asked = [];
    const fetched = [];
    const items = await buildHybridSearchSuggestions(query, {
      includeMapbox: false,
      restaurantLookupItems: async () => [],
      tourTitleLookupRows: async (title) => {
        asked.push(title);
        return query.includes('지석묘') || query.endsWith('지석묘') ? [GEOCHANG] : [OSANG, GOCHANG];
      },
      tourTitleLookupByContentId: async (id) => {
        fetched.push(id);
        return id === '125565' ? UNESCO : null;
      },
    });
    const ids = items.map((item) => item.contentId).filter(Boolean);
    assert.equal(ids[0], '125565', query);
    assert.equal(ids.includes('2765210'), false, query);
    assert.equal(ids.includes('126000'), false, query);
    assert.equal(ids.includes('888001'), false, query);
    assert.deepEqual(fetched, ['125565'], query);
    if (query.startsWith('부근리') || query === '강화지석묘') {
      assert.deepEqual(asked, [], query);
    }
    const card = items.find((item) => item.contentId === '125565');
    assert.equal(resolveSearchResultSelect(card)?.param, 'tour-125565', query);
  }
});

test('공백 별칭이 아닌 질의는 제목 검색을 넓히지 않는다', async () => {
  for (const query of ['서오릉', '우금치', '로마 포럼']) {
    let called = false;
    const rows = await collectKoreaTourTitleSearchCandidates(query, {
      lookupRows: async () => {
        called = true;
        return [UNESCO];
      },
      lookupByContentId: async () => UNESCO,
    });
    assert.equal(called, false, query);
    assert.deepEqual(rows, [], query);
  }
});

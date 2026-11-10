#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { collectExploreRestaurantKeywordMatches } from '../../src/pages/Home/lib/exploreRestaurantSearchCandidates.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';

const GETBOL_FIXTURE_ITEMS = [
  {
    title: '갯벌의조개 성수역점',
    contentId: '2599001',
    contentTypeId: '39',
    cat1: 'A05',
    cat3: 'A05020100',
    addr1: '서울특별시 성동구',
    mapy: 37.544,
    mapx: 127.055,
  },
  {
    title: '갯벌의진주',
    contentId: '2599002',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.982,
  },
  {
    title: '무교동원조낙지전문점 갯벌',
    contentId: '2599003',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.98,
  },
  {
    title: '갯벌낙지수제비',
    contentId: '2599004',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 강남구',
    mapy: 37.5,
    mapx: 127.03,
  },
  {
    title: '순천만습지',
    contentId: '126730',
    contentTypeId: '12',
    cat1: 'A02',
    addr1: '전라남도 순천시',
    mapy: 34.88,
    mapx: 127.49,
  },
];

test('collectExploreRestaurantKeywordMatches — 갯벌 mock TourAPI', async () => {
  const rows = await collectExploreRestaurantKeywordMatches('갯벌', {
    lookupItems: async () => GETBOL_FIXTURE_ITEMS,
  });
  const names = rows.map((r) => r.name);
  assert.equal(rows.length, 4);
  for (const expected of [
    '갯벌의조개 성수역점',
    '갯벌의진주',
    '무교동원조낙지전문점 갯벌',
    '갯벌낙지수제비',
  ]) {
    assert.ok(names.includes(expected), `missing ${expected}`);
  }
  for (const row of rows) {
    assert.equal(row.badge, '식당');
    assert.equal(row.kind, 'restaurant');
    const decision = resolveSearchResultSelect(row);
    assert.equal(decision?.type, 'place', row.name);
    assert.match(decision?.param || '', /^tour-/);
  }
});

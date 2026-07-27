/**
 * S5-C 즐겨찾기·본 항목·검색 순수 로직 스모크 (DOM 없음).
 */
import assert from 'node:assert/strict';
import { detectSidoCode, sidoLabel } from '../src/pages/Korea/festivalRegionTags.js';

const FAVORITES_KEY = 'gateo:korea-festivals:v1:favorites';
const VIEWED_KEY = 'gateo:korea-festivals:v1:viewed';

/** @type {Map<string, string>} */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
};

const {
  toFestivalRef,
  loadFavorites,
  toggleFavorite,
  isFavorite,
  pushViewed,
  loadViewed,
  hydrateFestivalRefs,
  groupFestivalsBySido,
} = await import('../src/pages/Korea/festivalPersonalStore.js');
const { filterBySearchQuery, normalizeFestivalQuery } = await import(
  '../src/pages/Korea/festivalSearch.js'
);

const hwacheon = {
  contentId: '100',
  title: '화천 산천어축제',
  addr1: '강원특별자치도 화천군',
  eventStartDate: '20260101',
  eventEndDate: '20260131',
  mapx: '127.7',
  mapy: '38.1',
};
const seoul = {
  contentId: '200',
  title: '서울빛초롱축제',
  addr1: '서울특별시 종로구',
  eventStartDate: '20261101',
};

assert.equal(normalizeFestivalQuery('  산 천 어 '), '산천어');
assert.equal(filterBySearchQuery([hwacheon, seoul], '산천어').length, 1);
assert.equal(filterBySearchQuery([hwacheon, seoul], '서울').length, 1);
assert.equal(filterBySearchQuery([hwacheon, seoul], '').length, 2);

const ref = toFestivalRef(hwacheon);
assert.equal(ref.contentId, '100');
assert.ok(ref.areaCode);

const t1 = toggleFavorite(hwacheon);
assert.equal(t1.added, true);
assert.equal(isFavorite('100'), true);
assert.equal(loadFavorites().length, 1);
const t2 = toggleFavorite(hwacheon);
assert.equal(t2.added, false);
assert.equal(isFavorite('100'), false);

toggleFavorite(hwacheon);
toggleFavorite(seoul);
assert.equal(loadFavorites().length, 2);

const viewed = pushViewed(seoul);
assert.equal(viewed[0].contentId, '200');
pushViewed(hwacheon);
assert.equal(loadViewed()[0].contentId, '100');
assert.equal(loadViewed().length, 2);

const byId = new Map([
  ['100', { ...hwacheon, title: 'LIVE 산천어' }],
]);
const hyd = hydrateFestivalRefs(loadFavorites(), byId);
assert.ok(hyd.some((r) => r.title === 'LIVE 산천어'));

const groups = groupFestivalsBySido([hwacheon, seoul]);
assert.ok(groups.length >= 2);
assert.ok(groups.every((g) => g.label && g.items.length));
assert.equal(detectSidoCode(hwacheon.addr1), ref.areaCode);
assert.ok(sidoLabel(ref.areaCode));

assert.equal(mem.get(FAVORITES_KEY) != null, true);
assert.equal(mem.get(VIEWED_KEY) != null, true);

console.log('smoke-korea-festival-personal: PASS');

/**
 * 명승 즐겨찾기·본 항목 순수 로직 스모크 (DOM 없음).
 */
import assert from 'node:assert/strict';

const FAVORITES_KEY = 'gateo:korea-scenic:v1:favorites';
const VIEWED_KEY = 'gateo:korea-scenic:v1:viewed';

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
  toScenicRef,
  loadScenicFavorites,
  toggleScenicFavorite,
  isScenicFavorite,
  pushScenicViewed,
  loadScenicViewed,
  hydrateScenicRefs,
  groupScenicByRegion,
} = await import('../src/pages/KoreaTheme/scenicPersonalStore.js');

const gyeongbok = {
  id: 'gyeongbokgung',
  name: '경복궁',
  region: '수도권',
  hubId: 'seoul',
  contentId: '126508',
  blurb: '조선의 법궁',
  imageUrl: 'https://example.com/gb.jpg',
  lat: 37.58,
  lng: 127.0,
};
const heritage = {
  id: 'cha-1353201080000',
  name: '강릉 경포대와 경포호',
  region: '강원',
  source: 'cha',
  areaLabel: '강원',
  locality: '강릉시',
};
const tour = {
  id: '126508',
  name: '경복궁(Tour)',
  contentId: '126508',
  region: '수도권',
  source: 'db',
};

const ref = toScenicRef(gyeongbok);
assert.equal(ref.id, 'gyeongbokgung');
assert.equal(ref.contentId, '126508');
assert.ok(ref.imageUrl);

assert.equal(toScenicRef({ name: 'no-id' }), null);
assert.equal(toScenicRef({ id: 'x' }), null);

const t1 = toggleScenicFavorite(gyeongbok);
assert.equal(t1.added, true);
assert.equal(isScenicFavorite('gyeongbokgung'), true);
assert.equal(loadScenicFavorites().length, 1);

const t2 = toggleScenicFavorite(gyeongbok);
assert.equal(t2.added, false);
assert.equal(isScenicFavorite('gyeongbokgung'), false);

toggleScenicFavorite(gyeongbok);
toggleScenicFavorite(heritage);
assert.equal(loadScenicFavorites().length, 2);
assert.equal(isScenicFavorite('cha-1353201080000'), true);

// curated slug ≠ tour contentId — 서로 다른 즐겨찾기 키
toggleScenicFavorite(tour);
assert.equal(loadScenicFavorites().length, 3);
assert.equal(isScenicFavorite('126508'), true);

const viewed = pushScenicViewed(heritage);
assert.equal(viewed[0].id, 'cha-1353201080000');
pushScenicViewed(gyeongbok);
assert.equal(loadScenicViewed()[0].id, 'gyeongbokgung');
assert.equal(loadScenicViewed().length, 2);

const byId = new Map([
  ['gyeongbokgung', { ...gyeongbok, name: 'LIVE 경복궁' }],
]);
const hyd = hydrateScenicRefs(loadScenicFavorites(), byId);
assert.ok(hyd.some((r) => r.name === 'LIVE 경복궁'));

const groups = groupScenicByRegion([gyeongbok, heritage, tour]);
assert.ok(groups.length >= 2);
assert.ok(groups.every((g) => g.label && g.items.length));
assert.ok(groups.some((g) => g.label === '강원' && g.items.length === 1));

assert.ok(mem.has(FAVORITES_KEY));
assert.ok(mem.has(VIEWED_KEY));

console.log('smoke-korea-scenic-personal: PASS');

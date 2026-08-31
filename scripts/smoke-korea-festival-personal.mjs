/**
 * S5-C 즐겨찾기·본 항목·검색 순수 로직 스모크 (DOM 없음).
 */
import assert from 'node:assert/strict';
import {
  buildCityTags,
  buildMapFocusRegionChips,
  buildSidoTags,
  detectSidoCode,
  extractSubregionLabels,
  sidoLabel,
} from '../src/pages/Korea/festivalRegionTags.js';
import { nearbyHubsForFestival } from '../src/pages/Korea/nearbyFestivalHubs.js';
import { DEFAULT_AREA_CODE } from '../src/pages/Korea/koreaFestivalDefaults.js';

assert.equal(DEFAULT_AREA_CODE, 'all');
assert.equal(sidoLabel(DEFAULT_AREA_CODE), '');
assert.equal(sidoLabel('32'), '강원');

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
  groupFestivalsByCity,
  groupFestivalsForList,
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

const gangneung = {
  contentId: '101',
  title: '강릉단오제',
  addr1: '강원특별자치도 강릉시',
};
const chuncheon = {
  contentId: '102',
  title: '춘천마임축제',
  addr1: '강원특별자치도 춘천시',
};
const cityGroups = groupFestivalsByCity([hwacheon, gangneung, chuncheon]);
assert.equal(cityGroups.length, 3);
assert.ok(cityGroups.some((g) => g.label === '화천군' && g.items.length === 1));
assert.ok(cityGroups.some((g) => g.label === '강릉시'));
assert.ok(cityGroups.some((g) => g.label === '춘천시'));

const gangwonList = groupFestivalsForList(
  [hwacheon, gangneung, chuncheon],
  { areaCode: '32' },
);
assert.ok(gangwonList.length >= 3);
assert.ok(gangwonList.every((g) => g.id !== '32'));
assert.equal(
  groupFestivalsForList([hwacheon, gangneung], { areaCode: 'all' }).length,
  2,
);

const gyeonggi = {
  contentId: '300',
  title: '수원화성문화제',
  addr1: '경기도 수원시',
};
const goyang = {
  contentId: '301',
  title: '고양호수예술축제',
  addr1: '경기도 고양시',
};
const siheung = {
  contentId: '302',
  title: '시흥갯골축제',
  addr1: '경기도 시흥시',
};
const cityChips = buildCityTags([gyeonggi, goyang, siheung], {
  areaCode: '31',
});
assert.ok(cityChips.some((c) => c.label === '수원시'));
assert.ok(cityChips.some((c) => c.label === '고양시' && c.count === 1));
assert.ok(cityChips.some((c) => c.label === '시흥시'));
assert.equal(cityChips.length, 3);

const jongno = {
  contentId: '201',
  title: '종로축제',
  addr1: '서울특별시 종로구',
};
const gangnam = {
  contentId: '202',
  title: '강남축제',
  addr1: '서울특별시 강남구',
};
assert.deepEqual(extractSubregionLabels(jongno.addr1, '1'), ['종로구']);
assert.equal(extractSubregionLabels(gyeonggi.addr1, '31')[0], '수원시');
const seoulCityChips = buildCityTags([seoul, jongno, gangnam], {
  areaCode: '1',
});
assert.ok(seoulCityChips.some((c) => c.label === '종로구'));
assert.ok(seoulCityChips.some((c) => c.label === '강남구'));
const seoulGroups = groupFestivalsByCity([jongno, gangnam, seoul], {
  areaCode: '1',
});
assert.ok(seoulGroups.some((g) => g.label === '종로구'));
assert.ok(seoulGroups.some((g) => g.label === '강남구'));

const focusChips = buildMapFocusRegionChips(
  [seoul, gyeonggi],
  buildSidoTags([seoul, gyeonggi, hwacheon], { minCount: 1 }),
);
assert.ok(focusChips.some((c) => c.label.includes('서울') || c.id === '1'));
assert.ok(focusChips.some((c) => c.label.includes('경기') || c.id === '31'));
assert.ok(focusChips.length >= 2);

const hubs = [
  { hubId: 'seoul', name: '서울', lat: 37.57, lng: 126.98 },
  { hubId: 'suwon', name: '수원', lat: 37.26, lng: 127.03 },
  { hubId: 'busan', name: '부산', lat: 35.18, lng: 129.08 },
  { hubId: 'jeju', name: '제주', lat: 33.5, lng: 126.53 },
  { hubId: 'chuncheon', name: '춘천', lat: 37.88, lng: 127.73 },
];
const nearHwacheon = nearbyHubsForFestival(
  { ...hwacheon, mapx: '127.7', mapy: '38.1' },
  hubs,
);
assert.ok(nearHwacheon.length >= 1);
assert.ok(nearHwacheon.every((h) => h.hubId !== 'jeju' && h.hubId !== 'busan'));
assert.equal(nearbyHubsForFestival({ title: '좌표없음' }, hubs).length, 0);
assert.ok(
  nearbyHubsForFestival({ addr1: '제주특별자치도 제주시' }, hubs).some(
    (h) => h.hubId === 'jeju',
  ),
);

const gangwonHubs = [
  { hubId: 'pyeongchang', name: '평창', lat: 37.3705, lng: 128.3901 },
  { hubId: 'hoengseong', name: '횡성', lat: 37.4917, lng: 128.0019 },
  { hubId: 'wonju', name: '원주', lat: 37.342, lng: 127.92 },
];
const hoengseongFest = {
  title: '횡성한우축제',
  addr1: '강원특별자치도 횡성군 횡성읍',
  mapx: '128.3901',
  mapy: '37.3705',
  areaCode: '32',
};
const nearHoengseong = nearbyHubsForFestival(hoengseongFest, gangwonHubs, { limit: 3 });
assert.equal(nearHoengseong[0]?.hubId, 'hoengseong', 'addr 횡성군 → hoengseong hub 우선');

assert.equal(mem.get(FAVORITES_KEY) != null, true);
assert.equal(mem.get(VIEWED_KEY) != null, true);

const {
  buildFestivalTimeTabs,
  compareFestivalsByOpenDate,
  currentSeasonIndex,
  filterByTimeTab,
  seasonRangeById,
  sortFestivalGroupsByOpenDate,
} = await import('../src/pages/Korea/festivalTimeFilter.js');
const july = new Date(2026, 6, 29);
assert.equal(currentSeasonIndex(july), 1);
assert.deepEqual(
  buildFestivalTimeTabs(july).map((t) => t.label),
  ['지금', '이번 주말', '이번 달', '여름', '가을', '겨울', '봄'],
);
const summerRange = seasonRangeById('summer', july);
assert.equal(summerRange.eventStartDate, '20260601');
assert.equal(summerRange.eventEndDate, '20260831');
const winterRange = seasonRangeById('winter', july);
assert.equal(winterRange.eventStartDate, '20261201');
assert.equal(winterRange.eventEndDate, '20270228');
const seasonItems = [
  { title: '여름', eventStartDate: '20260710', eventEndDate: '20260712' },
  { title: '겨울', eventStartDate: '20270110', eventEndDate: '20270120' },
];
assert.equal(filterByTimeTab('summer', seasonItems, july).length, 1);
assert.equal(filterByTimeTab('winter', seasonItems, july)[0].title, '겨울');

const aug31 = new Date(2026, 7, 31);
const soonOpening = {
  contentId: '301',
  title: '개막임박축제',
  eventStartDate: '20260905',
};
const laterOpening = {
  contentId: '302',
  title: '다음달축제',
  eventStartDate: '20261010',
};
const ongoing = {
  contentId: '303',
  title: '진행중축제',
  eventStartDate: '20260801',
  eventEndDate: '20260930',
};
assert.ok(
  compareFestivalsByOpenDate(soonOpening, ongoing, aug31) < 0,
  'upcoming before ongoing',
);
assert.ok(
  compareFestivalsByOpenDate(soonOpening, laterOpening, aug31) < 0,
  'earlier upcoming first',
);
const openGroups = sortFestivalGroupsByOpenDate(
  [
    { id: 'b', label: '부산', items: [laterOpening] },
    { id: 'a', label: '강원', items: [soonOpening] },
  ],
  aug31,
);
assert.equal(openGroups[0].id, 'a', 'group with sooner festival first');

console.log('smoke-korea-festival-personal: PASS');

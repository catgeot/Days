/**
 * 명승 홈 지도 GeoJSON·포커스·명소 드릴다운 순수 로직 스모크 (DOM/Mapbox 없음).
 */
import assert from 'node:assert/strict';

const {
  buildScenicMapGeoJson,
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
  SCENIC_MAP_CLUSTER_MAX_ZOOM,
  SCENIC_MAP_CLUSTER_MIN_POINTS,
  SCENIC_MAP_CLUSTER_RADIUS,
} = await import('../src/pages/KoreaTheme/koreaScenicMapData.js');

const {
  buildCuratedMapDrill,
  buildHeritageMapDrill,
  centroidOfScenicSpots,
  drillDownHeritageMap,
  drillDownScenicMap,
  drillUpHeritageMap,
  drillUpScenicMap,
  EMPTY_HERITAGE_MAP_DRILL,
  EMPTY_SCENIC_MAP_DRILL,
  focusViewForMapDrill,
  spreadNearbyMapChips,
} = await import('../src/pages/KoreaTheme/koreaScenicMapDrill.js');

const {
  buildTourMapDrill,
  drillDownTourMap,
  drillUpTourMap,
  EMPTY_TOUR_MAP_DRILL,
  fanOutMapAnchor,
} = await import('../src/pages/KoreaTheme/koreaTourMapDrill.js');

const { listKoreaScenicSpots } = await import(
  '../src/pages/Home/lib/koreaScenicSpots.js'
);
const { listKoreaHeritageScenic } = await import(
  '../src/pages/Home/lib/koreaHeritageScenic.js'
);

const gyeongbok = {
  id: 'gyeongbokgung',
  name: '경복궁',
  lat: 37.5796,
  lng: 126.977,
};
const seorak = {
  id: 'seoraksan',
  name: '설악산국립공원 울산바위',
  lat: 38.1195,
  lng: 128.4656,
};
const noCoord = { id: 'no-coord', name: '좌표없음' };
const dup = { ...gyeongbok, name: '경복궁 중복' };

const geo = buildScenicMapGeoJson([gyeongbok, seorak, noCoord, dup]);
assert.equal(geo.type, 'FeatureCollection');
assert.equal(geo.features.length, 2);
assert.equal(geo.features[0].properties.spotId, 'gyeongbokgung');
assert.equal(geo.features[0].properties.titleShort, '경복궁');
assert.equal(geo.features[1].properties.spotId, 'seoraksan');
assert.ok(geo.features[1].properties.titleShort.includes('…'));
assert.deepEqual(geo.features[0].geometry.coordinates, [126.977, 37.5796]);

const one = focusViewFromScenicItems([gyeongbok]);
assert.ok(one);
assert.equal(one.lng, 126.977);
assert.equal(one.lat, 37.5796);
assert.equal(one.zoom, 10);

const many = focusViewFromScenicItems([gyeongbok, seorak]);
assert.ok(many);
assert.ok(Number.isFinite(many.west));
assert.ok(many.west < many.east);
assert.ok(many.south < many.north);
assert.ok(many.maxZoom <= 11.5);

const tightA = { id: 'a', name: 'a', lat: 37.5, lng: 127.0 };
const tightB = { id: 'b', name: 'b', lat: 37.505, lng: 127.01 };
const tight = focusViewFromScenicItems([tightA, tightB]);
assert.ok(tight);
assert.ok(tight.maxZoom <= 10.8, '좁은 스팬은 과도 줌인 완화');
assert.ok(tight.east - tight.west >= 0.08);

assert.equal(focusViewFromScenicItems([]), null);
assert.equal(focusViewFromScenicItems([noCoord]), null);

assert.ok(Number.isFinite(KOREA_SCENIC_MAP_OVERVIEW.lng));
assert.ok(Number.isFinite(KOREA_SCENIC_MAP_OVERVIEW.lat));

const catalog = listKoreaScenicSpots();
assert.ok(catalog.length > 100, '선정 명소 카탈로그');

const root = buildCuratedMapDrill(catalog, EMPTY_SCENIC_MAP_DRILL);
assert.equal(root.showSpotPins, false);
assert.ok(root.chips.length >= 5, '대분류(권역) 칩');
assert.ok(root.chips.every((c) => c.kind === 'region'));
assert.ok(root.chips.every((c) => Number.isFinite(c.lng) && Number.isFinite(c.lat)));
assert.equal(root.levelLabel, '대분류(권역)');
assert.equal(root.crumbs.length, 1);

const metroChip = root.chips.find((c) => c.label === '수도권' || c.region === '수도권');
assert.ok(metroChip, '수도권 대분류');
const afterRegion = drillDownScenicMap(EMPTY_SCENIC_MAP_DRILL, metroChip);
assert.equal(afterRegion.region, '수도권');
assert.equal(afterRegion.area, null);

const mid = buildCuratedMapDrill(catalog, afterRegion);
assert.equal(mid.showSpotPins, false);
assert.ok(mid.chips.length >= 2, '중분류(시도) 칩');
assert.ok(mid.chips.every((c) => c.kind === 'area' || c.kind === 'cluster'));
assert.ok(mid.crumbs.length >= 2);

const areaChip = mid.chips.find((c) => c.kind === 'area') || mid.chips[0];
const afterMid = drillDownScenicMap(afterRegion, areaChip);
const deep = buildCuratedMapDrill(catalog, afterMid);
assert.equal(deep.showSpotPins, false);
assert.ok(
  deep.chips.length >= 1,
  '세권 또는 소분류(여행지) 칩',
);
assert.ok(
  deep.chips.every(
    (c) => c.kind === 'cluster' || c.kind === 'hub',
  ),
);

let cursor = afterMid;
let guard = 0;
let leaf = deep;
while (!leaf.showSpotPins && leaf.chips.length && guard < 6) {
  cursor = drillDownScenicMap(cursor, leaf.chips[0]);
  leaf = buildCuratedMapDrill(catalog, cursor);
  guard += 1;
}
assert.equal(leaf.showSpotPins, true, 'hub까지 드릴 후 핀');
assert.ok(leaf.scopeSpots.length >= 1);
assert.equal(leaf.chips.length, 0);
assert.ok(
  leaf.crumbs.some((c) => String(c.id).startsWith('cluster:')) ||
    !cursor.cluster,
  '세권 선택 후 상태바에 세권(4권역) 크럼',
);

const gwChip = root.chips.find((c) => c.region === '강원');
assert.ok(gwChip, '강원 대분류');
let gwCursor = drillDownScenicMap(EMPTY_SCENIC_MAP_DRILL, gwChip);
let gwLeaf = buildCuratedMapDrill(catalog, gwCursor);
assert.ok(gwLeaf.chips.every((c) => c.kind === 'cluster'), '강원→세권 직행');
assert.deepEqual(
  gwLeaf.crumbs.map((c) => c.label),
  ['전체', '강원'],
);
const gwCluster = gwLeaf.chips[0];
gwCursor = drillDownScenicMap(gwCursor, gwCluster);
gwLeaf = buildCuratedMapDrill(catalog, gwCursor);
assert.ok(gwLeaf.chips.every((c) => c.kind === 'hub'));
assert.ok(
  gwLeaf.crumbs.some((c) => c.id === `cluster:${gwCluster.cluster}`),
  '강원 세권 크럼',
);
assert.equal(
  gwLeaf.crumbs.filter((c) => c.label === '강원').length,
  1,
  '강원 단일 시도는 상태바에 강원 중복 없음',
);
gwCursor = drillDownScenicMap(gwCursor, gwLeaf.chips[0]);
gwLeaf = buildCuratedMapDrill(catalog, gwCursor);
assert.equal(gwLeaf.showSpotPins, true);
assert.ok(
  gwLeaf.crumbs.some((c) => c.id === `cluster:${gwCluster.cluster}`),
  'hub·핀 단계에서도 세권 크럼 유지',
);
assert.equal(
  gwLeaf.crumbs.filter((c) => c.label === '강원').length,
  1,
  '핀 단계 강원 중복 없음',
);
const gwUp = drillUpScenicMap(gwCursor);
assert.equal(gwUp.hub, null);
assert.equal(gwUp.cluster, gwCluster.cluster);
const gwUp2 = drillUpScenicMap(gwUp);
assert.equal(gwUp2.cluster, null);
assert.equal(gwUp2.area, null, '강원 세권 상위는 권역(area 클리어)');

const upFromLeaf = drillUpScenicMap(cursor);
assert.equal(upFromLeaf.hub, null);
const upRoot = drillUpScenicMap(
  drillUpScenicMap(drillUpScenicMap(drillUpScenicMap(cursor))),
);
assert.equal(upRoot.region, null);

const center = centroidOfScenicSpots([gyeongbok, seorak]);
assert.ok(center);
assert.ok(center.lat > 37 && center.lat < 39);

const focusChips = focusViewForMapDrill(root.chips, []);
assert.ok(focusChips);
assert.ok(
  Number.isFinite(focusChips.west) || Number.isFinite(focusChips.lng),
);

const heritageCatalog = listKoreaHeritageScenic();
assert.ok(heritageCatalog.length > 50, '국가유산 명승 카탈로그');
const hRoot = buildHeritageMapDrill(heritageCatalog, EMPTY_HERITAGE_MAP_DRILL);
assert.equal(hRoot.showSpotPins, false);
assert.ok(hRoot.chips.length >= 5, '명승 대분류(권역)');
assert.ok(hRoot.chips.every((c) => c.kind === 'region'));
const hRegionChip =
  hRoot.chips.find((c) => c.region === '전라') || hRoot.chips[0];
const hAfterRegion = drillDownHeritageMap(EMPTY_HERITAGE_MAP_DRILL, hRegionChip);
const hMid = buildHeritageMapDrill(heritageCatalog, hAfterRegion);
assert.equal(hMid.showSpotPins, false);
assert.ok(hMid.chips.length >= 1, '명승 중·소분류 칩');
assert.ok(
  hMid.chips.every((c) => c.kind === 'area' || c.kind === 'category'),
);
let hCursor = hAfterRegion;
let hLeaf = hMid;
let hGuard = 0;
while (!hLeaf.showSpotPins && hLeaf.chips.length && hGuard < 6) {
  hCursor = drillDownHeritageMap(hCursor, hLeaf.chips[0]);
  hLeaf = buildHeritageMapDrill(heritageCatalog, hCursor);
  hGuard += 1;
}
assert.equal(hLeaf.showSpotPins, true, '명승 경관까지 드릴 후 핀');
assert.ok(hLeaf.scopeSpots.length >= 1);
assert.equal(drillUpHeritageMap(hCursor).category, null);

const tLoading = buildTourMapDrill(EMPTY_TOUR_MAP_DRILL, {}, { countsReady: false });
assert.equal(tLoading.showSpotPins, false);
assert.equal(tLoading.chips.length, 0);

const mockCounts = {
  regionCounts: {
    수도권: 100,
    강원: 80,
    충청: 70,
    전라: 90,
    경상: 110,
    제주: 40,
  },
  areaCounts: { 1: 40, 2: 20, 31: 40 },
  cat1Counts: { A01: 30, A02: 70 },
  cat2Counts: { A0101: 20, A0102: 10 },
  cat3Counts: { A01010100: 5, A01010400: 8 },
};
const tRoot = buildTourMapDrill(EMPTY_TOUR_MAP_DRILL, mockCounts, {
  countsReady: true,
});
assert.equal(tRoot.showSpotPins, false);
assert.ok(tRoot.chips.length >= 5, '관광지 대분류(권역)');
const tMetro =
  tRoot.chips.find((c) => c.region === '수도권') || tRoot.chips[0];
const tAfterRegion = drillDownTourMap(EMPTY_TOUR_MAP_DRILL, tMetro);
const tMid = buildTourMapDrill(tAfterRegion, mockCounts, { countsReady: true });
assert.equal(tMid.showSpotPins, false);
assert.ok(tMid.chips.every((c) => c.kind === 'area' || c.kind === 'cat1'));
const tAreaOrCat = tMid.chips[0];
let tCursor = drillDownTourMap(tAfterRegion, tAreaOrCat);
let tLeaf = buildTourMapDrill(tCursor, mockCounts, { countsReady: true });
let tGuard = 0;
while (!tLeaf.showSpotPins && tLeaf.chips.length && tGuard < 8) {
  tCursor = drillDownTourMap(tCursor, tLeaf.chips[0]);
  tLeaf = buildTourMapDrill(tCursor, mockCounts, { countsReady: true });
  tGuard += 1;
}
assert.equal(tLeaf.showSpotPins, true, '관광지 종목까지 드릴 후 핀');
assert.ok(tLeaf.fetchFilters);
assert.equal(drillUpTourMap(tCursor).cat3, null);

const fan = fanOutMapAnchor({ lng: 127, lat: 37 }, 0, 4, 0.2);
assert.ok(Number.isFinite(fan.lng) && Number.isFinite(fan.lat));

assert.ok(SCENIC_MAP_CLUSTER_MIN_POINTS > 10);
assert.ok(SCENIC_MAP_CLUSTER_RADIUS < 52);
assert.ok(SCENIC_MAP_CLUSTER_MAX_ZOOM <= 10);

const piled = [
  { id: 'p1', label: 'A', count: 3, lng: 127.0, lat: 37.5 },
  { id: 'p2', label: 'B', count: 5, lng: 127.01, lat: 37.502 },
  { id: 'p3', label: 'C', count: 2, lng: 127.005, lat: 37.498 },
];
const spread = spreadNearbyMapChips(piled);
assert.equal(spread.length, 3);
const dist = (a, b) =>
  Math.hypot(a.lng - b.lng, a.lat - b.lat);
assert.ok(
  dist(spread[0], spread[1]) > dist(piled[0], piled[1]),
  '근접 칩은 펼쳐져야 함',
);
assert.ok(dist(spread[0], spread[2]) > 0.04);

console.log('smoke-korea-scenic-map: PASS');

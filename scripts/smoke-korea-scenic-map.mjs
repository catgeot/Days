/**
 * 명승 홈 지도 GeoJSON·포커스·명소 드릴다운 순수 로직 스모크 (DOM/Mapbox 없음).
 */
import assert from 'node:assert/strict';

const {
  buildScenicMapGeoJson,
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
} = await import('../src/pages/KoreaTheme/koreaScenicMapData.js');

const {
  buildCuratedMapDrill,
  centroidOfScenicSpots,
  drillDownScenicMap,
  drillUpScenicMap,
  EMPTY_SCENIC_MAP_DRILL,
  focusViewForMapDrill,
} = await import('../src/pages/KoreaTheme/koreaScenicMapDrill.js');

const { listKoreaScenicSpots } = await import(
  '../src/pages/Home/lib/koreaScenicSpots.js'
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
assert.equal(many.maxZoom, 11.5);

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

console.log('smoke-korea-scenic-map: PASS');

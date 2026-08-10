/**
 * 명승 홈 지도 GeoJSON·포커스 순수 로직 스모크 (DOM/Mapbox 없음).
 */
import assert from 'node:assert/strict';

const {
  buildScenicMapGeoJson,
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
} = await import('../src/pages/KoreaTheme/koreaScenicMapData.js');

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

console.log('smoke-korea-scenic-map: PASS');

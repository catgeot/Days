// 전체 검색 「추자도/Chujado」 — 다른 지역 동명 업소가 섞이지 않게
import assert from 'node:assert/strict';
import test from 'node:test';

const {
  alignVisitedSpotsToRegionAnchors,
  dropFarHomonymBusinessHits,
  isBusinessLikeSearchHit,
  tourKeywordItemsToRegionAnchors,
} = await import('../../src/pages/Home/lib/searchHomonymRegion.js');
const { featureToSuggestion } = await import('../../src/pages/Home/lib/mapboxSearchBox.js');
const { coordsInKorea, visitedRowToSearchSpot } = await import(
  '../../src/pages/Home/lib/visitedPlaceSearch.js'
);

function poi(name, placeFormatted, categoryIds, categories, lng, lat, id) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      mapbox_id: id,
      feature_type: 'poi',
      name,
      place_formatted: placeFormatted,
      poi_category_ids: categoryIds,
      poi_category: categories,
      context: { country: { name: 'South Korea' }, place: { name: placeFormatted.split(',')[0] } },
    },
  };
}

// Mapbox Search Box 「Chujado」(en, types=place,city,poi) 실응답 축약 — 2026-11-01
const CHUJADO_FEATURES = [
  poi('Chujado Lighthouse', 'Jeju, 63000, South Korea', ['tourist_attraction', 'viewpoint'], ['tourist attraction', 'viewpoint'], 126.29656905, 33.95534543, 'a'),
  poi('Jeju Olle Trail Route 18-1, Chuja-do', 'Jeju, 63000, South Korea', ['outdoors'], ['outdoors'], 126.29609105, 33.96352101, 'b'),
  poi('Chujado Island', 'Jeju, 63001, South Korea', ['tourist_attraction'], ['tourist attraction'], 126.31984797, 33.94843182, 'c'),
  poi('Chujado', 'Bucheon, 14697, South Korea', [], [], 126.8076013, 37.47699594, 'd'),
  poi('Chujado Observatory', 'Jeju, 63000, South Korea', ['tourist_attraction', 'viewpoint'], ['tourist attraction', 'viewpoint'], 126.29011517, 33.96400643, 'e'),
  poi('Chujado Restaurant', 'Jeju, 63000, South Korea', ['restaurant', 'food'], ['restaurant', 'food'], 126.29423483, 33.96245491, 'f'),
];

// TourAPI searchKeyword 「추자도」 실응답 축약
const TOUR_CHUJADO_ITEMS = [
  { contentId: '127863', title: '추자도', addr1: '제주특별자치도 제주시 추자면', mapx: '126.3076233112', mapy: '33.9518128033', contentTypeId: '12' },
  { contentId: '129146', title: '추자도 등대', addr1: '제주특별자치도 제주시 추자면 영흥리 77-3', mapx: '126.2967000000', mapy: '33.9553000000', contentTypeId: '12' },
];

// place_stats 「추자도」 행 — 좌표가 포항(동명 업소)으로 저장됨
const VISITED_CHUJADO_ROW = {
  place_id: '추자도',
  name_ko: '추자도',
  name_en: null,
  lat: 36.01184993,
  lng: 129.36822414,
  image_url: 'https://tong.visitkorea.or.kr/cms/resource/01/3539201_image2_1.jpg',
};

test('Chujado — 부천 무분류 상호 POI 제외, 제주 추자도 결과는 유지', () => {
  const hits = CHUJADO_FEATURES.map((f) => featureToSuggestion(f, { source: 'mapbox' }));
  const bucheon = hits.find((h) => h.name === 'Chujado');
  assert.equal(isBusinessLikeSearchHit(bucheon), true);

  const filtered = dropFarHomonymBusinessHits('Chujado', hits);
  const names = filtered.map((h) => h.name);
  assert.ok(!names.includes('Chujado'), `부천 Chujado가 남음: ${names.join(', ')}`);
  for (const keep of ['Chujado Lighthouse', 'Chujado Island', 'Chujado Observatory', 'Chujado Restaurant']) {
    assert.ok(names.includes(keep), `${keep} 누락`);
  }
  for (const item of filtered) {
    assert.ok(item.lat < 34.2 && item.lng < 126.6, `${item.name}가 추자도 밖 (${item.lat},${item.lng})`);
  }
});

test('기준점(관광 POI·도시)이 없으면 동명 업소도 그대로 둔다', () => {
  const onlyBusiness = [featureToSuggestion(CHUJADO_FEATURES[3], { source: 'mapbox' })];
  assert.deepEqual(dropFarHomonymBusinessHits('Chujado', onlyBusiness), onlyBusiness);
});

test('추자도 — 포항 좌표 방문 행은 TourAPI 공식 추자도(제주) 좌표로 정렬', () => {
  const spot = visitedRowToSearchSpot(VISITED_CHUJADO_ROW);
  assert.ok(spot);
  const anchors = tourKeywordItemsToRegionAnchors(TOUR_CHUJADO_ITEMS, '추자도');
  assert.equal(anchors.length, 1, '제목이 정확히 같은 「추자도」만 기준점');

  const [aligned] = alignVisitedSpotsToRegionAnchors([{ ...spot, parentCity: 'Pohang' }], anchors, {
    isDomestic: coordsInKorea,
  });
  assert.ok(Math.abs(aligned.lat - 33.9518) < 0.01 && Math.abs(aligned.lng - 126.3076) < 0.01);
  assert.equal(aligned.parentCity, undefined, '포항 라벨 제거');
  assert.equal(aligned.name, '추자도');
  assert.equal(aligned.slug, spot.slug);
});

test('가까운 방문 행·해외 동명·기준점 없음은 그대로', () => {
  const near = visitedRowToSearchSpot({ ...VISITED_CHUJADO_ROW, lat: 33.96, lng: 126.30 });
  const anchors = tourKeywordItemsToRegionAnchors(TOUR_CHUJADO_ITEMS, '추자도');
  assert.deepEqual(alignVisitedSpotsToRegionAnchors([near], anchors, { isDomestic: coordsInKorea }), [near]);

  const abroad = { name: '추자도', lat: 35.68, lng: 139.65, source: 'visited' };
  assert.deepEqual(alignVisitedSpotsToRegionAnchors([abroad], anchors, { isDomestic: coordsInKorea }), [abroad]);

  const far = visitedRowToSearchSpot(VISITED_CHUJADO_ROW);
  assert.deepEqual(alignVisitedSpotsToRegionAnchors([far], [], { isDomestic: coordsInKorea }), [far]);
});

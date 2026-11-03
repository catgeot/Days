import assert from 'node:assert/strict';
import test from 'node:test';

import {
  effectiveExploreSearchQuery,
  filterRegionalExploreHits,
  parseKoreaRegionalExploreQuery,
} from '../../src/pages/Home/lib/exploreRegionalPlaceQuery.js';
import { resolveExploreSearchAlias } from '../../src/pages/Home/lib/exploreSearchAliases.js';
import { pickUniqueTourAttractionRowForTitle } from '../../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
import { featureToSuggestion } from '../../src/pages/Home/lib/mapboxSearchBox.js';

test('parseKoreaRegionalExploreQuery — 제주 우도 → place 우도 + jeju anchor', () => {
  const regional = parseKoreaRegionalExploreQuery('제주 우도');
  assert.ok(regional);
  assert.equal(regional.placeQuery, '우도');
  assert.equal(regional.regionQuery, '제주');
  assert.equal(regional.hub?.hubId, 'jeju');
  assert.ok(Number.isFinite(regional.anchor.lat));
  assert.equal(effectiveExploreSearchQuery('제주 우도'), '우도');
});

test('parseKoreaRegionalExploreQuery — 홍성 고산사', () => {
  const regional = parseKoreaRegionalExploreQuery('홍성 고산사');
  assert.ok(regional);
  assert.equal(regional.placeQuery, '고산사');
  assert.equal(regional.hub?.hubId, 'hongseong');
});

test('filterRegionalExploreHits drops overseas Udomlya for 제주 우도 context', () => {
  const regional = parseKoreaRegionalExploreQuery('제주 우도');
  assert.ok(regional);
  const foreign = {
    name: 'Udomlya',
    country: 'Russia',
    country_en: 'Russia',
    lat: 57.87,
    lng: 35.01,
    source: 'mapbox',
  };
  const jejuUdo = {
    name: '우도',
    country: '대한민국',
    country_en: 'South Korea',
    lat: 33.506,
    lng: 126.953,
    source: 'mapbox',
  };
  const filtered = filterRegionalExploreHits(regional, [foreign, jejuUdo]);
  assert.deepEqual(
    filtered.map((h) => h.name),
    ['우도'],
  );
});

test('filterRegionalExploreHits drops 강진 가우도 partial match for 제주 우도', () => {
  const regional = parseKoreaRegionalExploreQuery('제주 우도');
  assert.ok(regional);
  const gaudo = {
    name: '가우도',
    country: '대한민국',
    country_en: 'South Korea',
    lat: 34.52,
    lng: 126.59,
    source: 'mapbox',
  };
  const jejuUdo = {
    name: '우도',
    country: '대한민국',
    country_en: 'South Korea',
    addr1: '제주특별자치도 제주시 우도면',
    lat: 33.506,
    lng: 126.953,
    source: 'mapbox',
  };
  const filtered = filterRegionalExploreHits(regional, [gaudo, jejuUdo]);
  assert.deepEqual(
    filtered.map((h) => h.name),
    ['우도'],
  );
});

test('parseKoreaRegionalExploreQuery — 강릉 커피·제주 파리는 분리하지 않음', () => {
  assert.equal(parseKoreaRegionalExploreQuery('강릉 커피'), null);
  assert.equal(parseKoreaRegionalExploreQuery('제주 파리'), null);
});

test('TourAPI row pick — 우도 + 제주 addr hint beats homonym', () => {
  const rows = [
    {
      title: '우도',
      name: '우도',
      addr1: '제주특별자치도 제주시 우도면',
      lat: 33.506,
      lng: 126.953,
    },
    {
      title: '우도마을',
      name: '우도마을',
      addr1: '전라남도 여수시',
      lat: 34.7,
      lng: 127.6,
    },
  ];
  const picked = pickUniqueTourAttractionRowForTitle(rows, '우도', ['제주', '제주시'], 88);
  assert.equal(picked?.title, '우도');
});

test('닭머르해안 alias canonical without pin coords', () => {
  assert.equal(resolveExploreSearchAlias('닭머르')?.canonical, '닭머르해안');
  assert.equal(resolveExploreSearchAlias('닭머르해안')?.canonical, '닭머르해안');
  assert.equal(resolveExploreSearchAlias('닭머르')?.pin, undefined);
});

test('추자도 — non-regional query unchanged', () => {
  assert.equal(parseKoreaRegionalExploreQuery('추자도'), null);
  assert.equal(resolveExploreSearchAlias('Chujado')?.canonical, '추자도');
});

test('Mapbox feature filter — Capital District removed under 제주 regional scope', () => {
  const regional = parseKoreaRegionalExploreQuery('제주 우도');
  const capital = featureToSuggestion(
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [126.978, 37.566] },
      properties: {
        mapbox_id: 'x',
        feature_type: 'place',
        name: 'Capital District',
        place_formatted: 'Seoul, South Korea',
        context: { country: { name: 'South Korea' } },
      },
    },
    { source: 'mapbox' },
  );
  const filtered = filterRegionalExploreHits(regional, [capital]);
  assert.equal(filtered.length, 0);
});

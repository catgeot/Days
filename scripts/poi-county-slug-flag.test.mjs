import assert from 'node:assert/strict';
import test from 'node:test';

import { featureToSuggestion } from '../src/pages/Home/lib/mapboxSearchBox.js';
import { resolveSearchResultSelect } from '../src/pages/Home/lib/exploreRecentHistory.js';
import { visitedRowToSearchSpot } from '../src/pages/Home/lib/visitedPlaceSearch.js';
import { GATEO_ENV_FLAG_NAMES } from '../src/shared/gateoFeatureFlags.js';

const HEUNGJEONG_ROW = {
  place_id: 'pyeongchang',
  name_ko: '흥정계곡',
  name_en: 'Pyeongchang',
  lat: 37.62466863,
  lng: 128.34930501,
};

const HEUNGJEONG_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [128.34930501, 37.62466863] },
  properties: {
    name: '흥정계곡',
    mapbox_id: 'poi-heungjeong-flag',
    feature_type: 'poi',
    full_address: 'Heungjeong-ri, Pyeongchang, 25300, South Korea',
    place_formatted: 'Pyeongchang, 25300, South Korea',
    context: {
      country: { name: 'South Korea', country_code: 'KR' },
      place: { name: 'Pyeongchang' },
    },
    poi_category: ['tourist attraction'],
  },
};

function setFlag(name, value) {
  globalThis.__VITE_ENV__[name] = value;
}

test('flag off keeps 평창 hub slug for 흥정계곡 visited row', () => {
  setFlag(GATEO_ENV_FLAG_NAMES.POI_COUNTY_SLUG_SEARCH, '');
  const row = visitedRowToSearchSpot(HEUNGJEONG_ROW);
  assert.equal(row.slug, 'pyeongchang');
  const decision = resolveSearchResultSelect(row);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'pyeongchang');
});

test('flag on opens 흥정계곡 on home summary instead of /place/pyeongchang', () => {
  setFlag(GATEO_ENV_FLAG_NAMES.POI_COUNTY_SLUG_SEARCH, '1');
  const row = visitedRowToSearchSpot(HEUNGJEONG_ROW);
  assert.notEqual(row.slug, 'pyeongchang');
  const decision = resolveSearchResultSelect(row);
  assert.equal(decision?.type, 'home');
  assert.equal(decision?.spot?.name, '흥정계곡');
  assert.notEqual(decision?.spot?.slug, 'pyeongchang');
});

test('flag on strips county latin from Mapbox POI suggestion', () => {
  setFlag(GATEO_ENV_FLAG_NAMES.POI_COUNTY_SLUG_SEARCH, '1');
  const hit = featureToSuggestion(HEUNGJEONG_FEATURE);
  assert.equal(hit.name, '흥정계곡');
  assert.notEqual(hit.slug, 'pyeongchang');
  assert.notEqual(String(hit.name_en || '').toLowerCase(), 'pyeongchang');
});

/**
 * POI Mapbox en 응답 — 한글 이름 + context.place=Pyeongchang 이
 * name_en/slug 가 평창 허브가 되지 않는지.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { featureToSuggestion } from '../src/pages/Home/lib/mapboxSearchBox.js';
import {
  ensureLatinPlaceSlug,
  mergeLatinPlaceFields,
} from '../src/pages/Home/lib/uiPlaceAssetQuery.js';
import { getPlaceUrlParam } from '../src/pages/Home/lib/formatUrlName.js';
import {
  overlayGeoFieldsOnVisitedSpot,
  visitedRowToSearchSpot,
} from '../src/pages/Home/lib/visitedPlaceSearch.js';
import { resolveSearchResultSelect } from '../src/pages/Home/lib/exploreRecentHistory.js';
import { getLocalizedCountryName } from '../src/components/PlaceCard/common/locationDisplay.js';
import { formatPlaceChatLabel } from '../src/pages/Home/lib/mooniPlaceChatLabel.js';
import { pickKoreanNameGallery } from '../src/utils/placeStatsNameGallery.js';
import { pickTourKeywordContentId } from '../src/utils/tourKeywordPick.js';
import { scoreTourPhotoTitle, TOURAPI_MIN_KEEP_SCORE } from '../src/utils/tourApiPhotoRank.js';

const HEUNGJEONG_EN = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [128.34930501, 37.62466863] },
  properties: {
    name: '흥정계곡',
    name_preferred: null,
    mapbox_id: 'poi-heungjeong',
    feature_type: 'poi',
    address: 'Heungjeong-ri',
    full_address: 'Heungjeong-ri, Pyeongchang, 25300, South Korea',
    place_formatted: 'Pyeongchang, 25300, South Korea',
    context: {
      country: { name: 'South Korea', country_code: 'KR' },
      postcode: { name: '25300' },
      place: { name: 'Pyeongchang' },
      neighborhood: { name: 'Bongpyeong-myeon' },
    },
    poi_category: ['tourist attraction'],
    poi_category_ids: ['tourist_attraction'],
  },
};

function openHeungjeong() {
  const suggestion = featureToSuggestion(HEUNGJEONG_EN);
  const adminHit = {
    name: 'Pyeongchang',
    name_en: 'Pyeongchang',
    kind: 'city',
    badge: '도시',
    country: 'South Korea',
    country_en: 'South Korea',
    lat: suggestion.lat,
    lng: suggestion.lng,
  };
  return ensureLatinPlaceSlug(mergeLatinPlaceFields(suggestion, adminHit));
}

test('Mapbox en POI keeps 흥정계곡 and does not slug the county', () => {
  const place = openHeungjeong();
  assert.equal(place.name, '흥정계곡');
  assert.notEqual(place.slug, 'pyeongchang');
  assert.notEqual(String(place.name_en || '').toLowerCase(), 'pyeongchang');
  assert.equal(place.parentCity, 'Pyeongchang');
  assert.notEqual(getPlaceUrlParam(place), 'pyeongchang');
  assert.match(place.slug, /흥정계곡/);
});

test('a real county feature still slugs to pyeongchang', () => {
  const ko = featureToSuggestion({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [128.3901, 37.3705] },
    properties: {
      name: '평창',
      feature_type: 'place',
      context: {
        country: { name: 'South Korea', country_code: 'KR' },
        region: { name: 'Gangwon-do' },
      },
    },
  });
  const en = featureToSuggestion({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [128.3901, 37.3705] },
    properties: {
      name: 'Pyeongchang',
      feature_type: 'place',
      context: {
        country: { name: 'South Korea', country_code: 'KR' },
        place: { name: 'Pyeongchang' },
      },
    },
  });
  const merged = ensureLatinPlaceSlug(mergeLatinPlaceFields(ko, en));
  assert.equal(merged.name, '평창');
  assert.equal(merged.name_en, 'Pyeongchang');
  assert.equal(merged.slug, 'pyeongchang');
  assert.equal(merged.kind, 'city');
  assert.equal(getPlaceUrlParam(merged), 'pyeongchang');
});

test('장소 badge row does not reuse the 평창 stats slug', () => {
  const row = visitedRowToSearchSpot({
    place_id: 'pyeongchang',
    name_ko: '흥정계곡',
    name_en: 'Pyeongchang',
    lat: 37.62466863,
    lng: 128.34930501,
    image_url: 'https://example.com/heungjeong.jpg',
  });
  assert.equal(row.badge, '장소');
  assert.equal(row.name, '흥정계곡');
  assert.notEqual(row.slug, 'pyeongchang');
  assert.notEqual(String(row.name_en || '').toLowerCase(), 'pyeongchang');
  assert.equal(row.image_url, 'https://example.com/heungjeong.jpg');

  const overlaid = overlayGeoFieldsOnVisitedSpot(row, [
    {
      name: 'Pyeongchang',
      name_en: 'Pyeongchang',
      kind: 'city',
      badge: '도시',
      country: 'South Korea',
      country_en: 'South Korea',
      lat: 37.3705,
      lng: 128.3901,
    },
  ]);
  assert.equal(overlaid.name, '흥정계곡');
  assert.notEqual(overlaid.slug, 'pyeongchang');
  assert.notEqual(String(overlaid.name_en || '').toLowerCase(), 'pyeongchang');

  const decision = resolveSearchResultSelect({
    ...row,
    slug: 'pyeongchang',
    name_en: 'Pyeongchang',
  });
  assert.equal(decision.type, 'home');
  assert.notEqual(decision.spot.slug, 'pyeongchang');
  assert.equal(decision.spot.name, '흥정계곡');
});

test('/place/pyeongchang search pin still opens the county card', () => {
  const decision = resolveSearchResultSelect({
    id: 'hub-pyeongchang',
    name: '평창',
    name_en: 'Pyeongchang',
    name_ko: '평창',
    slug: 'pyeongchang',
    lat: 37.3705,
    lng: 128.3901,
    source: 'hub',
    kind: 'city',
    badge: '도시',
  });
  assert.equal(decision.type, 'place');
  assert.equal(decision.param, 'pyeongchang');
});

test('ko UI country label is 대한민국 for South Korea', () => {
  const valley = openHeungjeong();
  assert.equal(getLocalizedCountryName(valley, 'ko'), '대한민국');
  assert.equal(getLocalizedCountryName({ country: '대한민국' }, 'ko'), '대한민국');
  assert.equal(getLocalizedCountryName({ country: 'SOUTH KOREA' }, 'ko'), '대한민국');
  assert.equal(
    getLocalizedCountryName({ country: 'South Korea', country_en: 'South Korea' }, 'en'),
    'South Korea',
  );
  assert.equal(formatPlaceChatLabel(valley, 'ko'), '대한민국 흥정계곡');
});

test('same Korean name gallery skips the county hub row', () => {
  const photo = (id) => ({
    id,
    urls: { small: `https://example.com/${id}.jpg`, regular: `https://example.com/${id}.jpg` },
    alt_description: 'valley landscape',
  });
  const picked = pickKoreanNameGallery(
    [
      {
        place_id: 'pyeongchang',
        name_ko: '평창',
        gallery_urls: [photo('county'), photo('county-2')],
      },
      {
        place_id: '흥정계곡',
        name_ko: '흥정계곡',
        gallery_urls: [],
      },
      {
        place_id: 'herbnara-farm',
        name_ko: '흥정계곡',
        gallery_urls: [photo('valley'), photo('valley-2')],
      },
    ],
    '흥정계곡',
  );
  assert.equal(picked?.place_id, 'herbnara-farm');
});

test('Tour keyword pick prefers the exact title and a contained waterfall name', () => {
  assert.equal(
    pickTourKeywordContentId(
      [
        { contentId: '2801527', title: '흥정계곡409' },
        { contentId: '2761919', title: '흥정계곡오토캠핑장' },
        { contentId: '126657', title: '흥정계곡' },
      ],
      '흥정계곡',
    ),
    '126657',
  );
  assert.equal(
    pickTourKeywordContentId(
      [{ contentId: '1918639', title: '월정리해변(월정리해수욕장)' }],
      '월정리해변',
    ),
    '1918639',
  );
  assert.equal(
    pickTourKeywordContentId([{ contentId: '125494', title: '운계폭포' }], '감악산 운계폭포'),
    '125494',
  );
  assert.equal(
    pickTourKeywordContentId([{ contentId: '1', title: '평창' }], '흥정계곡'),
    '',
  );
  assert.ok(
    scoreTourPhotoTitle('운계폭포 (2)', '감악산 운계폭포', '감악산 운계폭포') >=
      TOURAPI_MIN_KEEP_SCORE,
  );
});

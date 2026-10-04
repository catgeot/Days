/**
 * Catalog cities keep the video grid. Uncataloged pins stay link-only,
 * except when a place_videos row already has videos.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { citiesData } from '../src/pages/Home/data/citiesData.js';
import catalog from '../supabase/functions/fetch-place-videos/placeVideoCatalog.json' with { type: 'json' };
import {
  freeSearchYouTubeQuery,
  freeSearchYouTubeUrl,
  isFreeSearchLocation,
  isPlaceholderPlaceName,
  shouldShowFreeSearchLink,
} from '../src/pages/Home/lib/freeSearchYouTubeLink.js';

function cityLocation(slug) {
  const city = citiesData.find((row) => row.slug === slug);
  assert.ok(city, slug);
  return {
    id: `city-${city.lat}-${city.lng}`,
    slug: city.slug,
    canonical_slug: city.slug,
    name: city.name,
    name_en: city.name_en,
    lat: city.lat,
    lng: city.lng,
    country: city.country,
    uiPlace: true,
    source: 'cities',
  };
}

for (const slug of ['moorea', 'tuvalu']) {
  assert.equal(typeof catalog.places[slug], 'string', `${slug} is a places-catalog slug`);
  const location = cityLocation(slug);
  assert.equal(isFreeSearchLocation(location), false, `${slug} route is not link-only`);
  assert.equal(shouldShowFreeSearchLink(location, null), false);
  const city = citiesData.find((row) => row.slug === slug);
  const suggestion = {
    id: `city-${city.lat}-${city.lng}`,
    kind: 'city',
    name: city.name,
    name_en: city.name_en,
    slug: city.slug,
    lat: city.lat,
    lng: city.lng,
    country: city.country,
    uiPlace: true,
    source: 'cities',
  };
  assert.match(suggestion.id, /^city-/);
  assert.equal(isFreeSearchLocation(suggestion), false, `${slug} suggestion route is not link-only`);
}

const suggestionSource = readFileSync(new URL('../src/pages/Home/lib/citiesSearch.js', import.meta.url), 'utf8');
assert.match(suggestionSource, /id: `city-\$\{city\.lat\}-\$\{city\.lng\}`/);
assert.match(suggestionSource, /slug: city\.slug/);

const uncataloged = {
  id: 'search-37.5-127.0',
  slug: 'search-37.5-127.0',
  name: '화곡리',
};
assert.equal(isFreeSearchLocation(uncataloged), true);
assert.equal(shouldShowFreeSearchLink(uncataloged, null), true);
assert.equal(
  shouldShowFreeSearchLink(uncataloged, {
    videos: [{ id: 'cached' }],
    next_retry_at: null,
  }),
  false,
);

const locPin = {
  id: 'loc-1-2',
  slug: 'loc-1-2',
  name: '알 수 없는 지역',
};
assert.equal(isPlaceholderPlaceName(locPin.name), true);
assert.equal(isPlaceholderPlaceName('좌표 탐색'), true);
assert.equal(isPlaceholderPlaceName('사파'), false);
assert.equal(freeSearchYouTubeQuery(locPin), '');
assert.equal(freeSearchYouTubeUrl(locPin), '');
assert.equal(
  shouldShowFreeSearchLink(locPin, { videos: [{ id: 'other' }], next_retry_at: null }),
  true,
  'placeholder name must not reuse another pin cache row',
);
assert.equal(
  freeSearchYouTubeQuery({ ...locPin, name: '남산', region: '서울' }),
  '남산',
);

assert.equal(
  freeSearchYouTubeQuery({
    name: '경복궁',
    areaLabel: '수도권',
    region: '수도권',
    addr1: '서울특별시 종로구 사직로 161',
  }),
  '경복궁 서울',
);
assert.equal(
  freeSearchYouTubeQuery({ name: '경복궁', region: '수도권', areaLabel: '수도권' }),
  '경복궁',
);

console.log('free-search catalog checks passed');

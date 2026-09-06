#!/usr/bin/env node
/**
 * 자킨토스 검색 #8 — 미등록 한글 지명이 별칭/SSOT 없이 검색되는지.
 * 오프라인: 보강 판정·라틴 병합.
 * LIVE: VITE_MAPBOX_TOKEN 있으면 Search Box+Geocoding을 앱과 같은 규칙으로 합친다.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../src/utils/travelSpotResolve.js';
import { resolveExploreSearchAlias } from '../src/pages/Home/lib/exploreSearchAliases.js';
import { geocodeForwardSuggestionHits, geocodeReversePlaceFields } from '../src/pages/Home/lib/mapboxGeocodeSuggestions.js';
import {
  hitCoversSearchQuery,
  shouldSupplementGeocodeHits,
} from '../src/pages/Home/lib/travelSearchHomonyms.js';
import {
  isLatinPlaceName,
  mergeSearchBoxEnglishHits,
  mergeSearchBoxWithGeocodeHits,
  pickLatinPlaceName,
} from '../src/pages/Home/lib/uiPlaceAssetQuery.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';

const UNSEEN = ['케팔로니아', '시프노스', '포르멘테라', '파로스', '이오스', '레프카다', '보네르섬', '낙소스'];

for (const q of UNSEEN) {
  assert.equal(resolveTravelSpotFromSearchQuery(q), null, `${q} is not SSOT`);
  assert.equal(resolveExploreSearchAlias(q), null, `${q} is not a hardcoded alias`);
  assert.equal(
    TRAVEL_SPOTS.some((s) => s.name === q || (s.aliases || []).includes(q)),
    false,
    `${q} not in travelSpots names/aliases`,
  );
}

assert.equal(hitCoversSearchQuery({ name: '자킨토스' }, '자킨토스'), true);
assert.equal(hitCoversSearchQuery({ name: '파포스' }, '파로스'), false);
assert.equal(hitCoversSearchQuery({ name: '히오스' }, '이오스'), false);
assert.equal(
  hitCoversSearchQuery({ name: '카리브 네덜란드 보네르섬' }, '보네르섬'),
  true,
);

assert.equal(shouldSupplementGeocodeHits('케팔로니아', []), true, 'empty Search Box → geocode');
assert.equal(
  shouldSupplementGeocodeHits('자킨토스', [{ name: '자킨토스', country: '그리스' }]),
  false,
  'covering overseas hit skips extra geocode',
);
assert.equal(
  shouldSupplementGeocodeHits('파로스', [{ name: '파포스', country: '키프로스' }]),
  true,
  'phonetic miss → geocode',
);
assert.equal(
  shouldSupplementGeocodeHits('미코노스', [
    { name: '미코노스', country: 'South Korea', place_formatted: 'Cheongju, South Korea' },
  ]),
  true,
  'Korean POI with the same Hangul does not count',
);
assert.equal(shouldSupplementGeocodeHits('Paris', []), true, 'empty always supplements');
assert.equal(
  shouldSupplementGeocodeHits('Paris', [{ name: 'Paris', name_en: 'Paris', country: 'France' }]),
  false,
  'latin query with hits does not need Hangul geocode rule',
);

const emptyKoMerged = mergeSearchBoxEnglishHits(
  [],
  [{ name: 'Sifnos', name_en: 'Sifnos', country: 'Greece', country_en: 'Greece', lat: 36.97, lng: 24.7 }],
);
assert.equal(emptyKoMerged.length, 1, 'empty ko still keeps en hits');
assert.equal(emptyKoMerged[0].name_en, 'Sifnos');

const parosMerged = mergeSearchBoxWithGeocodeHits(
  [{ name: '파포스', name_en: 'Pafos', country: '키프로스', lat: 34.77, lng: 32.42 }],
  [{ name: '파로스섬', name_en: 'Paros', country: '그리스', country_en: 'Greece', lat: 37.08, lng: 25.15 }],
);
assert.equal(parosMerged[0].name_en, 'Paros', 'geocode covering hit is first');
assert.equal(parosMerged[1].name_en, 'Pafos');

const boxSrc = readFileSync(join(root, 'src/pages/Home/lib/mapboxSearchBox.js'), 'utf8');
assert.match(boxSrc, /koEmpty/, 'empty Search Box no longer short-circuits en merge');
assert.match(boxSrc, /shouldSupplementGeocodeHits/, 'Search Box supplements from geocoding');
assert.match(boxSrc, /geocodeForwardSuggestionHits/, 'Search Box calls geocode fallback');
assert.match(boxSrc, /mapboxGeocodeSuggestions/, 'geocode fallback is a static Search Box sibling');
assert.doesNotMatch(boxSrc, /await import\('\.\/geocoding\.js'\)/, 'does not dynamic-import geocoding.js');
assert.doesNotMatch(
  boxSrc,
  /if \(language === 'en' \|\| hits\.every/,
  'vacuous empty-array .every latin short-circuit removed',
);

const aliasSrc = readFileSync(join(root, 'src/pages/Home/lib/exploreSearchAliases.js'), 'utf8');
for (const q of UNSEEN) {
  assert.doesNotMatch(aliasSrc, new RegExp(`['"]${q}['"]`), `${q} not added as a per-keyword alias`);
}

if (!TOKEN) {
  console.log('PASS unseen-place-search (offline helpers · LIVE skipped, no Mapbox token)');
  process.exit(0);
}

const SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1/forward';

function searchBoxTypes(query) {
  return /섬$|\bislands?\b/i.test(query) ? 'region,place,city' : 'place,city,poi';
}

function sbFeatureToHit(feature) {
  const props = feature?.properties || {};
  const coords = feature?.geometry?.coordinates || [];
  const name = String(props.name || props.name_preferred || '').trim();
  const preferred = String(props.name_preferred || props.name || name).trim();
  const country = props.place_formatted?.split(',').pop()?.trim() || '';
  return {
    name,
    name_en: isLatinPlaceName(preferred) ? preferred : isLatinPlaceName(name) ? name : '',
    country,
    country_en: isLatinPlaceName(country) ? country : '',
    lat: Number(coords[1]),
    lng: Number(coords[0]),
    place_formatted: props.place_formatted || '',
    source: 'searchbox',
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function searchBoxHits(query, language) {
  const params = new URLSearchParams({
    q: query,
    access_token: TOKEN,
    language,
    limit: '5',
    types: searchBoxTypes(query),
    auto_complete: 'true',
  });
  const data = await fetchJson(`${SEARCHBOX}?${params}`);
  return (data.features || []).map(sbFeatureToHit).filter((h) => h.name && Number.isFinite(h.lat));
}

async function pipelineHits(query) {
  const ko = await searchBoxHits(query, 'ko');
  let merged;
  if (ko.length && ko.every((h) => isLatinPlaceName(h.name_en))) {
    merged = ko;
  } else {
    const en = await searchBoxHits(query, 'en');
    merged = mergeSearchBoxEnglishHits(ko, en);
  }
  if (!shouldSupplementGeocodeHits(query, merged)) return merged;
  const geoMerged = await geocodeForwardSuggestionHits(query, { limit: 6 });
  if (!geoMerged.length) return merged;
  return mergeSearchBoxWithGeocodeHits(merged, geoMerged);
}

const LIVE = [
  { q: '케팔로니아', latin: /^(cephalonia|kefalonia)$/i, country: /greece|그리스/i },
  { q: '시프노스', latin: /^sifnos$/i, country: /greece|그리스/i },
  { q: '포르멘테라', latin: /^formentera$/i, country: /spain|스페인|balear/i },
  { q: '파로스', latin: /^paros$/i, country: /greece|그리스/i },
  { q: '이오스', latin: /^ios$/i, country: /greece|그리스/i },
  { q: '레프카다', latin: /^lefkada$/i, country: /greece|그리스/i },
  { q: '보네르섬', latin: /^bonaire$/i, country: /netherlands|네덜란드|caribbean|보네르/i },
  { q: '낙소스', latin: /^naxos$/i, country: /greece|그리스/i },
  { q: '자킨토스', latin: /^zakynthos$/i, country: /greece|그리스/i },
];

for (const row of LIVE) {
  const hits = await pipelineHits(row.q);
  assert.ok(hits.length, `${row.q} returned hits`);
  const top = hits[0];
  const latin = pickLatinPlaceName(top).split(',')[0].trim();
  const blob = `${latin} ${top.name_en} ${top.country} ${top.country_en}`;
  assert.match(latin, row.latin, `${row.q} top=${top.name}/${latin} ${blob}`);
  assert.match(blob, row.country, `${row.q} country=${blob}`);
  assert.doesNotMatch(blob, /korea|한국|대한민국/i, `${row.q} is not a Korean POI`);
}

const reverse = await geocodeReversePlaceFields(37.787, 20.9);
assert.ok(reverse, 'reverse Zakynthos coords');
assert.match(
  `${reverse.country} ${reverse.country_en}`,
  /greece|그리스/i,
  `reverse country=${reverse.country}/${reverse.country_en}`,
);

console.log('PASS unseen-place-search (helpers + LIVE Mapbox unseen Hangul places)');

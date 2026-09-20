#!/usr/bin/env node
/**
 * 명승 TourAPI 상세 — KorService2 SSOT (EngService2 본문 롤백).
 *
 *   npm run smoke:scenic-detail-locale
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

const fetchJs = readFileSync(
  join(root, 'src/utils/fetchTourApiAttractionDetail.js'),
  'utf8',
);
assert(
  fetchJs.includes('TOUR_API_BODY_LOCALE') &&
    !fetchJs.includes('fetchTourApiAttractionDetailLocalized') &&
    !fetchJs.includes('mergeTourApiAttractionDetail') &&
    !fetchJs.includes('resolveTourApiEngContentId'),
  'attraction detail uses TOUR_API_BODY_LOCALE only',
);

const proxyJs = readFileSync(join(root, 'src/utils/tourApiProxy.js'), 'utf8');
assert(
  proxyJs.includes('TOUR_API_BODY_LOCALE'),
  'tourApiProxy exports TOUR_API_BODY_LOCALE ko SSOT',
);

const nearbyJs = readFileSync(
  join(root, 'src/utils/fetchNearbyTourRestaurants.js'),
  'utf8',
);
assert(
  nearbyJs.includes('NEARBY_TOUR_API_LOCALE') ||
    nearbyJs.includes('TOUR_API_BODY_LOCALE'),
  'nearby restaurants use ko listing SSOT',
);

const modalJs = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(
  modalJs.includes('fetchTourApiAttractionDetail') &&
    !modalJs.includes('fetchTourApiAttractionDetailLocalized'),
  'ThemeSpotDetailModal uses ko-only attraction detail',
);
assert(
  modalJs.includes('scenicSpotMapTitle(spot, locale)'),
  'ThemeSpotDetailModal header title uses scenicSpotMapTitle',
);

const mapJs = readFileSync(
  join(root, 'src/pages/KoreaTheme/KoreaScenicMap.jsx'),
  'utf8',
);
assert(
  mapJs.includes('localizeMapDrillCrumbLabel'),
  'KoreaScenicMap breadcrumb uses localizeMapDrillCrumbLabel',
);
assert(
  mapJs.includes('buildScenicMapGeoJson(pinItems, { locale })'),
  'KoreaScenicMap pins pass locale to GeoJSON builder',
);

const mapDataJs = readFileSync(
  join(root, 'src/pages/KoreaTheme/koreaScenicMapData.js'),
  'utf8',
);
assert(
  mapDataJs.includes('scenicSpotMapTitle(item, locale)'),
  'buildScenicMapGeoJson uses scenicSpotMapTitle for pin labels',
);

const { buildScenicMapGeoJson } = await import(
  '../src/pages/KoreaTheme/koreaScenicMapData.js'
);
const { listKoreaScenicSpots } = await import(
  '../src/pages/Home/lib/koreaScenicSpots.js'
);
const sample = listKoreaScenicSpots().find((s) => s.attractionNameEn);
if (sample) {
  const enGeo = buildScenicMapGeoJson([sample], { locale: 'en' });
  const feat = enGeo.features.find((f) => f.properties.spotId === sample.id);
  assert(
    feat?.properties?.title === sample.attractionNameEn,
    `EN pin title uses attractionNameEn (${sample.id})`,
  );
  const koGeo = buildScenicMapGeoJson([sample], { locale: 'ko' });
  const koFeat = koGeo.features.find((f) => f.properties.spotId === sample.id);
  assert(
    koFeat?.properties?.title === sample.name,
    `KO pin title uses Korean name (${sample.id})`,
  );
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll scenic TourAPI body ko SSOT checks passed');

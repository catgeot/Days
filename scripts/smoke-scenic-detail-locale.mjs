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

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll scenic TourAPI body ko SSOT checks passed');

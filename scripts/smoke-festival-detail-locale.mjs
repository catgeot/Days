#!/usr/bin/env node
/**
 * 축제·명승 TourAPI 본문 — KorService2 SSOT (EngService2 본문 롤백).
 *
 *   npm run smoke:festival-detail-locale
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

const festivalsJs = readFileSync(
  join(root, 'src/utils/fetchTourApiFestivals.js'),
  'utf8',
);
assert(
  festivalsJs.includes('TOUR_API_BODY_LOCALE') &&
    !festivalsJs.includes('fetchTourApiFestivalDetailLocalized') &&
    !festivalsJs.includes('mergeTourApiFestivalDetail'),
  'festival detail uses TOUR_API_BODY_LOCALE only',
);
assert(
  festivalsJs.includes("locale: TOUR_API_BODY_LOCALE"),
  'festivalWindow and festivalDetail pin ko locale',
);

const windowJs = readFileSync(
  join(root, 'src/pages/Korea/fetchKoreaFestivalsWindow.js'),
  'utf8',
);
assert(windowJs.includes('rolling12:ko'), 'sessionStorage cache key includes ko');

const sheetJs = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetJs.includes('fetchTourApiFestivalDetail') &&
    !sheetJs.includes('fetchTourApiFestivalDetailLocalized'),
  'FestivalDetailSheet uses ko-only festivalDetail',
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll festival TourAPI body ko SSOT checks passed');

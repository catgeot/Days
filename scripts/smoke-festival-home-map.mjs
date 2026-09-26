/**
 * 축제 본문 위치 — 홈 축제 지도 핀. 네이버 지도 직링크 없음.
 *   npm run smoke:festival-home-map
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond, msg) {
  if (cond) console.log(`OK    ${msg}`);
  else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

const sheet = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const page = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');

assert(sheet.includes('onShowOnMap'), 'sheet can ask the home map to focus');
assert(
  sheet.includes("t('korea.festival.detail.showOnHomeMap')"),
  'surface button is the home-map action',
);
assert(
  sheet.includes('festivalLngLat(item?.mapx, item?.mapy)'),
  'button needs a festival coordinate',
);
assert(sheet.includes('naverSearchUrl'), 'reading tab still opens Naver search');
assert(!sheet.includes('map.naver.com'), 'sheet does not deep-link Naver map');
assert(!sheet.includes('festivalNaverMap'), 'naver map helper is not wired');

assert(page.includes('showFestivalOnMap'), 'home page focuses one festival');
assert(page.includes('setMapPinId'), 'pin hold survives the sheet closing');
assert(page.includes('zoom: 13'), 'camera closes in on that festival');
assert(page.includes('onShowOnMap={showFestivalOnMap}'), 'sheet action is connected');
assert(!page.includes('map.naver.com'), 'home page does not deep-link Naver map');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke-festival-home-map: all assertions passed');

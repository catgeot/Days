/**
 * 축제 본문 표면의 네이버·구글 검색. 읽을거리 탭 안이 아님.
 *   npm run smoke:festival-surface-search
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
const readingAt = sheet.indexOf('activeTab === TAB_READING');
const outboundAt = sheet.indexOf('OutboundSearchButtons');
const naverKeyAt = sheet.indexOf('korea.festival.detail.naverSearch');
const googleKeyAt = sheet.indexOf('korea.festival.detail.googleSearch');

assert(
  outboundAt > 0 && outboundAt < readingAt,
  'Outbound search buttons sit above the reading tab',
);
assert(naverKeyAt > 0 && naverKeyAt < readingAt, 'Festival Naver label key is on the surface');
assert(googleKeyAt > 0 && googleKeyAt < readingAt, 'Festival Google label key is on the surface');
assert(
  (sheet.match(/naverLabelKey="korea\.festival\.detail\.naverSearch"/g) || []).length === 1,
  'Festival Naver search is not duplicated in the reading tab',
);
assert(sheet.includes('naverSearchUrl(item.title)'), 'Naver link still uses the festival title');
assert(
  sheet.includes('OutboundSearchButtons'),
  'Festival surface uses shared outbound search buttons',
);
assert(
  sheet.includes('korea.festival.detail.naverSearchAria'),
  'Festival Naver button has accessible label key',
);
assert(!sheet.includes('showOnHomeMap'), 'home-map button is gone');
assert(!sheet.includes('map.naver.com'), 'sheet does not deep-link Naver map');
assert(!page.includes('mapPinId'), 'home page pin-focus state is gone');
assert(!page.includes('showFestivalOnMap'), 'home page no longer flies from the sheet');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke-festival-surface-search: all assertions passed');

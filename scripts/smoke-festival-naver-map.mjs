/**
 * 축제 본문 네이버 지도 — 검색어는 장소·주소, 축제명 제외.
 *   npm run smoke:festival-naver-map
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  festivalNaverMapQuery,
  festivalNaverMapUrl,
} from '../src/pages/Korea/festivalNaverMap.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond, msg) {
  if (cond) console.log(`OK    ${msg}`);
  else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

const bupyeongAddr = '인천광역시 부평구 부평대로 34-1 (부평동)';
const bupyeongTitle = '제30회 부평풍물대축제';

const placeQuery = festivalNaverMapQuery({
  addr1: bupyeongAddr,
  eventplace: '신트리공원, 부평대로 & 부평 일대',
  title: bupyeongTitle,
});
assert(
  placeQuery === '인천광역시 부평구 신트리공원',
  `venue token wins over 일대/도로 (${placeQuery})`,
);
assert(!placeQuery.includes('풍물'), 'map query drops the festival title');
assert(!placeQuery.includes('일대'), 'map query drops vague 일대');

const addrQuery = festivalNaverMapQuery({
  addr1: bupyeongAddr,
  eventplace: '부평대로 및 부평 일대',
  title: bupyeongTitle,
});
assert(
  addrQuery === '인천광역시 부평구 부평대로 34-1',
  `vague venue falls back to road address (${addrQuery})`,
);

const titleOnly = festivalNaverMapQuery({
  addr1: '',
  eventplace: bupyeongTitle,
  title: bupyeongTitle,
});
assert(titleOnly === '', 'festival title alone is not a map query');

const url = festivalNaverMapUrl({
  addr1: bupyeongAddr,
  eventplace: '신트리공원',
  title: bupyeongTitle,
  mapx: 126.724,
  mapy: 37.494,
});
assert(url.startsWith('https://map.naver.com/p/search/'), 'naver map search url');
assert(url.includes('?c=126.724,37.494,16,0,0,0,dh'), 'camera uses festival coords');
assert(decodeURIComponent(url).includes('신트리공원'), 'url search is the venue');
assert(!decodeURIComponent(url).includes('풍물'), 'url search is not the festival name');

const noCoord = festivalNaverMapUrl({
  addr1: bupyeongAddr,
  eventplace: '',
  title: bupyeongTitle,
  mapx: 0,
  mapy: 0,
});
assert(!noCoord.includes('?c='), 'invalid coords omit camera');
assert(decodeURIComponent(noCoord).includes('부평대로 34-1'), 'address query without venue');

const sheet = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(sheet.includes('festivalNaverMapUrl'), 'detail sheet links the map helper');
assert(sheet.includes("t('korea.festival.detail.viewOnMap')"), 'surface map button copy');
assert(
  !sheet.includes('festivalNaverMapUrl(item.title)') &&
    !sheet.includes('festivalNaverMapQuery(item.title)'),
  'sheet does not pass the festival title as the map query',
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke-festival-naver-map: all assertions passed');

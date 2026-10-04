/**
 * YouTube 얕은 수정 (S1·S4·S5) 단위 검증 — 모의/소스 검사, 네트워크 없음
 */
import { readFileSync } from 'node:fs';
import { decodeHtmlEntities } from '../src/utils/decodeHtmlEntities.js';
import { freeSearchYouTubeUrl, isFreeSearchLocation } from '../src/pages/Home/lib/freeSearchYouTubeLink.js';
import {
  YOUTUBE_ALLOWED_MESSAGE_ORIGINS,
  YOUTUBE_UNPLAYABLE_ERROR_CODES,
} from '../src/utils/youtubePlayerMessaging.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return;
  }
  console.log(`OK    ${msg}`);
}

const edgeSrc = readFileSync('supabase/functions/fetch-place-videos/index.ts', 'utf8');
const ipSrc = readFileSync('supabase/functions/_shared/placeVideoClientIp.ts', 'utf8');
assert(edgeSrc.includes("videoEmbeddable: 'true'"), 'S1 primary search has videoEmbeddable');
assert(edgeSrc.includes("videoSyndicated: 'true'"), 'S1 primary search has videoSyndicated');
assert(!edgeSrc.includes('maxFollowPages'), 'quota: no follow-page loop in edge');
assert(edgeSrc.includes('const fetchSearch = async'), 'S1 uses shared fetchSearch helper');
assert(
  edgeSrc.includes("videoEmbeddable: 'true'") && edgeSrc.includes("videoSyndicated: 'true'"),
  'S1 fetchSearch sets embeddable + syndicated',
);

assert(!readFileSync('src/pages/Home/hooks/useYouTubeSearch.js', 'utf8').includes('TRAVEL_VIDEOS'), 'S4 hook has no TRAVEL_VIDEOS');
try {
  readFileSync('src/pages/Home/data/travelVideos.js');
  assert(false, 'S4 travelVideos.js should be deleted');
} catch {
  assert(true, 'S4 travelVideos.js deleted');
}

assert(decodeHtmlEntities('Tom &amp; Jerry&#39;s') === "Tom & Jerry's", 'S5 named and decimal entities');
assert(decodeHtmlEntities('A &#x27; test') === "A ' test", 'S5 hex entity');
assert(decodeHtmlEntities('&constructor;') === '&constructor;', 'S5 unknown entity not polluted');

const youtubeLink = freeSearchYouTubeUrl({ id: 'search-1-2', name: '남산', city: '서울' });
assert(
  youtubeLink === `https://www.youtube.com/results?search_query=${encodeURIComponent('남산 서울')}`,
  'free-search link encodes name and city',
);
assert(isFreeSearchLocation({ id: 'loc-9' }), 'loc- id is free-search');
assert(isFreeSearchLocation({ slug: 'city-busan' }), 'city- slug is free-search');
assert(isFreeSearchLocation({ placeId: 'label-1' }), 'label- placeId is free-search');
assert(!isFreeSearchLocation({ id: 'paris', slug: 'paris' }), 'catalog slug is not free-search');

const playerSrc = readFileSync('src/components/PlaceCard/views/YouTubePlayerView.jsx', 'utf8');
assert(playerSrc.includes('target="_blank"'), 'YouTube link opens a new tab');
assert(playerSrc.includes('rel="noopener noreferrer"'), 'YouTube link uses rel=noopener noreferrer');
assert(playerSrc.includes('place.video.ipQuotaEmpty'), 'empty ip quota copy');
assert(playerSrc.includes('place.video.retry'), 'retry copy remains for other errors');
assert(readFileSync('src/i18n/locales/ko.json', 'utf8').includes('YouTube에서 보기'), 'Korean YouTube link label');
const ko = readFileSync('src/i18n/locales/ko.json', 'utf8');
assert(ko.includes('ipQuotaEmpty'), 'ko ipQuotaEmpty');
assert(ko.includes('"ipQuotaEmpty": "오늘 이 접속의 영상 검색 한도에 도달했어요. 한도는 내일 다시 채워져요."'), 'empty ip quota has no cached-video sentence');
assert(readFileSync('src/utils/fetchScenicSpotVideos.js', 'utf8').includes('error.context'), 'modal fetch reads the 429 JSON body');
assert(ipSrc.includes('FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER'), 'client ip header is configurable');
assert(ipSrc.includes('FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS'), 'xff trusted hop count is configurable');
assert(ipSrc.includes('x-real-ip') && ipSrc.includes('ignored'), 'CLIENT_IP_HEADER=x-real-ip is documented as ignored');
assert(edgeSrc.includes('writeFailure("empty"'), 'only an empty YouTube result writes the negative cache');
assert(!edgeSrc.includes('writeFailure(error.code'), 'quota refusal does not writeFailure');
assert(!edgeSrc.includes('writeFailure(yt.reason'), 'youtube errors do not writeFailure');
assert(!edgeSrc.includes('ALLOW_FREE_SEARCH'), 'free-search allow flag is removed');

assert(YOUTUBE_UNPLAYABLE_ERROR_CODES.has(150), 'S2 includes error 150');
assert(YOUTUBE_ALLOWED_MESSAGE_ORIGINS.has('https://www.youtube.com'), 'S2 allows youtube origin');

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll unit checks passed');

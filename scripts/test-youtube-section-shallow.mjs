/**
 * YouTube 얕은 수정 (S1·S4·S5) 단위 검증 — 모의/소스 검사, 네트워크 없음
 */
import { readFileSync } from 'node:fs';
import { decodeHtmlEntities } from '../src/utils/decodeHtmlEntities.js';
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
assert(edgeSrc.includes("videoEmbeddable: 'true'"), 'S1 primary search has videoEmbeddable');
assert(edgeSrc.includes("videoSyndicated: 'true'"), 'S1 primary search has videoSyndicated');
const fallbackBlock = edgeSrc.slice(edgeSrc.indexOf('secondQuery'));
assert(fallbackBlock.includes("videoEmbeddable: 'true'"), 'S1 fallback search has videoEmbeddable');
assert(fallbackBlock.includes("videoSyndicated: 'true'"), 'S1 fallback search has videoSyndicated');

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

assert(YOUTUBE_UNPLAYABLE_ERROR_CODES.has(150), 'S2 includes error 150');
assert(YOUTUBE_ALLOWED_MESSAGE_ORIGINS.has('https://www.youtube.com'), 'S2 allows youtube origin');

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll unit checks passed');

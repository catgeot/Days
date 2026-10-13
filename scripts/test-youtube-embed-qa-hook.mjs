/**
 * YouTube embed QA hook — preview/dev only (static gates).
 */
import { readFileSync } from 'node:fs';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return;
  }
  console.log(`OK    ${msg}`);
}

const hookSrc = readFileSync('src/utils/youtubeEmbedQaHook.js', 'utf8');
const playerSrc = readFileSync('src/components/PlaceCard/views/YouTubePlayerView.jsx', 'utf8');

assert(hookSrc.includes('isCloudPreviewSurface'), 'QA hook uses cloud preview surface gate');
assert(hookSrc.includes('ytForceError'), 'QA hook documents query param');
assert(hookSrc.includes('gateo.yt.forceEmbedError'), 'QA hook documents localStorage flag');
assert(playerSrc.includes('isYoutubeForceEmbedErrorEnabled'), 'player reads QA force-error hook');
assert(playerSrc.includes('retrySessionNoAdvanceRef'), 'player keeps retry session no-advance');

if (failed > 0) process.exit(1);

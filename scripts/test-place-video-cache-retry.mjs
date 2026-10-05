/**
 * 장소 탭 캐시: next_retry_at 이 지난 빈 행만 다시 조회한다.
 */
import { shouldRefreshPlaceVideoCache } from '../src/pages/Home/lib/placeVideoCache.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return;
  }
  console.log(`OK    ${msg}`);
}

const now = Date.parse('2026-10-04T00:00:00.000Z');
assert(shouldRefreshPlaceVideoCache(null, now) === true, 'missing row fetches');
assert(
  shouldRefreshPlaceVideoCache({ videos: [], next_retry_at: '2026-10-03T00:00:00.000Z' }, now) === true,
  'expired empty row fetches',
);
assert(
  shouldRefreshPlaceVideoCache({ videos: [], next_retry_at: '2026-10-05T00:00:00.000Z' }, now) === false,
  'future empty row stays empty',
);
assert(
  shouldRefreshPlaceVideoCache({ videos: [{ id: 'a' }], next_retry_at: null }, now) === false,
  'fresh videos stay cached',
);
assert(
  shouldRefreshPlaceVideoCache({ videos: [], next_retry_at: null }, now) === false,
  'empty success without retry stays empty',
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nplace video cache retry checks passed');

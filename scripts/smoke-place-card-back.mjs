/**
 * 탐색홈 검색 → 장소카드 ← 가 지구본 홈이 아니라 탐색으로 돌아가는지.
 *
 *   npm run smoke:place-card-back
 */
import {
  clearExploreReturn,
  peekExploreReturn,
  rememberExploreReturn,
} from '../src/pages/Home/lib/exploreReturnSnapshot.js';
import { resolvePlaceCardBack } from '../src/pages/Home/lib/placeCardBack.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return;
  }
  console.log(`OK    ${msg}`);
}

clearExploreReturn();

{
  const action = resolvePlaceCardBack({
    historyIdx: 2,
    prevPath: '/',
    returnTo: null,
    exploreReturnPath: '/explore',
  });
  assert(
    action.type === 'push' && action.path === '/explore',
    `explore search → globe summary → place back returns to explore (got ${JSON.stringify(action)})`,
  );
}

{
  const action = resolvePlaceCardBack({
    historyIdx: 3,
    prevPath: '/explore?x=1',
    returnTo: null,
    exploreReturnPath: '/explore?x=1',
  });
  assert(action.type === 'history', 'previous entry already explore uses history back');
}

{
  const action = resolvePlaceCardBack({
    historyIdx: 4,
    prevPath: '/place/mokpo',
    returnTo: null,
    exploreReturnPath: '/explore',
  });
  assert(action.type === 'history', 'place-to-place back stays on history');
}

{
  const action = resolvePlaceCardBack({
    historyIdx: 2,
    prevPath: '/',
    returnTo: null,
    exploreReturnPath: null,
  });
  assert(action.type === 'close', 'globe summary without explore snapshot still closes home');
}

{
  const action = resolvePlaceCardBack({
    historyIdx: 2,
    prevPath: '/korea',
    returnTo: '/korea',
    exploreReturnPath: '/explore',
  });
  assert(
    action.type === 'push' && action.path === '/korea' && action.clearReturnTo === true,
    'korea returnTo wins over a stale explore snapshot',
  );
}

{
  const action = resolvePlaceCardBack({
    historyIdx: 1,
    prevPath: null,
    returnTo: null,
    exploreReturnPath: '/explore/asia',
  });
  assert(
    action.type === 'push' && action.path === '/explore/asia',
    'missing history still returns to the explore path',
  );
}

rememberExploreReturn({
  path: '/explore',
  query: '목포',
  disambiguation: { query: '목포', candidates: [{ name: '유달산' }] },
  scrollTop: 240,
});
const saved = peekExploreReturn();
assert(saved?.query === '목포' && saved?.disambiguation?.candidates?.length === 1, 'snapshot keeps the search list');
assert(saved?.scrollTop === 240 && saved.path === '/explore', 'snapshot keeps path and scroll');
clearExploreReturn();
assert(peekExploreReturn() == null, 'clear drops the snapshot');
rememberExploreReturn({ path: '/korea', query: 'x' });
assert(peekExploreReturn() == null, 'non-explore path is not stored');

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nsmoke:place-card-back PASS');

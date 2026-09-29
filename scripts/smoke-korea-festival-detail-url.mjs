/**
 *   npm run smoke:korea-festival-detail-url
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

const hubSrc = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
assert(
  hubSrc.includes('festivalIdFromSearchParams'),
  'Korea hub imports festival URL helpers',
);
assert(
  hubSrc.includes('setSearchParams(next, { replace: false })'),
  'card open pushes festival query',
);
assert(
  hubSrc.includes('setSearchParams(next, { replace: true })'),
  'switch/close uses replace where needed',
);
assert(hubSrc.includes('navigate(-1)'), 'close uses history.back when pushed');
assert(
  hubSrc.includes('festivalDeepLinkSeededForRef'),
  'deep-link history seed ref present',
);
assert(
  !hubSrc.includes('setSelected('),
  'festival detail no longer uses detached selected state',
);

const helperSrc = readFileSync(
  join(root, 'src/pages/Korea/koreaFestivalDetailUrl.js'),
  'utf8',
);
assert(helperSrc.includes("FESTIVAL_QUERY_KEY = 'festival'"), 'festival query key');

if (failed) {
  process.exit(1);
}
console.log('smoke-korea-festival-detail-url: PASS');

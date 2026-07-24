/**
 * areaCode↔hub 해상 스모크 — generate 산출 + runtime resolve 회귀.
 *
 *   npm run smoke:korea-area-codes
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  areaCodeForHubId,
  hubIdsForArea,
  DEFAULT_HUB_SEEDS,
} from '../src/pages/Korea/koreaHubSeeds.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaAreaCodes.json');

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

const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

assert(data.meta?.version === 1, 'json meta.version');
assert(Array.isArray(DEFAULT_HUB_SEEDS) && DEFAULT_HUB_SEEDS.length >= 3, 'DEFAULT_HUB_SEEDS');

const cases = [
  ['1', 'seoul'],
  ['6', 'busan'],
  ['39', 'jeju'],
];

for (const [areaCode, hubId] of cases) {
  const ids = hubIdsForArea(areaCode);
  assert(ids.includes(hubId), `hubIdsForArea(${areaCode}) includes ${hubId}`);
  assert(areaCodeForHubId(hubId) === areaCode, `areaCodeForHubId(${hubId}) === ${areaCode}`);
  assert(
    data.areas?.[areaCode]?.hubIds?.includes(hubId),
    `json areas[${areaCode}] has ${hubId}`,
  );
}

const allIds = hubIdsForArea('all');
assert(allIds.includes('seoul') && allIds.includes('busan') && allIds.includes('jeju'), 'all → seed hubs');

// SSOT 우선: 시드 area는 레거시보다 JSON
assert(hubIdsForArea(1)[0] === 'seoul', 'SSOT priority area 1');
assert(hubIdsForArea(6)[0] === 'busan', 'SSOT priority area 6');
assert(hubIdsForArea(39)[0] === 'jeju', 'SSOT priority area 39');

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-area-codes SMOKE OK');

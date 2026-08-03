/**
 * 방방곡곡 areaCode→hub→place 경로 스모크 (서울/부산/제주).
 *
 *   npm run smoke:korea-theme-regions
 */
import {
  listKoreaThemeAreas,
  listKoreaThemeRegionHubs,
} from '../src/pages/Home/lib/koreaThemeRegions.js';
import { resolveHubPlaceFromSlug } from '../src/pages/Home/lib/cityAttractionHubs.js';
import { hubIdsForArea } from '../src/pages/Korea/koreaHubSeeds.js';

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

const areas = listKoreaThemeAreas();
assert(areas.length >= 16, `areas ≥16 (got ${areas.length})`);

const cases = [
  ['1', 'seoul', '서울'],
  ['6', 'busan', '부산'],
  ['39', 'jeju', '제주'],
];

for (const [areaCode, hubId, label] of cases) {
  const area = areas.find((a) => a.areaCode === areaCode);
  assert(Boolean(area), `${label} area present`);
  assert(area?.name === label || Boolean(area), `${label} name`);

  const ids = hubIdsForArea(areaCode);
  assert(ids.includes(hubId), `hubIdsForArea(${areaCode}) includes ${hubId}`);

  const hubs = listKoreaThemeRegionHubs(areaCode);
  assert(hubs.length >= 1, `${label} hubs ≥1`);
  const hit = hubs.find((h) => h.hubId === hubId);
  assert(Boolean(hit), `${label} list includes ${hubId}`);
  if (!hit) continue;

  assert(hit.placeSlug === hubId, `${hubId} placeSlug`);
  const place = resolveHubPlaceFromSlug(hit.placeSlug);
  assert(Boolean(place), `/place/${hubId} resolves`);
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-theme-regions SMOKE OK');

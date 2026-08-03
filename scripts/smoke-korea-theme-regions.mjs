/**
 * 방방곡곡 areaCode→hub 명소→place 경로 스모크 (서울/부산/제주).
 *
 *   npm run smoke:korea-theme-regions
 */
import {
  listKoreaThemeAreas,
  listKoreaThemeRegionAttractions,
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
  ['1', 'seoul', '서울', '경복궁'],
  ['6', 'busan', '부산', '해운대해수욕장'],
  ['39', 'jeju', '제주', '한라산국립공원'],
];

for (const [areaCode, hubId, label, sampleName] of cases) {
  const area = areas.find((a) => a.areaCode === areaCode);
  assert(Boolean(area), `${label} area present`);

  const ids = hubIdsForArea(areaCode);
  assert(ids.includes(hubId), `hubIdsForArea(${areaCode}) includes ${hubId}`);

  const hubs = listKoreaThemeRegionHubs(areaCode);
  assert(hubs.some((h) => h.hubId === hubId), `${label} hubs include ${hubId}`);

  const attractions = listKoreaThemeRegionAttractions(areaCode);
  assert(attractions.length >= 3, `${label} attractions ≥3 (got ${attractions.length})`);

  const sample = attractions.find((a) => a.name === sampleName);
  assert(Boolean(sample), `${label} list includes ${sampleName}`);
  if (!sample) continue;

  assert(Boolean(sample.placeSlug), `${sampleName} placeSlug`);
  const place = resolveHubPlaceFromSlug(sample.placeSlug);
  assert(Boolean(place), `/place/${sample.placeSlug} resolves (${sampleName})`);
  assert(place?.name === sampleName, `resolved name ${sampleName}`);
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-theme-regions SMOKE OK');

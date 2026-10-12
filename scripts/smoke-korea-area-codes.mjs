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
import {
  matchSido,
  resolveFestivalItemSidoCode,
} from '../src/pages/Korea/koreaAreaFilter.js';
import {
  buildSidoTags,
  detectSidoCode,
  extractCityLabels,
  filterByRegion,
} from '../src/pages/Korea/festivalRegionTags.js';
import { areaCodeFromJeonnamGwangjuIntegratedAddr } from '../src/pages/Home/lib/koreaTourAddrNormalize.js';

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
  ['31', 'suwon'],
  ['32', 'gangneung'],
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
assert(hubIdsForArea(31).includes('gapyeong'), 'SSOT 경기 gapyeong');
assert(hubIdsForArea(32).includes('chuncheon'), 'SSOT 강원 chuncheon');
assert(areaCodeForHubId('sokcho') === '32', 'sokcho → 32');
assert(hubIdsForArea(39)[0] === 'jeju', 'SSOT priority area 39');

const haeundae = '부산광역시 해운대구';
assert(!matchSido(haeundae, '4'), '해운대구 ̸⊂ 대구');
assert(matchSido(haeundae, '6'), '해운대구 ⊂ 부산');
assert(detectSidoCode(haeundae) === '6', 'detectSido 해운대 → 부산');
assert(matchSido('대구광역시 중구', '4'), '대구광역시 ⊂ 대구');
assert(matchSido('대구 수성구', '4'), '단독 대구 ⊂ 대구');

const integratedGwangjuGu = '전남광주통합특별시 서구 중앙로';
const integratedJeonnamSi = '전남광주통합특별시 여수시 선어시장길';
const integratedJeonnamGun = '전남광주통합특별시 함평군';
assert(areaCodeFromJeonnamGwangjuIntegratedAddr(integratedGwangjuGu) === '5', '통합 addr 서구 → 광주');
assert(areaCodeFromJeonnamGwangjuIntegratedAddr(integratedJeonnamSi) === '38', '통합 addr 여수시 → 전남');
assert(areaCodeFromJeonnamGwangjuIntegratedAddr(integratedJeonnamGun) === '38', '통합 addr 함평군 → 전남');
assert(matchSido(integratedGwangjuGu, '5'), 'matchSido 통합 서구 ⊂ 광주');
assert(!matchSido(integratedGwangjuGu, '38'), 'matchSido 통합 서구 ̸⊂ 전남');
assert(matchSido(integratedJeonnamSi, '38'), 'matchSido 통합 여수시 ⊂ 전남');
assert(!matchSido(integratedJeonnamSi, '5'), 'matchSido 통합 여수시 ̸⊂ 광주');
assert(detectSidoCode(integratedGwangjuGu) === '5', 'detectSido 통합 서구');
assert(detectSidoCode(integratedJeonnamGun) === '38', 'detectSido 통합 함평군');
assert(matchSido('경기도 광주시', '31'), '경기 광주시 ⊂ 경기');
assert(!matchSido('경기도 광주시', '5'), '경기 광주시 ̸⊂ 광주광역');
assert(matchSido('광주광역시 북구', '5'), '레거시 광주광역시');
assert(matchSido('전라남도 순천시', '38'), '레거시 전라남도');

assert(
  extractCityLabels(integratedJeonnamSi).includes('여수시'),
  'extractCityLabels 여수시',
);
assert(
  !extractCityLabels(integratedJeonnamSi).some((l) => l.includes('선어')),
  'extractCityLabels no 선어시',
);
assert(
  !extractCityLabels(integratedGwangjuGu).some((l) => l.includes('통합')),
  'extractCityLabels no 통합특별시',
);

const festivalFixture = [
  { addr1: integratedGwangjuGu },
  { addr1: '전남광주통합특별시 북구' },
  { addr1: '전남광주통합특별시 동구' },
  { addr1: integratedJeonnamSi },
  { addr1: integratedJeonnamGun },
  { addr1: '전남광주통합특별시 곡성군' },
  { addr1: '전라남도 나주시' },
  { addr1: '광주광역시 광산구' },
];
const sidoChips = buildSidoTags(festivalFixture, { minCount: 1 });
for (const chip of sidoChips) {
  const filtered = filterByRegion(festivalFixture, { areaCode: chip.id });
  assert(
    filtered.length === chip.count,
    `filterByRegion count === chip ${chip.label} (${chip.count})`,
  );
}

assert(
  resolveFestivalItemSidoCode({ areacode: '38', addr1: integratedGwangjuGu }) === '38',
  'item areacode wins over addr',
);

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-area-codes SMOKE OK');

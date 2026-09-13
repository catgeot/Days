/**
 * 축제 로드(벨트) SSOT audit — schema / hub / phase-1 stops.
 *
 *   npm run audit:korea-festival-belts
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Korea/data/koreaFestivalBelts.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

const PHASE1_BELTS = {
  'gw-north-inland': [
    'chuncheon',
    'cheorwon',
    'yanggu',
    'hwacheon',
    'hongcheon',
    'hoengseong',
  ],
  'gw-east-coast': ['goseong', 'yangyang', 'sokcho', 'gangneung', 'samcheok'],
  'gw-central': ['wonju', 'jeongseon', 'pyeongchang'],
  'gw-west-jungbu': ['wonju', 'jecheon', 'danyang'],
};

const KR_RE = /^(한국|대한민국|korea|south\s*korea|republic of korea)$/i;

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

function isDomesticHub(hub) {
  return KR_RE.test(hub?.country || '') || KR_RE.test(hub?.country_en || '');
}

function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const hubById = new Map();
  for (const h of hubs) {
    if (h?.hubId) hubById.set(String(h.hubId).toLowerCase(), h);
  }

  const belts = data.belts || [];
  assert(data.meta?.version === 1, 'meta.version === 1');
  assert(data.meta?.pilotRegion === 'gangwon', 'meta.pilotRegion === gangwon');
  assert(belts.length === 4, `beltCount === 4 (got ${belts.length})`);

  const byId = new Map();
  let prevOrder = -Infinity;

  for (const belt of belts) {
    const id = String(belt?.id || '');
    assert(Object.hasOwn(PHASE1_BELTS, id), `known phase-1 belt: ${id || '(empty)'}`);
    assert(!byId.has(id), `unique belt id: ${id}`);
    byId.set(id, belt);

    const label = String(belt?.label || '').trim();
    assert(Boolean(label) && label.length <= 40, `${id}: label`);
    const labelEn = String(belt?.labelEn || '').trim();
    assert(Boolean(labelEn) && labelEn.length <= 60, `${id}: labelEn`);

    const order = Number(belt?.order);
    assert(Number.isInteger(order) && order >= 1, `${id}: order integer ≥1`);
    assert(order >= prevOrder, `${id}: sorted by order`);
    prevOrder = order;

    assert(belt?.pilot === true, `${id}: pilot === true`);

    const stops = belt?.stops || [];
    const expected = PHASE1_BELTS[id];
    assert(Array.isArray(stops) && stops.length === expected.length, `${id}: stop count`);
    for (let i = 0; i < expected.length; i += 1) {
      const stop = stops[i];
      const hubId = String(stop?.hubId || '').toLowerCase();
      assert(hubId === expected[i], `${id}: stop[${i}] hubId ${hubId} === ${expected[i]}`);
      assert(stop?.stopIndex === i, `${id}: stop[${i}] stopIndex`);
      assert(Number.isFinite(Number(stop?.lat)), `${id}: stop[${i}] lat`);
      assert(Number.isFinite(Number(stop?.lng)), `${id}: stop[${i}] lng`);
      const hub = hubById.get(hubId);
      assert(Boolean(hub), `${id}: hub exists ${hubId}`);
      if (hub) assert(isDomesticHub(hub), `${id}: hub KR ${hubId}`);
      assert(Boolean(stop?.areaCode), `${id}: stop[${i}] areaCode`);
    }

    if (id === 'gw-west-jungbu') {
      const codes = stops.map((s) => String(s.areaCode));
      assert(codes.includes('32'), `${id}: includes wonju (32)`);
      assert(codes.includes('33'), `${id}: includes chungbuk (33)`);
    } else {
      assert(
        stops.every((s) => String(s.areaCode) === '32'),
        `${id}: all stops areaCode 32`,
      );
    }
  }

  for (const id of Object.keys(PHASE1_BELTS)) {
    assert(byId.has(id), `required belt present: ${id}`);
  }

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(`\nkorea-festival-belts audit PASS — ${belts.length} belts`);
}

main();

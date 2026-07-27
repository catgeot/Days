/**
 * areaCode↔hub SSOT audit — schema / seed / hub 존재.
 *
 *   npm run audit:korea-area-codes
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaAreaCodes.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

const KR_RE = /^(한국|대한민국|korea|south\s*korea|republic of korea)$/i;

/** G0 시드 — 서울·부산·제주 */
const SEED = {
  1: 'seoul',
  6: 'busan',
  39: 'jeju',
};

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
  assert(Array.isArray(hubs), 'cityAttractionHubs is array');

  const hubById = new Map();
  for (const h of hubs) {
    if (h?.hubId) hubById.set(String(h.hubId).toLowerCase(), h);
  }

  const areas = data.areas || {};
  const byHubId = data.byHubId || {};
  const defaults = data.defaultHubIds || [];

  assert(data.meta?.version === 1, 'meta.version === 1');
  assert(Object.keys(areas).length >= 3, `areaCount ≥3 (got ${Object.keys(areas).length})`);
  assert(Array.isArray(defaults) && defaults.length >= 3, 'defaultHubIds ≥3');

  for (const id of defaults) {
    const key = String(id).toLowerCase();
    const hub = hubById.get(key);
    assert(Boolean(hub), `defaultHubId exists: ${key}`);
    if (hub) assert(isDomesticHub(hub), `defaultHubId KR: ${key}`);
  }

  const reverseCheck = new Map();
  for (const [code, entry] of Object.entries(areas)) {
    const areaCode = String(code);
    assert(/^\d{1,10}$/.test(areaCode), `areaCode numeric: ${areaCode}`);
    assert(Boolean(String(entry?.name || '').trim()), `${areaCode}: name`);
    assert(
      Array.isArray(entry?.hubIds) && entry.hubIds.length >= 1,
      `${areaCode}: hubIds non-empty`,
    );
    for (const hubId of entry.hubIds || []) {
      const key = String(hubId).toLowerCase();
      const hub = hubById.get(key);
      assert(Boolean(hub), `${areaCode}: hub exists (${key})`);
      if (hub) assert(isDomesticHub(hub), `${areaCode}: hub KR (${key})`);
      if (reverseCheck.has(key) && reverseCheck.get(key) !== areaCode) {
        assert(false, `hubId collision ${key}: ${reverseCheck.get(key)} vs ${areaCode}`);
      }
      reverseCheck.set(key, areaCode);
      assert(byHubId[key] === areaCode, `byHubId[${key}] === ${areaCode}`);
    }
  }

  for (const [areaCode, hubId] of Object.entries(SEED)) {
    const entry = areas[areaCode];
    assert(Boolean(entry), `seed area ${areaCode} present`);
    assert(
      Array.isArray(entry?.hubIds) && entry.hubIds.includes(hubId),
      `seed ${areaCode} → ${hubId}`,
    );
    assert(byHubId[hubId] === areaCode, `seed byHubId ${hubId} → ${areaCode}`);
  }

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(
    `\nkorea-area-codes audit PASS — ${Object.keys(areas).length} areas, ${Object.keys(byHubId).length} hub links`,
  );
}

main();

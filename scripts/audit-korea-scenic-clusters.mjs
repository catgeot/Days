/**
 * 명소 세권 SSOT audit
 *
 *   npm run audit:korea-scenic-clusters
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaScenicClusters.json',
);
const AREA_PATH = join(__dirname, '../src/pages/Home/data/koreaAreaCodes.json');
const HUBS_PATH = join(
  __dirname,
  '../src/pages/Home/data/cityAttractionHubs.json',
);

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

function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const areasSsot = JSON.parse(readFileSync(AREA_PATH, 'utf8'));
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const hubById = new Map(
    (Array.isArray(hubs) ? hubs : [])
      .filter((h) => h?.hubId)
      .map((h) => [String(h.hubId).toLowerCase(), h]),
  );

  assert(data.meta?.version === 1, 'meta.version === 1');
  const areas = data.areas || {};
  assert(Object.keys(areas).length >= 7, 'clustered areas ≥7');

  // 경기 4세권 잠금
  const gg = areas['31']?.clusters || [];
  assert(gg.length === 4, `경기 clusters=4 (got ${gg.length})`);
  assert(
    gg.map((c) => c.id).join(',') ===
      'gg-north,gg-east,gg-west,gg-south',
    '경기 cluster order 북·동·서·남',
  );

  for (const [code, entry] of Object.entries(areas)) {
    const areaHubs = new Set(
      (areasSsot.areas?.[code]?.hubIds || []).map((h) =>
        String(h).toLowerCase(),
      ),
    );
    const covered = new Set();
    for (const c of entry.clusters || []) {
      assert(Boolean(c.id && c.label), `${code}: cluster id+label`);
      for (const hubId of c.hubIds || []) {
        const key = String(hubId).toLowerCase();
        assert(hubById.has(key), `${code}/${c.id}: hub exists ${key}`);
        assert(areaHubs.has(key), `${code}/${c.id}: hub in area ${key}`);
        assert(!covered.has(key), `${code}: exclusive hub ${key}`);
        covered.add(key);
        const ref = data.byHubId?.[key];
        assert(
          ref?.areaCode === code && ref?.clusterId === c.id,
          `byHubId ${key}`,
        );
      }
    }
    assert(
      covered.size === areaHubs.size,
      `${code}: full cover ${covered.size}/${areaHubs.size}`,
    );
  }

  if (failed) {
    console.error(`\nFAIL audit:korea-scenic-clusters (${failed})`);
    process.exit(1);
  }
  console.log('\nPASS audit:korea-scenic-clusters');
}

main();

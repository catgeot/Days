/**
 * areaCode↔hub SSOT → koreaAreaCodes.json
 *
 *   npm run generate:korea-area-codes
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_AREA_CODE_OVERRIDES } from './data/korea-area-code-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/koreaAreaCodes.json');

/** TourAPI areaCode2 광역시도 */
const KNOWN_SIDO = new Set([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
]);

function assertValidOverrides(src) {
  if (!src || typeof src !== 'object') {
    throw new Error('[korea-area] overrides must be object');
  }
  const defaults = src.defaultHubIds;
  if (!Array.isArray(defaults) || defaults.length < 1) {
    throw new Error('[korea-area] defaultHubIds required (non-empty)');
  }
  for (const id of defaults) {
    if (!String(id || '').trim()) {
      throw new Error('[korea-area] defaultHubIds: empty hubId');
    }
  }

  const areas = src.areas;
  if (!areas || typeof areas !== 'object' || Array.isArray(areas)) {
    throw new Error('[korea-area] areas must be object');
  }

  const byHubId = new Map();
  for (const [code, entry] of Object.entries(areas)) {
    const areaCode = String(code).trim();
    if (!/^\d{1,10}$/.test(areaCode)) {
      throw new Error(`[korea-area] bad areaCode key: ${code}`);
    }
    if (!KNOWN_SIDO.has(areaCode)) {
      throw new Error(`[korea-area] unknown sido areaCode: ${areaCode}`);
    }
    if (!entry || typeof entry !== 'object') {
      throw new Error(`[korea-area] ${areaCode}: entry must be object`);
    }
    const name = String(entry.name || '').trim();
    if (!name || name.length > 40) {
      throw new Error(`[korea-area] ${areaCode}: name required (1–40)`);
    }
    const hubIds = entry.hubIds;
    if (!Array.isArray(hubIds) || hubIds.length < 1) {
      throw new Error(`[korea-area] ${areaCode}: hubIds non-empty array required`);
    }
    const seen = new Set();
    for (const hubId of hubIds) {
      const key = String(hubId || '')
        .trim()
        .toLowerCase();
      if (!key) {
        throw new Error(`[korea-area] ${areaCode}: empty hubId`);
      }
      if (seen.has(key)) {
        throw new Error(`[korea-area] ${areaCode}: dup hubId ${key}`);
      }
      seen.add(key);
      if (byHubId.has(key) && byHubId.get(key) !== areaCode) {
        throw new Error(
          `[korea-area] hubId "${key}" collision: ${byHubId.get(key)} vs ${areaCode}`,
        );
      }
      if (!byHubId.has(key)) byHubId.set(key, areaCode);
    }
  }
  return byHubId;
}

function main() {
  const src = KOREA_AREA_CODE_OVERRIDES;
  const byHubMap = assertValidOverrides(src);

  const areas = {};
  let hubLinkCount = 0;
  for (const [code, entry] of Object.entries(src.areas)) {
    const areaCode = String(code).trim();
    const hubIds = entry.hubIds.map((id) => String(id).trim().toLowerCase());
    hubLinkCount += hubIds.length;
    areas[areaCode] = {
      name: String(entry.name).trim(),
      hubIds,
    };
  }

  const byHubId = {};
  for (const [hubId, areaCode] of byHubMap.entries()) {
    byHubId[hubId] = areaCode;
  }

  const defaultHubIds = src.defaultHubIds.map((id) => String(id).trim().toLowerCase());

  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      areaCount: Object.keys(areas).length,
      hubLinkCount,
      source: 'scripts/data/korea-area-code-overrides.mjs',
    },
    defaultHubIds,
    areas,
    byHubId,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `Wrote ${OUTPUT_PATH} (${payload.meta.areaCount} areas, ${payload.meta.hubLinkCount} hub links)`,
  );
}

main();

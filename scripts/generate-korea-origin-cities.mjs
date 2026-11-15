/**
 * 출발 도시 사전을 로컬 시드 + cityAttractionHubs.json 으로 만든다.
 * 실행 중 API 호출 없음. 한 번 돌려 JSON을 커밋한다.
 *
 *   node scripts/generate-korea-origin-cities.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hangulChoseong } from '../src/utils/hangulSearch.js';
import { KOREA_ORIGIN_CITY_SEED } from './data/korea-origin-city-seed.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HUBS_PATH = join(root, 'src/pages/Home/data/cityAttractionHubs.json');
const OUT_PATH = join(root, 'src/pages/Home/data/koreaOriginCities.json');

function compactName(value) {
  return String(value || '').replace(/\s+/g, '');
}

function hubKey(value) {
  return compactName(value).replace(/(?:특별자치시|특별시|광역시|시|군)$/u, '');
}

function adminAlias(ko, level) {
  if (level === 'metro') {
    if (ko === '서울') return [`${ko}특별시`, `${ko}시`];
    if (ko === '세종') return [`${ko}특별자치시`, `${ko}시`];
    if (ko === '광주') return [`${ko}광역시`];
    return [`${ko}광역시`, `${ko}시`];
  }
  if (level === 'gun') return [`${ko}군`];
  return [`${ko}시`];
}

/**
 * @param {object[]} hubs
 * @param {typeof KOREA_ORIGIN_CITY_SEED} [seed]
 */
export function buildKoreaOriginCities(hubs, seed = KOREA_ORIGIN_CITY_SEED) {
  const koCount = new Map();
  for (const row of seed) {
    koCount.set(row[1], (koCount.get(row[1]) || 0) + 1);
  }

  const hubsByKey = new Map();
  for (const hub of hubs || []) {
    const keys = new Set([hubKey(hub?.name)]);
    for (const alias of hub?.aliases || []) keys.add(hubKey(alias));
    for (const key of keys) {
      if (!key) continue;
      if (!hubsByKey.has(key)) hubsByKey.set(key, []);
      hubsByKey.get(key).push(hub);
    }
  }

  return seed.map((row) => {
    const [id, ko, province, seedEn, seedLat, seedLng, level, hubOriginId, hubRole, extra] = row;
    let en = seedEn;
    let lat = seedLat;
    let lng = seedLng;
    if (koCount.get(ko) === 1) {
      const hits = hubsByKey.get(ko) || [];
      const unique = hits.length === 1 ? hits[0] : null;
      if (unique && Number.isFinite(Number(unique.lat)) && Number.isFinite(Number(unique.lng))) {
        lat = Number(unique.lat);
        lng = Number(unique.lng);
        if (unique.name_en) en = String(unique.name_en);
      }
    }
    const aliases = new Set([
      ko,
      en,
      en.toLowerCase(),
      en.replace(/[\s-]+/g, '').toLowerCase(),
      seedEn,
      seedEn.toLowerCase(),
      seedEn.replace(/[\s-]+/g, '').toLowerCase(),
    ]);
    for (const alias of adminAlias(ko, level)) aliases.add(alias);
    for (const alias of String(extra || '').split('|')) {
      const bit = alias.trim();
      if (bit) aliases.add(bit);
    }
    return {
      id,
      ko,
      province,
      en,
      aliases: [...aliases],
      choseong: hangulChoseong(ko),
      lat,
      lng,
      hubOriginId: hubOriginId || null,
      hubRole: hubRole || null,
    };
  });
}

function writeCities() {
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const cities = buildKoreaOriginCities(hubs);
  if (cities.length !== 167) {
    throw new Error(`expected 167 si/gun cities, got ${cities.length}`);
  }
  writeFileSync(OUT_PATH, `${JSON.stringify(cities, null, 2)}\n`);
  console.log(`wrote ${cities.length} cities → ${OUT_PATH}`);
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entry) writeCities();

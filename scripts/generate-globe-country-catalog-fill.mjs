/**
 * 지구본 나라 카탈로그 — 누락 UN 회원국 채움 + LABEL 맵 재생성.
 * 기존 큐레이션 엔트리(하와이·알래스카·영국 구성국 등)는 유지.
 *
 * 입력: /tmp/mledoze.json · /tmp/world-110m.json (스크립트 밖 준비)
 * 출력: src/pages/Home/lib/globeCountryCatalog.js 덮어쓰기
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoBounds, geoCentroid } from 'd3-geo';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'src/pages/Home/lib/globeCountryCatalog.js');

const mledozePath = '/tmp/mledoze.json';
const topoPath = '/tmp/world-110m.json';
if (!fs.existsSync(mledozePath) || !fs.existsSync(topoPath)) {
  console.error('Need', mledozePath, 'and', topoPath);
  process.exit(1);
}

const mledoze = require(mledozePath);
const topo = require(topoPath);
const feats = feature(topo, topo.objects.countries).features;
const featByNum = new Map(feats.map((f) => [String(Number(f.id)), f]));

/** @type {Record<string, object>} */
const { GLOBE_COUNTRY_CATALOG: existing } = await import(
  path.join(root, 'src/pages/Home/lib/globeCountryCatalog.js')
);

const existingIso = new Set(Object.values(existing).map((c) => c.iso));

function zoomFromArea(area) {
  if (!area || area <= 0) return 7;
  if (area < 500) return 9.5;
  if (area < 5000) return 8;
  if (area < 50000) return 6.5;
  if (area < 200000) return 5.6;
  if (area < 1000000) return 4.8;
  if (area < 5000000) return 3.8;
  return 3.0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function bboxFromLatLngArea(lat, lng, area) {
  const side = Math.sqrt(Math.max(area || 10000, 100)) / 111;
  const half = Math.min(Math.max(side / 2, 0.4), 18);
  return [
    round1(lng - half),
    round1(Math.max(-85, lat - half)),
    round1(lng + half),
    round1(Math.min(85, lat + half)),
  ];
}

function buildEntry(c) {
  const id = c.cca2.toLowerCase();
  const labelKo = LABEL_KO_OVERRIDES[id] || c.translations?.kor?.common || c.name.common;
  const [lat0, lng0] = c.latlng || [0, 0];
  let lat = lat0;
  let lng = lng0;
  let bbox;
  const f = featByNum.get(String(Number(c.ccn3)));
  if (f) {
    const [w, s] = geoBounds(f)[0];
    const [e, n] = geoBounds(f)[1];
    bbox = [round1(w), round1(s), round1(e), round1(n)];
    const cen = geoCentroid(f);
    if (Number.isFinite(cen[0]) && Number.isFinite(cen[1])) {
      lng = round1(cen[0]);
      lat = round1(cen[1]);
    }
  } else {
    bbox = bboxFromLatLngArea(lat, lng, c.area);
    lat = round1(lat);
    lng = round1(lng);
  }
  return {
    id,
    labelKo,
    iso: c.cca2,
    lat,
    lng,
    zoom: zoomFromArea(c.area),
    bbox,
  };
}

const extras = ['VA', 'PS', 'XK'];
const toAdd = mledoze.filter((c) => {
  if (!c.cca2 || c.cca2.length !== 2) return false;
  if (existingIso.has(c.cca2)) return false;
  if (c.unMember) return true;
  return extras.includes(c.cca2);
});

const catalog = { ...existing };
for (const c of toAdd) {
  const entry = buildEntry(c);
  if (catalog[entry.id]) continue;
  catalog[entry.id] = entry;
}

const labelMap = {};
for (const entry of Object.values(catalog)) {
  labelMap[entry.labelKo] = entry.id;
}
// 기존 별칭 유지
const ALIASES = {
  '남아프리카공화국': 'za',
  '스발바르 제도': 'sj',
  '터키': 'tr',
};

/** mledoze 한글명 오역·혼동 교정 */
const LABEL_KO_OVERRIDES = {
  dm: '도미니카',
};
Object.assign(labelMap, ALIASES);

function serializeEntry(e) {
  const parts = [
    `id: ${JSON.stringify(e.id)}`,
    `labelKo: ${JSON.stringify(e.labelKo)}`,
    `iso: ${JSON.stringify(e.iso)}`,
  ];
  if (e.iso3166_2) parts.push(`iso3166_2: ${JSON.stringify(e.iso3166_2)}`);
  parts.push(`lat: ${e.lat}`, `lng: ${e.lng}`, `zoom: ${e.zoom}`);
  parts.push(`bbox: [${e.bbox.join(', ')}]`);
  if (e.hubBbox) parts.push(`hubBbox: [${e.hubBbox.join(', ')}]`);
  return `  ${JSON.stringify(e.id)}: { ${parts.join(', ')} }`;
}

const sortedIds = Object.keys(catalog).sort((a, b) =>
  catalog[a].labelKo.localeCompare(catalog[b].labelKo, 'ko'),
);
const catalogBody = sortedIds.map((id) => serializeEntry(catalog[id])).join(',\n');
const labelBody = Object.keys(labelMap)
  .sort((a, b) => a.localeCompare(b, 'ko'))
  .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(labelMap[k])}`)
  .join(',\n');

const file = `/** 지구본 나라 카탈로그 SSOT — flyTo·하이라이트 단일 소스 */

/**
 * @typedef {{
 *   id: string,
 *   labelKo: string,
 *   iso: string,
 *   iso3166_2?: string,
 *   lat: number,
 *   lng: number,
 *   zoom: number,
 *   bbox: [number, number, number, number],
 *   hubBbox?: [number, number, number, number],
 * }} GlobeFaceRegion
 */

/** @type {Record<string, GlobeFaceRegion>} */
export const GLOBE_COUNTRY_CATALOG = {
${catalogBody},
};

/** travelSpots.country → catalog id */
export const GLOBE_COUNTRY_LABEL_TO_ID = {
${labelBody},
};

export function getGlobeCountryById(id) {
  if (!id) return null;
  return GLOBE_COUNTRY_CATALOG[id] || null;
}

export function resolveGlobeCountryIdFromLabel(label) {
  if (!label) return null;
  const trimmed = String(label).trim();
  if (GLOBE_COUNTRY_LABEL_TO_ID[trimmed]) return GLOBE_COUNTRY_LABEL_TO_ID[trimmed];
  const hit = Object.values(GLOBE_COUNTRY_CATALOG).find((c) => c.labelKo === trimmed);
  return hit?.id || null;
}
`;

fs.writeFileSync(outPath, file, 'utf8');
console.log('wrote', outPath);
console.log('added', toAdd.length, 'total', sortedIds.length);
console.log(
  'added ids',
  toAdd.map((c) => c.cca2.toLowerCase()).sort().join(' '),
);

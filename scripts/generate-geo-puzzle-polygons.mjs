/**
 * geo-countries GeoJSON → 캠페인 국가 지도 필용 간소화 폴리곤 SSOT
 * Usage: node scripts/generate-geo-puzzle-polygons.mjs [/path/to/countries.geojson]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GEO_PUZZLE_CONTINENTS, listContinentCountryIds } from '../src/pages/PlayGeo/data/geoPuzzleTree.js';
import { GLOBE_COUNTRY_CATALOG } from '../src/pages/Home/lib/globeCountryCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/pages/PlayGeo/data/geoPuzzleCountryPolygons.js');

const ISO_ALIASES = {
  TW: ['TW', 'CN-TW', 'TWN'],
  FR: ['FR'],
};

function featureIso(props = {}) {
  const raw = String(props['ISO3166-1-Alpha-2'] || props.ISO_A2 || props.iso_a2 || '').toUpperCase();
  if (raw && raw !== '-99') return raw;
  const wb = String(props.WB_A2 || props.wb_a2 || '').toUpperCase();
  if (wb && wb !== '-99') return wb;
  return raw;
}

function ringArea(ring) {
  if (!ring || ring.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(a / 2);
}

function simplifyRing(ring, maxPoints) {
  if (!ring || ring.length <= maxPoints) return ring;
  const step = Math.ceil(ring.length / maxPoints);
  const out = [];
  for (let i = 0; i < ring.length; i += step) out.push(ring[i]);
  const first = ring[0];
  const last = out[out.length - 1];
  if (!last || last[0] !== first[0] || last[1] !== first[1]) out.push([...first]);
  return out;
}

function roundRing(ring) {
  return ring.map(([lng, lat]) => [
    Math.round(lng * 1000) / 1000,
    Math.round(lat * 1000) / 1000,
  ]);
}

function simplifyGeometry(geometry) {
  if (!geometry) return null;
  const { type, coordinates } = geometry;
  if (type === 'Polygon') {
    const outer = coordinates?.[0];
    if (!outer) return null;
    const area = ringArea(outer);
    const maxPts = area > 80 ? 72 : area > 8 ? 48 : area > 0.5 ? 32 : 20;
    const ring = roundRing(simplifyRing(outer, maxPts));
    if (!ring || ring.length < 4) return null;
    return { type: 'Polygon', coordinates: [ring] };
  }
  if (type === 'MultiPolygon') {
    // 작은 섬·조각까지 외곽선을 그리면 필 안쪽에 선이 겹쳐 지저분해짐 → 본토·주요 섬만
    const scored = (coordinates || [])
      .map((poly) => {
        const outer = poly?.[0];
        return { poly, area: ringArea(outer) };
      })
      .filter((p) => p.area > 0)
      .sort((a, b) => b.area - a.area);
    const maxArea = scored[0]?.area || 0;
    const kept = scored
      .filter((p, idx) => idx === 0 || p.area / maxArea >= 0.005)
      .slice(0, 8);
    const polys = [];
    for (const { poly, area } of kept) {
      const maxOuter = area > 80 ? 72 : area > 8 ? 48 : area > 0.5 ? 32 : 18;
      const outer = poly?.[0];
      if (!outer) continue;
      // 외곽 링만 (호수·구멍 링은 주황 내부선으로 보임)
      const ring = roundRing(simplifyRing(outer, maxOuter));
      if (ring && ring.length >= 4) polys.push([ring]);
    }
    if (!polys.length) return null;
    if (polys.length === 1) return { type: 'Polygon', coordinates: polys[0] };
    return { type: 'MultiPolygon', coordinates: polys };
  }
  if (type === 'GeometryCollection') {
    const parts = [];
    for (const g of geometry.geometries || []) {
      const simp = simplifyGeometry(g);
      if (!simp) continue;
      if (simp.type === 'Polygon') parts.push(simp.coordinates);
      else if (simp.type === 'MultiPolygon') parts.push(...simp.coordinates);
    }
    if (!parts.length) return null;
    if (parts.length === 1) return { type: 'Polygon', coordinates: parts[0] };
    return { type: 'MultiPolygon', coordinates: parts };
  }
  return null;
}

const srcPath = process.argv[2] || '/tmp/countries.geojson';
if (!fs.existsSync(srcPath)) {
  console.error('GeoJSON not found:', srcPath);
  process.exit(1);
}

const gj = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const byIso = new Map();
for (const f of gj.features || []) {
  const iso = featureIso(f.properties);
  if (!iso || iso === '-99') continue;
  if (!byIso.has(iso)) byIso.set(iso, f);
}

const ids = [...new Set(GEO_PUZZLE_CONTINENTS.flatMap((c) => listContinentCountryIds(c)))];
const polygons = {};
const missing = [];

for (const id of ids) {
  const country = GLOBE_COUNTRY_CATALOG[id];
  if (!country?.iso) {
    missing.push(id);
    continue;
  }
  const aliases = ISO_ALIASES[country.iso] || [country.iso];
  let feature = null;
  for (const a of aliases) {
    feature = byIso.get(a);
    if (feature) break;
  }
  if (!feature && country.iso === 'TW') {
    feature = [...byIso.values()].find((f) => /taiwan/i.test(f.properties?.NAME || f.properties?.name || ''));
  }
  if (!feature && country.iso === 'FR') {
    feature = (gj.features || []).find((f) => {
      const p = f.properties || {};
      return /^france$/i.test(String(p.ADMIN || p.NAME || p.name || ''));
    });
  }
  if (!feature) {
    missing.push(`${id}:${country.iso}`);
    continue;
  }
  const geometry = simplifyGeometry(feature.geometry);
  if (!geometry) {
    missing.push(`${id}:empty`);
    continue;
  }
  polygons[id] = geometry;
}

const body = `/** Generated by scripts/generate-geo-puzzle-polygons.mjs — do not hand-edit */
export const GEO_PUZZLE_COUNTRY_POLYGONS = ${JSON.stringify(polygons)};

/** @param {string} countryId */
export function getGeoPuzzleCountryPolygon(countryId) {
  return GEO_PUZZLE_COUNTRY_POLYGONS[countryId] || null;
}
`;

fs.writeFileSync(outPath, body);
const bytes = fs.statSync(outPath).size;
console.log('wrote', outPath, 'countries', Object.keys(polygons).length, 'bytes', bytes);
if (missing.length) console.warn('missing', missing);
if (missing.length) process.exitCode = 1;

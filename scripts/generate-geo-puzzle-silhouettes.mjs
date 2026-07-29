/**
 * geo-countries GeoJSON → 캠페인 국가 SVG 실루엣 SSOT
 * Usage: node scripts/generate-geo-puzzle-silhouettes.mjs [/path/to/countries.geojson]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GEO_PUZZLE_CONTINENTS, listContinentCountryIds } from '../src/pages/PlayGeo/data/geoPuzzleTree.js';
import { GLOBE_COUNTRY_CATALOG } from '../src/pages/Home/lib/globeCountryCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/pages/PlayGeo/data/geoPuzzleSilhouettes.js');

const ISO_ALIASES = {
  TW: ['TW', 'CN-TW', 'TWN'],
};

function featureIso(props = {}) {
  return String(props['ISO3166-1-Alpha-2'] || props.ISO_A2 || props.iso_a2 || '').toUpperCase();
}

function flattenCoords(geometry, out = []) {
  if (!geometry) return out;
  const { type, coordinates } = geometry;
  if (type === 'Polygon') {
    for (const ring of coordinates || []) out.push(ring);
  } else if (type === 'MultiPolygon') {
    for (const poly of coordinates || []) {
      for (const ring of poly || []) out.push(ring);
    }
  } else if (type === 'GeometryCollection') {
    for (const g of geometry.geometries || []) flattenCoords(g, out);
  }
  return out;
}

/** 경도 점프가 큰 링은 날짜변경선 기준으로 재정렬하지 않고 bbox만 안정화 */
function normalizeRingLng(ring) {
  if (!ring?.length) return ring;
  const lngs = ring.map((c) => c[0]);
  const min = Math.min(...lngs);
  const max = Math.max(...lngs);
  if (max - min <= 180) return ring;
  return ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat]);
}

function simplifyRing(ring, maxPoints = 28) {
  if (!ring || ring.length <= maxPoints) return ring;
  const step = Math.ceil(ring.length / maxPoints);
  const out = [];
  for (let i = 0; i < ring.length; i += step) out.push(ring[i]);
  const first = ring[0];
  const last = out[out.length - 1];
  if (!last || last[0] !== first[0] || last[1] !== first[1]) out.push(first);
  return out;
}

function ringsToSvg(rings) {
  const scored = rings
    .map(normalizeRingLng)
    .filter((r) => r && r.length >= 4)
    .map((r) => {
      const xs = r.map((c) => c[0]);
      const ys = r.map((c) => c[1]);
      const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      return { ring: simplifyRing(r, area > 40 ? 36 : area > 5 ? 24 : 14), area };
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, 10);
  const norm = scored.length ? scored.map((s) => s.ring) : rings.map(normalizeRingLng).map((r) => simplifyRing(r, 20));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of norm) {
    for (const [lng, lat] of ring) {
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      minX = Math.min(minX, lng);
      maxX = Math.max(maxX, lng);
      minY = Math.min(minY, lat);
      maxY = Math.max(maxY, lat);
    }
  }
  if (!Number.isFinite(minX)) return null;

  const pad = 0.06;
  const w = Math.max(maxX - minX, 0.05);
  const h = Math.max(maxY - minY, 0.05);
  const vb = 100;
  const scale = (1 - pad * 2) * vb / Math.max(w, h);
  const ox = (vb - w * scale) / 2;
  const oy = (vb - h * scale) / 2;

  const project = (lng, lat) => {
    const x = ox + (lng - minX) * scale;
    const y = oy + (maxY - lat) * scale;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  };

  const parts = [];
  for (const ring of norm) {
    if (!ring.length) continue;
    const [x0, y0] = project(ring[0][0], ring[0][1]);
    let d = `M${x0} ${y0}`;
    for (let i = 1; i < ring.length; i += 1) {
      const [x, y] = project(ring[i][0], ring[i][1]);
      d += `L${x} ${y}`;
    }
    d += 'Z';
    parts.push(d);
  }
  return { viewBox: '0 0 100 100', d: parts.join('') };
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
const silhouettes = {};
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
    feature = [...byIso.values()].find((f) => /taiwan/i.test(f.properties?.name || ''));
  }
  if (!feature) {
    missing.push(`${id}:${country.iso}`);
    continue;
  }
  const rings = flattenCoords(feature.geometry);
  const svg = ringsToSvg(rings);
  if (!svg) {
    missing.push(`${id}:empty`);
    continue;
  }
  silhouettes[id] = svg;
}

const body = `/** Generated by scripts/generate-geo-puzzle-silhouettes.mjs — do not hand-edit */
export const GEO_PUZZLE_SILHOUETTES = ${JSON.stringify(silhouettes, null, 2)};

export function getGeoPuzzleSilhouette(countryId) {
  return GEO_PUZZLE_SILHOUETTES[countryId] || null;
}
`;

fs.writeFileSync(outPath, body);
console.log('wrote', outPath, 'countries', Object.keys(silhouettes).length);
if (missing.length) console.warn('missing', missing);

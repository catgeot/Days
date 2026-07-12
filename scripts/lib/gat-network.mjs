/**
 * wikipediaGATN global-air-pax-network.csv → gateway outbound Sets (build-time only).
 * Lookup extraction only — no adjacency BFS / path inference.
 *
 * @see https://github.com/julien-arino/wikipediaGATN
 * @see plans/flight-route-heuristic-ssot-plan.md Phase 3
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isValidIata, normalizeIata } from './ourairports.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const GATN_CSV_URL =
  'https://raw.githubusercontent.com/julien-arino/wikipediaGATN/main/data/public/global-air-pax-network.csv';

export const GATN_CSV_CACHE_PATH = join(__dirname, '../data/cache/gatn-global-air-pax-network.csv');

/**
 * Thin-seed origins — macro hubs + long-haul/Pacific gateways from Phase 3 plan.
 * Keep small: outbound Sets only (not full graph).
 */
export const GATEWAY_SEED_ORIGINS = Object.freeze([
  'ICN',
  'NRT',
  'HND',
  'KIX',
  'PVG',
  'PEK',
  'HKG',
  'SIN',
  'BKK',
  'KUL',
  'DXB',
  'DOH',
  'ADD',
  'IST',
  'FRA',
  'CDG',
  'AMS',
  'LHR',
  'HEL',
  'CPH',
  'LAX',
  'SFO',
  'SEA',
  'JFK',
  'ATL',
  'YVR',
  'SYD',
  'AKL',
  'MEL',
  'BNE',
  'HNL',
  'PPT',
  'RAR',
  'NAN',
  'JNB',
  'NBO',
  'CAI',
]);

/**
 * Minimal RFC4180-ish CSV line parser (quoted fields, commas inside quotes).
 * @param {string} line
 * @returns {string[]}
 */
export function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      fields.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  fields.push(cur);
  return fields;
}

/**
 * @param {string} token
 * @returns {boolean}
 */
function isUsableOutlink(token) {
  const t = String(token || '').trim();
  if (!t) return false;
  // GATN parse artifacts / non-IATA (seaplane ids, MagicMock, dotted codes)
  if (/mock/i.test(t)) return false;
  if (t.includes('.') || t.includes('_') || t.includes('-')) return false;
  return isValidIata(t);
}

/**
 * Parse full GATN CSV text → Map<originIata, Set<destIata>> for all valid 3-letter rows.
 * Callers should filter to GATEWAY_SEED_ORIGINS.
 *
 * @param {string} text
 * @returns {Map<string, Set<string>>}
 */
export function parseGatnCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const adj = new Map();
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (i === 0 && /origin/i.test(line) && /outlinks/i.test(line)) continue;

    const fields = parseCsvLine(line);
    if (fields.length < 3) continue;

    const origin = normalizeIata(fields[0]);
    if (!origin || !isValidIata(origin)) continue;

    const outlinksRaw = String(fields[2] ?? '').trim();
    if (!outlinksRaw) {
      if (!adj.has(origin)) adj.set(origin, new Set());
      continue;
    }

    if (!adj.has(origin)) adj.set(origin, new Set());
    const destSet = adj.get(origin);
    for (const token of outlinksRaw.split(/\s+/)) {
      if (!isUsableOutlink(token)) continue;
      const dest = normalizeIata(token);
      if (!dest || dest === origin) continue;
      destSet.add(dest);
    }
  }
  return adj;
}

/**
 * Filter full adjacency to gateway origins only → plain object of sorted arrays.
 *
 * @param {Map<string, Set<string>>} adj
 * @param {Iterable<string>} [origins]
 * @returns {Record<string, string[]>}
 */
export function extractGatewayOutbound(adj, origins = GATEWAY_SEED_ORIGINS) {
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const raw of origins) {
    const origin = normalizeIata(raw);
    if (!origin || !isValidIata(origin)) continue;
    const set = adj.get(origin);
    out[origin] = set ? [...set].sort() : [];
  }
  return out;
}

export async function fetchGatnCsv() {
  const res = await fetch(GATN_CSV_URL);
  if (!res.ok) {
    throw new Error(`GATN download failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

export function readCachedGatnCsv() {
  if (!existsSync(GATN_CSV_CACHE_PATH)) return null;
  return readFileSync(GATN_CSV_CACHE_PATH, 'utf8');
}

/**
 * @param {{ skipDownload?: boolean }} [options]
 */
export async function loadGatnCsv({ skipDownload = false } = {}) {
  let text = skipDownload ? readCachedGatnCsv() : null;
  if (!text) {
    text = await fetchGatnCsv();
    mkdirSync(dirname(GATN_CSV_CACHE_PATH), { recursive: true });
    writeFileSync(GATN_CSV_CACHE_PATH, text, 'utf8');
  }
  return text;
}

/**
 * @param {{ skipDownload?: boolean, origins?: string[] }} [options]
 */
export async function buildGatewaySeed({ skipDownload = false, origins } = {}) {
  const text = await loadGatnCsv({ skipDownload });
  const adj = parseGatnCsv(text);
  const gateways = extractGatewayOutbound(adj, origins ?? GATEWAY_SEED_ORIGINS);
  const edgeCount = Object.values(gateways).reduce((n, arr) => n + arr.length, 0);
  return {
    gateways,
    meta: {
      sourceUrl: GATN_CSV_URL,
      originCount: Object.keys(gateways).length,
      edgeCount,
      missingOrigins: Object.entries(gateways)
        .filter(([, arr]) => arr.length === 0)
        .map(([k]) => k),
    },
  };
}

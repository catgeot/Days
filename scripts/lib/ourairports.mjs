/**
 * OurAirports CSV fetch · parse · IATA dedupe (shared by import + index generate).
 * @see https://ourairports.com/data/
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { RENTAL_AIRPORT_HUBS } from '../../src/utils/rentalAirportHubs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OURAIRPORTS_CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
export const OURAIRPORTS_CACHE_PATH = join(__dirname, '../data/cache/ourairports-airports.csv');

/** Major transit hubs — corridor·OpenFlights tier-1 seed */
export const TIER_1_TRANSIT_HUBS = new Set([
  'ATL', 'AMS', 'AUH', 'BKK', 'BRU', 'CAN', 'CDG', 'CPH', 'DEN', 'DFW', 'DOH', 'DXB',
  'FRA', 'HEL', 'HKG', 'HND', 'HNL', 'ICN', 'IST', 'JFK', 'KUL', 'LAX', 'LHR', 'MAD',
  'MEL', 'MUC', 'NRT', 'ORD', 'PEK', 'PVG', 'SHA', 'SIN', 'SYD', 'VIE', 'YVR', 'YYZ',
  'ZRH', 'FCO', 'SFO', 'SEA', 'DUB', 'WAW', 'PRG', 'BUD', 'OSL', 'ARN', 'LIS',
]);

const TYPE_RANK = {
  large_airport: 4,
  medium_airport: 3,
  small_airport: 2,
  seaplane_base: 1,
  heliport: 0,
};

const rentalKoByIata = new Map(
  RENTAL_AIRPORT_HUBS.map((h) => [h.iata, h.officialKo])
);
const rentalIataSet = new Set(RENTAL_AIRPORT_HUBS.map((h) => h.iata));

export function isValidIata(code) {
  return /^[A-Z]{3}$/.test(String(code || '').trim().toUpperCase());
}

export function normalizeIata(code) {
  const upper = String(code || '').trim().toUpperCase();
  return isValidIata(upper) ? upper : '';
}

/** @param {string} line */
function parseCsvLine(line) {
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
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

/**
 * @param {string} text full CSV
 * @returns {Record<string, string>[]}
 */
export function parseAirportsCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = fields[j] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function rowScore(row) {
  const scheduled = row.scheduled_service === 'yes' ? 10 : 0;
  const rank = TYPE_RANK[row.type] ?? 0;
  return scheduled + rank;
}

/**
 * Dedupe by IATA — prefer scheduled_service + larger airport type.
 * @param {Record<string, string>[]} rows
 * @returns {Map<string, Record<string, string>>}
 */
export function dedupeByIata(rows) {
  const byIata = new Map();
  for (const row of rows) {
    const iata = normalizeIata(row.iata_code);
    if (!iata) continue;
    const existing = byIata.get(iata);
    if (!existing || rowScore(row) > rowScore(existing)) {
      byIata.set(iata, { ...row, iata_code: iata });
    }
  }
  return byIata;
}

/**
 * @param {Record<string, string>} row
 */
export function mapRowToAirportRecord(row) {
  const iata = normalizeIata(row.iata_code);
  const lat = Number(row.latitude_deg);
  const lng = Number(row.longitude_deg);
  if (!iata || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const nameKo = rentalKoByIata.get(iata) ?? null;
  let hubTier = null;
  let isTransitHub = false;
  if (TIER_1_TRANSIT_HUBS.has(iata)) {
    hubTier = 1;
    isTransitHub = true;
  } else if (rentalIataSet.has(iata)) {
    hubTier = 2;
    isTransitHub = true;
  }

  const elevation = row.elevation_ft ? Number(row.elevation_ft) : null;

  return {
    id: Number(row.id),
    ident: row.ident || iata,
    type: row.type || 'unknown',
    name: row.name || iata,
    latitude_deg: lat,
    longitude_deg: lng,
    elevation_ft: Number.isFinite(elevation) ? elevation : null,
    continent: row.continent || null,
    iso_country: row.iso_country || 'XX',
    iso_region: row.iso_region || null,
    municipality: row.municipality || null,
    scheduled_service: row.scheduled_service === 'yes' ? 'yes' : 'no',
    icao_code: row.icao_code || null,
    iata_code: iata,
    gps_code: row.gps_code || null,
    local_code: row.local_code || null,
    home_link: row.home_link || null,
    wikipedia_link: row.wikipedia_link || null,
    keywords: row.keywords || null,
    name_ko: nameKo,
    is_transit_hub: isTransitHub,
    hub_tier: hubTier,
  };
}

/**
 * @param {Map<string, Record<string, string>>} byIata
 */
export function buildAirportRecords(byIata) {
  const records = [];
  for (const row of byIata.values()) {
    const rec = mapRowToAirportRecord(row);
    if (rec) records.push(rec);
  }
  return records;
}

export async function fetchOurAirportsCsv() {
  const res = await fetch(OURAIRPORTS_CSV_URL);
  if (!res.ok) {
    throw new Error(`OurAirports download failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

export function readCachedOurAirportsCsv() {
  if (!existsSync(OURAIRPORTS_CACHE_PATH)) return null;
  return readFileSync(OURAIRPORTS_CACHE_PATH, 'utf8');
}

export async function loadOurAirportsRecords({ skipDownload = false } = {}) {
  let text = skipDownload ? readCachedOurAirportsCsv() : null;
  if (!text) {
    text = await fetchOurAirportsCsv();
    mkdirSync(dirname(OURAIRPORTS_CACHE_PATH), { recursive: true });
    writeFileSync(OURAIRPORTS_CACHE_PATH, text, 'utf8');
  }
  const rows = parseAirportsCsv(text);
  const byIata = dedupeByIata(rows);
  return buildAirportRecords(byIata);
}

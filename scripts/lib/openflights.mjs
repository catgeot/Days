/**
 * OpenFlights routes.dat fetch · parse · dedupe (shared by import + resolver).
 * @see https://openflights.org/data.html
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isValidIata, normalizeIata } from './ourairports.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OPENFLIGHTS_ROUTES_URL =
  'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';
export const OPENFLIGHTS_ROUTES_CACHE_PATH = join(__dirname, '../data/cache/openflights-routes.dat');

/** @param {string} value */
function parseField(value) {
  const v = String(value ?? '').trim();
  if (!v || v === '\\N' || v === 'N') return null;
  return v;
}

/**
 * @param {string} text full routes.dat
 * @returns {Array<{ airline: string | null, airlineId: number | null, sourceIata: string, sourceAirportId: number | null, destIata: string, destAirportId: number | null, codeshare: string | null, stops: number, equipment: string | null }>}
 */
export function parseRoutesDat(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const routes = [];

  for (const line of lines) {
    const fields = line.split(',');
    if (fields.length < 8) continue;

    const sourceIata = normalizeIata(parseField(fields[2]));
    const destIata = normalizeIata(parseField(fields[4]));
    if (!sourceIata || !destIata || sourceIata === destIata) continue;

    const airlineIdRaw = parseField(fields[1]);
    const sourceAirportIdRaw = parseField(fields[3]);
    const destAirportIdRaw = parseField(fields[5]);
    const stopsRaw = parseField(fields[7]);

    routes.push({
      airline: parseField(fields[0]),
      airlineId: airlineIdRaw ? Number(airlineIdRaw) : null,
      sourceIata,
      sourceAirportId: sourceAirportIdRaw ? Number(sourceAirportIdRaw) : null,
      destIata,
      destAirportId: destAirportIdRaw ? Number(destAirportIdRaw) : null,
      codeshare: parseField(fields[6]),
      stops: Number.isFinite(Number(stopsRaw)) ? Number(stopsRaw) : 0,
      equipment: parseField(fields[8]),
    });
  }

  return routes;
}

/**
 * Collapse duplicate legs — keep one representative row per (source, dest, airline).
 * @param {ReturnType<typeof parseRoutesDat>} routes
 */
export function dedupeRouteLegs(routes) {
  const seen = new Set();
  const out = [];
  for (const route of routes) {
    const key = `${route.sourceIata}|${route.destIata}|${route.airline ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(route);
  }
  return out;
}

/**
 * @param {ReturnType<typeof parseRoutesDat>} routes
 * @returns {Map<string, Set<string>>}
 */
export function buildRouteAdjacency(routes) {
  const adj = new Map();
  const addEdge = (from, to) => {
    if (!isValidIata(from) || !isValidIata(to) || from === to) return;
    if (!adj.has(from)) adj.set(from, new Set());
    adj.get(from).add(to);
  };

  for (const route of routes) {
    addEdge(route.sourceIata, route.destIata);
  }
  return adj;
}

export async function fetchOpenFlightsRoutesDat() {
  const res = await fetch(OPENFLIGHTS_ROUTES_URL);
  if (!res.ok) {
    throw new Error(`OpenFlights download failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

export function readCachedOpenFlightsRoutesDat() {
  if (!existsSync(OPENFLIGHTS_ROUTES_CACHE_PATH)) return null;
  return readFileSync(OPENFLIGHTS_ROUTES_CACHE_PATH, 'utf8');
}

/**
 * @param {{ skipDownload?: boolean }} [options]
 */
export async function loadOpenFlightsRoutes({ skipDownload = false } = {}) {
  let text = skipDownload ? readCachedOpenFlightsRoutesDat() : null;
  if (!text) {
    text = await fetchOpenFlightsRoutesDat();
    mkdirSync(dirname(OPENFLIGHTS_ROUTES_CACHE_PATH), { recursive: true });
    writeFileSync(OPENFLIGHTS_ROUTES_CACHE_PATH, text, 'utf8');
  }
  const parsed = parseRoutesDat(text);
  return dedupeRouteLegs(parsed);
}

/**
 * @param {ReturnType<typeof parseRoutesDat>} routes
 */
export function mapRouteToDbRow(route) {
  return {
    airline: route.airline,
    airline_id: route.airlineId,
    source_iata: route.sourceIata,
    source_airport_id: route.sourceAirportId,
    dest_iata: route.destIata,
    dest_airport_id: route.destAirportId,
    codeshare: route.codeshare,
    stops: route.stops,
    equipment: route.equipment,
  };
}

/**
 * ICN-centric OpenFlights graph resolver — max 2 hub hops (3 legs).
 * Phase 2 precompute SSOT · Phase 3 Edge reuse candidate.
 * v2: geo·권역 scoring — flightRouteGeoRules.js
 */
import {
  estimateFlightHours,
  getAirportHubCoords,
  MAX_FLIGHT_LEG_HOURS,
} from '../../src/pages/Home/lib/globeFlightCinema.js';
import {
  filterSuspiciousGraphDirect,
  scoreFlightPathV2,
  TIER_1_TRANSIT_HUBS,
} from '../../src/pages/Home/lib/flightRouteGeoRules.js';
import { loadOurAirportsRecords } from './ourairports.mjs';
import { buildRouteAdjacency, loadOpenFlightsRoutes } from './openflights.mjs';
import { createSupabaseScriptClient, loadEnvFile } from './supabase-script-env.mjs';

export const DEFAULT_ORIGIN_IATA = 'ICN';
export const MAX_HUB_STOPS = 2;

/** @type {Map<string, number> | null} */
let hubTierCache = null;

/** @type {Map<string, import('./ourairports.mjs').ReturnType<typeof loadOurAirportsRecords> extends Promise<infer T> ? T extends (infer U)[] ? U : never : never> | null} */
let airportMetaCache = null;

function hubTier(iata) {
  if (!hubTierCache) {
    hubTierCache = new Map();
    for (const code of TIER_1_TRANSIT_HUBS) hubTierCache.set(code, 1);
  }
  return hubTierCache.get(iata) ?? 99;
}

/**
 * @param {{ skipDownload?: boolean }} [options]
 */
export async function loadAirportMetaMap(options = {}) {
  if (airportMetaCache) return airportMetaCache;
  const records = await loadOurAirportsRecords({ skipDownload: options.skipDownload ?? true });
  /** @type {Map<string, typeof records[number]>} */
  const map = new Map();
  for (const row of records) map.set(row.iata_code, row);
  airportMetaCache = map;
  return map;
}

/**
 * @param {string} origin
 * @param {string} dest
 * @param {Map<string, Set<string>>} adjacency
 */
export function hasRouteEdge(origin, dest, adjacency) {
  return adjacency.get(origin)?.has(dest) ?? false;
}

/**
 * Score candidate hub paths — lower is better (v2 geo rules).
 * @param {string[]} path
 * @param {Map<string, unknown> | null | undefined} airportMeta
 */
function scoreHubPath(path, airportMeta) {
  if (airportMeta?.size) {
    return scoreFlightPathV2(path, { airportMeta });
  }
  let score = (path.length - 2) * 100;
  for (let i = 1; i < path.length - 1; i += 1) {
    score += hubTier(path[i]);
  }
  return score;
}

/** @param {string[]} path */
function maxLegHoursOnGraphPath(path) {
  let max = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = getAirportHubCoords(path[i]);
    const to = getAirportHubCoords(path[i + 1]);
    if (!from || !to) continue;
    max = Math.max(max, estimateFlightHours(from, to));
  }
  return max;
}

/**
 * @param {string} origin
 * @param {string} dest
 * @param {Map<string, Set<string>>} adjacency
 * @param {{ maxHubStops?: number, airportMeta?: Map<string, unknown> }} [options]
 * @returns {{ hubIatas: string[], hops: number, source: string, path: string[] } | null}
 */
export function resolveGraphFlightRoute(origin, dest, adjacency, options = {}) {
  const from = String(origin || '').trim().toUpperCase();
  const to = String(dest || '').trim().toUpperCase();
  const maxHubStops = options.maxHubStops ?? MAX_HUB_STOPS;
  const airportMeta = options.airportMeta ?? null;

  if (!from || !to || from.length !== 3 || to.length !== 3) return null;
  if (from === to) {
    return { hubIatas: [], hops: 0, source: 'same-airport', path: [from] };
  }

  /** @type {{ hubIatas: string[], hops: number, source: string, path: string[], score: number }[]} */
  let candidates = [];

  if (hasRouteEdge(from, to, adjacency)) {
    candidates.push({
      hubIatas: [],
      hops: 1,
      source: 'graph-direct',
      path: [from, to],
      score: scoreHubPath([from, to], airportMeta),
    });
  }

  if (maxHubStops >= 1) {
    for (const h1 of adjacency.get(from) ?? []) {
      if (h1 === to) continue;
      if (hasRouteEdge(h1, to, adjacency)) {
        const path = [from, h1, to];
        candidates.push({
          hubIatas: [h1],
          hops: 2,
          source: 'graph-1hop',
          path,
          score: scoreHubPath(path, airportMeta),
        });
      }
    }
  }

  if (maxHubStops >= 2) {
    for (const h1 of adjacency.get(from) ?? []) {
      if (h1 === to) continue;
      for (const h2 of adjacency.get(h1) ?? []) {
        if (h2 === from || h2 === to || h2 === h1) continue;
        if (hasRouteEdge(h2, to, adjacency)) {
          const path = [from, h1, h2, to];
          candidates.push({
            hubIatas: [h1, h2],
            hops: 3,
            source: 'graph-2hop',
            path,
            score: scoreHubPath(path, airportMeta),
          });
        }
      }
    }
  }

  if (!candidates.length) return null;

  if (airportMeta?.size) {
    candidates = filterSuspiciousGraphDirect(candidates, adjacency, airportMeta);
    if (!candidates.length) return null;
  }

  const withinLegLimit = candidates.filter(
    (candidate) => maxLegHoursOnGraphPath(candidate.path) <= MAX_FLIGHT_LEG_HOURS
  );
  const pool = withinLegLimit.length ? withinLegLimit : candidates;

  pool.sort(
    (a, b) =>
      a.score - b.score ||
      a.hops - b.hops ||
      a.hubIatas.join(',').localeCompare(b.hubIatas.join(','))
  );
  const best = pool[0];
  return {
    hubIatas: best.hubIatas,
    hops: best.hops,
    source: best.source,
    path: best.path,
  };
}

async function loadRoutesFromSupabase() {
  loadEnvFile();
  const supabase = createSupabaseScriptClient();
  const PAGE = 1000;
  /** @type {Array<{ source_iata: string, dest_iata: string }>} */
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('air_routes')
      .select('source_iata, dest_iata')
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all.map((row) => ({
    airline: null,
    airlineId: null,
    sourceIata: String(row.source_iata).trim().toUpperCase(),
    sourceAirportId: null,
    destIata: String(row.dest_iata).trim().toUpperCase(),
    destAirportId: null,
    codeshare: null,
    stops: 0,
    equipment: null,
  }));
}

/**
 * @param {{ fromSupabase?: boolean, skipDownload?: boolean }} [options]
 */
export async function loadFlightRouteGraph(options = {}) {
  const fromSupabase = options.fromSupabase ?? false;
  let routes;

  if (fromSupabase) {
    try {
      routes = await loadRoutesFromSupabase();
      if (!routes.length) throw new Error('Supabase air_routes empty');
    } catch (err) {
      console.warn(`Supabase air_routes unavailable (${err.message}) — falling back to OpenFlights cache`);
      routes = await loadOpenFlightsRoutes({ skipDownload: options.skipDownload });
    }
  } else {
    routes = await loadOpenFlightsRoutes({ skipDownload: options.skipDownload });
  }

  const adjacency = buildRouteAdjacency(routes);
  return { routes, adjacency, routeLegCount: routes.length };
}

/**
 * @param {string} destIata
 * @param {Map<string, Set<string>>} adjacency
 * @param {{ originIata?: string, airportMeta?: Map<string, unknown> }} [options]
 */
export function resolveFlightRouteFromGraph(destIata, adjacency, options = {}) {
  const originIata = String(options.originIata ?? DEFAULT_ORIGIN_IATA).trim().toUpperCase();
  const dest = String(destIata || '').trim().toUpperCase();
  if (!dest || dest.length !== 3) return null;
  return resolveGraphFlightRoute(originIata, dest, adjacency, {
    airportMeta: options.airportMeta,
  });
}

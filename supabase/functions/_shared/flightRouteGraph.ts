/**
 * ICN-centric OpenFlights graph resolver — Edge reuse (Phase 3).
 * v2 geo scoring — flightRouteGeoRules.ts
 */
import {
  filterSuspiciousGraphDirect,
  scoreFlightPathV2,
  type AirportMeta,
} from "./flightRouteGeoRules.ts";

export const DEFAULT_ORIGIN_IATA = "ICN";
export const MAX_HUB_STOPS = 2;
export const MAX_FLIGHT_LEG_HOURS = 16;

export function hasRouteEdge(
  origin: string,
  dest: string,
  adjacency: Map<string, Set<string>>,
): boolean {
  return adjacency.get(origin)?.has(dest) ?? false;
}

export type GraphRouteResult = {
  hubIatas: string[];
  hops: number;
  source: string;
  path: string[];
};

function maxLegHoursOnGraphPath(
  path: string[],
  airportMeta?: Map<string, AirportMeta>,
): number {
  let max = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = airportMeta?.get(path[i]);
    const to = airportMeta?.get(path[i + 1]);
    if (!from || !to) continue;
    max = Math.max(
      max,
      Math.max(
        1,
        Math.round(
          haversineKm(from.latitude_deg, from.longitude_deg, to.latitude_deg, to.longitude_deg) /
            850,
        ),
      ),
    );
  }
  return max;
}

type Candidate = GraphRouteResult & { score: number };

function collectGraphRouteCandidates(
  origin: string,
  dest: string,
  adjacency: Map<string, Set<string>>,
  options: { maxHubStops?: number; airportMeta?: Map<string, AirportMeta> } = {},
): Candidate[] {
  const from = String(origin || "").trim().toUpperCase();
  const to = String(dest || "").trim().toUpperCase();
  const maxHubStops = options.maxHubStops ?? MAX_HUB_STOPS;
  const airportMeta = options.airportMeta;

  if (!from || !to || from.length !== 3 || to.length !== 3) return [];
  if (from === to) {
    return [{ hubIatas: [], hops: 0, source: "same-airport", path: [from], score: 0 }];
  }

  /** @type {Candidate[]} */
  let candidates = [];

  if (hasRouteEdge(from, to, adjacency)) {
    candidates.push({
      hubIatas: [],
      hops: 1,
      source: "graph-direct",
      path: [from, to],
      score: scoreFlightPathV2([from, to], airportMeta),
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
          source: "graph-1hop",
          path,
          score: scoreFlightPathV2(path, airportMeta),
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
            source: "graph-2hop",
            path,
            score: scoreFlightPathV2(path, airportMeta),
          });
        }
      }
    }
  }

  if (!candidates.length) return [];

  if (airportMeta?.size) {
    candidates = filterSuspiciousGraphDirect(candidates, adjacency, airportMeta);
    if (!candidates.length) return [];
  }

  const withinLegLimit = candidates.filter(
    (candidate) => maxLegHoursOnGraphPath(candidate.path, airportMeta) <= MAX_FLIGHT_LEG_HOURS,
  );
  const pool = withinLegLimit.length ? withinLegLimit : candidates;

  pool.sort(
    (a, b) =>
      a.score - b.score ||
      a.hops - b.hops ||
      a.hubIatas.join(",").localeCompare(b.hubIatas.join(",")),
  );

  return pool;
}

function dedupeRouteCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.path.join(">");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

export function resolveGraphFlightRouteTopN(
  origin: string,
  dest: string,
  adjacency: Map<string, Set<string>>,
  options: { maxHubStops?: number; airportMeta?: Map<string, AirportMeta>; topN?: number } = {},
): GraphRouteResult[] {
  const topN = Math.max(1, Math.min(5, options.topN ?? 1));
  const pool = dedupeRouteCandidates(collectGraphRouteCandidates(origin, dest, adjacency, options));
  return pool.slice(0, topN).map(({ hubIatas, hops, source, path }) => ({
    hubIatas,
    hops,
    source,
    path,
  }));
}

export function resolveGraphFlightRoute(
  origin: string,
  dest: string,
  adjacency: Map<string, Set<string>>,
  options: { maxHubStops?: number; airportMeta?: Map<string, AirportMeta> } = {},
): GraphRouteResult | null {
  const best = resolveGraphFlightRouteTopN(origin, dest, adjacency, { ...options, topN: 1 })[0];
  return best ?? null;
}

export function buildRouteAdjacency(
  routes: Array<{ source_iata: string; dest_iata: string }>,
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const row of routes) {
    const src = String(row.source_iata).trim().toUpperCase();
    const dst = String(row.dest_iata).trim().toUpperCase();
    if (src.length !== 3 || dst.length !== 3 || src === dst) continue;
    if (!adj.has(src)) adj.set(src, new Set());
    adj.get(src)!.add(dst);
  }
  return adj;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type AirportRow = {
  iata_code: string;
  latitude_deg: number;
  longitude_deg: number;
};

export function findNearestScheduledAirport(
  lat: number,
  lng: number,
  airports: AirportRow[],
  maxKm = 650,
): { iata: string; lat: number; lng: number; km: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let best: { iata: string; lat: number; lng: number; km: number } | null = null;
  let bestKm = Infinity;

  for (const row of airports) {
    const code = String(row.iata_code ?? "").trim().toUpperCase();
    const rowLat = row.latitude_deg;
    const rowLng = row.longitude_deg;
    if (code.length !== 3 || !Number.isFinite(rowLat) || !Number.isFinite(rowLng)) continue;
    const km = haversineKm(lat, lng, rowLat, rowLng);
    if (km < bestKm) {
      bestKm = km;
      best = { iata: code, lat: rowLat, lng: rowLng, km };
    }
  }

  if (!best || bestKm > maxKm) return null;
  return best;
}

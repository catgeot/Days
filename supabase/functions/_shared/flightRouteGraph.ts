/**
 * ICN-centric OpenFlights graph resolver — Edge reuse (Phase 3).
 * Ported from scripts/lib/flight-route-resolver.mjs
 */

export const DEFAULT_ORIGIN_IATA = 'ICN';
export const MAX_HUB_STOPS = 2;

const TIER_1_TRANSIT_HUBS = new Set([
  'ATL', 'AMS', 'AUH', 'BKK', 'BRU', 'CAN', 'CDG', 'CPH', 'DEN', 'DFW', 'DOH', 'DXB',
  'FRA', 'HEL', 'HKG', 'HND', 'HNL', 'ICN', 'IST', 'JFK', 'KUL', 'LAX', 'LHR', 'MAD',
  'MEL', 'MUC', 'NRT', 'ORD', 'PEK', 'PVG', 'SHA', 'SIN', 'SYD', 'VIE', 'YVR', 'YYZ',
  'ZRH', 'FCO', 'SFO', 'SEA', 'DUB', 'WAW', 'PRG', 'BUD', 'OSL', 'ARN', 'LIS',
]);

function hubTier(iata: string): number {
  return TIER_1_TRANSIT_HUBS.has(iata) ? 1 : 99;
}

export function hasRouteEdge(
  origin: string,
  dest: string,
  adjacency: Map<string, Set<string>>,
): boolean {
  return adjacency.get(origin)?.has(dest) ?? false;
}

function scoreHubPath(hubIatas: string[]): number {
  let score = hubIatas.length * 100;
  for (const h of hubIatas) score += hubTier(h);
  return score;
}

export type GraphRouteResult = {
  hubIatas: string[];
  hops: number;
  source: string;
  path: string[];
};

export function resolveGraphFlightRoute(
  origin: string,
  dest: string,
  adjacency: Map<string, Set<string>>,
  options: { maxHubStops?: number } = {},
): GraphRouteResult | null {
  const from = String(origin || '').trim().toUpperCase();
  const to = String(dest || '').trim().toUpperCase();
  const maxHubStops = options.maxHubStops ?? MAX_HUB_STOPS;

  if (!from || !to || from.length !== 3 || to.length !== 3) return null;
  if (from === to) {
    return { hubIatas: [], hops: 0, source: 'same-airport', path: [from] };
  }

  type Candidate = GraphRouteResult & { score: number };
  const candidates: Candidate[] = [];

  if (hasRouteEdge(from, to, adjacency)) {
    candidates.push({
      hubIatas: [],
      hops: 1,
      source: 'graph-direct',
      path: [from, to],
      score: scoreHubPath([]),
    });
  }

  if (maxHubStops >= 1) {
    for (const h1 of adjacency.get(from) ?? []) {
      if (h1 === to) continue;
      if (hasRouteEdge(h1, to, adjacency)) {
        candidates.push({
          hubIatas: [h1],
          hops: 2,
          source: 'graph-1hop',
          path: [from, h1, to],
          score: scoreHubPath([h1]),
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
          candidates.push({
            hubIatas: [h1, h2],
            hops: 3,
            source: 'graph-2hop',
            path: [from, h1, h2, to],
            score: scoreHubPath([h1, h2]),
          });
        }
      }
    }
  }

  if (!candidates.length) return null;

  candidates.sort(
    (a, b) =>
      a.score - b.score ||
      a.hops - b.hops ||
      a.hubIatas.join(',').localeCompare(b.hubIatas.join(',')),
  );
  const best = candidates[0];
  return {
    hubIatas: best.hubIatas,
    hops: best.hops,
    source: best.source,
    path: best.path,
  };
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

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
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
    const code = String(row.iata_code ?? '').trim().toUpperCase();
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

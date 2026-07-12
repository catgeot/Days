/**
 * Flight route geo scoring SSOT — graph resolver v2 (scripts + runtime).
 * @see scripts/lib/flight-route-resolver.mjs
 */
import {
  estimateFlightHours,
  getAirportHubCoords,
  haversineKm,
} from './globeFlightCinema.js';

/** Major global transit hubs (legacy tier-1 seed). */
export const TIER_1_TRANSIT_HUBS = new Set([
  'ATL', 'AMS', 'AUH', 'BKK', 'BRU', 'CAN', 'CDG', 'CPH', 'DEN', 'DFW', 'DOH', 'DXB',
  'FRA', 'HEL', 'HKG', 'HND', 'HNL', 'ICN', 'IST', 'JFK', 'KUL', 'LAX', 'LHR', 'MAD',
  'MEL', 'MUC', 'NRT', 'ORD', 'PEK', 'PVG', 'SHA', 'SIN', 'SYD', 'VIE', 'YVR', 'YYZ',
  'ZRH', 'FCO', 'SFO', 'SEA', 'DUB', 'WAW', 'PRG', 'BUD', 'OSL', 'ARN', 'LIS',
]);

/** Regional passenger hubs — tier bonus in v2 scorer. */
export const REGIONAL_TRANSIT_HUBS = new Set([
  'ADD', 'JNB', 'NBO', 'DAR', 'DEL', 'BOM', 'MAA', 'CAI', 'KTM', 'DPS', 'SGN', 'KIX',
]);

/** Path flight-hours / direct great-circle hours — above this → candidate drop (fallback if empty). */
export const MAX_FLIGHT_PATH_DETOUR_RATIO = 1.35;

/** tier-1 ∪ regional — graph BFS intermediate hub gate. */
export function isMajorTransitHub(iata) {
  const hub = String(iata || '').trim().toUpperCase();
  return TIER_1_TRANSIT_HUBS.has(hub) || REGIONAL_TRANSIT_HUBS.has(hub);
}

/** EU/Atlantic hubs penalized when destination is in Africa. */
export const EUROPEAN_TRANSIT_HUBS = new Set([
  'AMS', 'BRU', 'CDG', 'CPH', 'DUB', 'FCO', 'FRA', 'HEL', 'LHR', 'LIS', 'MAD', 'MUC',
  'OSL', 'PRG', 'VIE', 'WAW', 'ZRH', 'ARN', 'BUD',
]);

/** @typedef {'africa' | 'south_asia' | 'southeast_asia' | 'middle_east' | 'oceania' | 'europe' | 'americas' | 'unknown'} DestRegion */

/** @type {Record<DestRegion, Set<string>>} */
export const PREFERRED_HUBS_BY_REGION = {
  africa: new Set(['ADD', 'JNB', 'NBO', 'DAR', 'DOH', 'DXB', 'CAI', 'JNB']),
  south_asia: new Set(['DEL', 'BOM', 'MAA', 'DXB', 'DOH', 'SIN']),
  southeast_asia: new Set(['SIN', 'BKK', 'KUL', 'SGN', 'HKG']),
  middle_east: new Set(['DOH', 'DXB', 'AUH', 'IST']),
  oceania: new Set(['SYD', 'MEL', 'BNE', 'AKL', 'NAN', 'HNL']),
  europe: new Set(['FRA', 'MUC', 'CDG', 'AMS', 'HEL', 'CPH', 'IST']),
  americas: new Set(['LAX', 'ATL', 'GRU', 'PTY', 'YVR']),
  unknown: new Set(['DXB', 'DOH', 'SIN']),
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} initial bearing degrees
 */
function initialBearingDeg(a, b) {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Cross-track distance (km) from `point` to great-circle arc origin→dest.
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} dest
 * @param {{ lat: number, lng: number }} point
 */
export function crossTrackKm(origin, dest, point) {
  const R = 6371;
  const d13 = haversineKm(origin, point) / R;
  const brng12 = toRad(initialBearingDeg(origin, dest));
  const brng13 = toRad(initialBearingDeg(origin, point));
  const xt = Math.asin(Math.min(1, Math.abs(Math.sin(d13) * Math.sin(brng13 - brng12))));
  return xt * R;
}

/**
 * @param {string} iata
 * @param {{ iso_country?: string, continent?: string, latitude_deg?: number, longitude_deg?: number } | null | undefined} meta
 * @returns {DestRegion}
 */
export function resolveDestRegion(iata, meta) {
  const continent = String(meta?.continent ?? '').trim().toUpperCase();
  if (continent === 'AF') return 'africa';
  if (continent === 'EU') return 'europe';
  if (continent === 'OC') return 'oceania';
  if (continent === 'NA' || continent === 'SA') return 'americas';

  const country = String(meta?.iso_country ?? '').trim().toUpperCase();
  const southAsia = new Set(['IN', 'LK', 'NP', 'BD', 'PK', 'MV', 'BT']);
  const sea = new Set(['TH', 'VN', 'KH', 'LA', 'MM', 'MY', 'SG', 'ID', 'PH', 'BN', 'TL']);
  const me = new Set(['AE', 'QA', 'SA', 'OM', 'BH', 'KW', 'JO', 'IL', 'TR', 'IQ', 'IR', 'YE']);
  if (southAsia.has(country)) return 'south_asia';
  if (sea.has(country)) return 'southeast_asia';
  if (me.has(country)) return 'middle_east';

  const coords = meta?.latitude_deg != null && meta?.longitude_deg != null
    ? { lat: meta.latitude_deg, lng: meta.longitude_deg }
    : getAirportHubCoords(iata);
  if (!coords) return 'unknown';
  const { lat, lng } = coords;
  // Europe (before Africa bbox — HEL/CDG/FCO have no continent in rental hubs)
  if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 45) return 'europe';
  // Americas (mainland + Caribbean / Bermuda)
  if (lng <= -30 && lng >= -170) return 'americas';
  // Southeast Asia / Philippines
  if (lat >= -11 && lat <= 28 && lng >= 95 && lng <= 141) return 'southeast_asia';
  // Oceania (AU/NZ + near Pacific) — remote Polynesia often lng < -130
  if (lat >= -50 && lat <= 0 && lng >= 110 && lng <= 180) return 'oceania';
  if (lat > -30 && lat < 20 && lng < -130 && lng > -180) return 'oceania';
  // Middle East (after Europe; before broad Africa)
  if (lat >= 12 && lat <= 42 && lng >= 32 && lng <= 62) return 'middle_east';
  if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 55) return 'africa';
  if (lat >= 5 && lat <= 40 && lng >= 60 && lng <= 100) return 'south_asia';
  return 'unknown';
}

/**
 * @param {string} hubIata
 * @param {DestRegion} destRegion
 * @param {string | null | undefined} destCountry
 * @param {string | null | undefined} hubCountry
 */
export function scoreHubGeoPenalty(hubIata, destRegion, destCountry, hubCountry) {
  const hub = String(hubIata || '').trim().toUpperCase();
  let penalty = 0;

  if (destRegion === 'africa' && EUROPEAN_TRANSIT_HUBS.has(hub)) penalty += 800;

  const preferred = PREFERRED_HUBS_BY_REGION[destRegion] ?? PREFERRED_HUBS_BY_REGION.unknown;
  if (preferred.has(hub)) penalty -= 200;

  const dc = String(destCountry ?? '').trim().toUpperCase();
  const hc = String(hubCountry ?? '').trim().toUpperCase();
  if (dc && hc && dc === hc) penalty -= 150;

  if (TIER_1_TRANSIT_HUBS.has(hub)) penalty += 2;
  else if (REGIONAL_TRANSIT_HUBS.has(hub)) penalty += 5;
  else penalty += 20;

  return penalty;
}

/**
 * Origin-region hub penalty — e.g. Americas→Europe: extra EU zigzag hops.
 * @param {string} originIata
 * @param {string} hubIata
 * @param {number} hubIndex 1-based index among intermediate hubs
 * @param {DestRegion} destRegion
 * @param {Map<string, { iso_country?: string, continent?: string, latitude_deg?: number, longitude_deg?: number }> | null | undefined} airportMeta
 */
export function scoreOriginRegionHubPenalty(originIata, hubIata, hubIndex, destRegion, airportMeta) {
  const originRegion = resolveDestRegion(originIata, airportMeta?.get(originIata) ?? null);
  const hub = String(hubIata || '').trim().toUpperCase();
  let penalty = 0;

  const originPreferred = PREFERRED_HUBS_BY_REGION[originRegion] ?? PREFERRED_HUBS_BY_REGION.unknown;
  if (originPreferred.has(hub)) penalty -= 100;

  if (originRegion === 'americas' && destRegion === 'europe') {
    if (EUROPEAN_TRANSIT_HUBS.has(hub)) {
      penalty += hubIndex > 1 ? 600 : 80;
    } else if (!isMajorTransitHub(hub)) {
      penalty += 300;
    }
  }

  if (originRegion === 'southeast_asia' && destRegion === 'europe') {
    if (EUROPEAN_TRANSIT_HUBS.has(hub)) {
      penalty += hubIndex > 1 ? 600 : 80;
    } else if (!isMajorTransitHub(hub)) {
      penalty += 300;
    }
  }

  if (originRegion === 'americas' && destRegion === 'americas' && !isMajorTransitHub(hub)) {
    penalty += 500;
  }

  return penalty;
}

/**
 * v2 path score — lower is better.
 * @param {string[]} path origin → hub… → dest
 * @param {{ airportMeta?: Map<string, { iso_country?: string, continent?: string, type?: string, scheduled_service?: string, latitude_deg?: number, longitude_deg?: number }> }} [options]
 */
export function scoreFlightPathV2(path, options = {}) {
  const codes = (path ?? [])
    .map((c) => String(c || '').trim().toUpperCase())
    .filter((c) => c.length === 3);
  if (codes.length < 2) return 99999;

  const metaMap = options.airportMeta ?? null;
  const destIata = codes[codes.length - 1];
  const destMeta = metaMap?.get(destIata) ?? null;
  const destRegion = resolveDestRegion(destIata, destMeta);
  const destCountry = destMeta?.iso_country ?? null;

  /** @type {{ lat: number, lng: number }[]} */
  const chain = [];
  for (const code of codes) {
    const meta = metaMap?.get(code);
    const fromMeta =
      meta?.latitude_deg != null && meta?.longitude_deg != null
        ? { lat: meta.latitude_deg, lng: meta.longitude_deg }
        : null;
    const coords = fromMeta ?? getAirportHubCoords(code);
    if (!coords) return 99999;
    chain.push(coords);
  }

  let totalHours = 0;
  for (let i = 0; i < chain.length - 1; i += 1) {
    totalHours += estimateFlightHours(chain[i], chain[i + 1]);
  }

  let score = totalHours * 100;

  const originIata = codes[0];
  const origin = chain[0];
  const dest = chain[chain.length - 1];
  let hubIndex = 0;
  for (let i = 1; i < codes.length - 1; i += 1) {
    hubIndex += 1;
    const hubCoords = chain[i];
    const xt = crossTrackKm(origin, dest, hubCoords);
    score += xt * 0.5;

    const hubMeta = metaMap?.get(codes[i]) ?? null;
    score += scoreHubGeoPenalty(
      codes[i],
      destRegion,
      destCountry,
      hubMeta?.iso_country ?? null,
    );
    score += scoreOriginRegionHubPenalty(
      originIata,
      codes[i],
      hubIndex,
      destRegion,
      metaMap,
    );
  }

  return score;
}

/**
 * Detour ratio = path flight hours / direct great-circle hours.
 * @param {string[]} path
 */
export function flightPathDetourRatio(path) {
  const codes = (path ?? [])
    .map((c) => String(c || '').trim().toUpperCase())
    .filter((c) => c.length === 3);
  if (codes.length < 2) return 1;

  const origin = getAirportHubCoords(codes[0]);
  const dest = getAirportHubCoords(codes[codes.length - 1]);
  if (!origin || !dest) return 1;

  const directHours = Math.max(1, estimateFlightHours(origin, dest));

  /** @type {{ lat: number, lng: number }[]} */
  const chain = [origin];
  for (let i = 1; i < codes.length - 1; i += 1) {
    const c = getAirportHubCoords(codes[i]);
    if (c) chain.push(c);
  }
  chain.push(dest);

  let pathHours = 0;
  for (let i = 0; i < chain.length - 1; i += 1) {
    pathHours += estimateFlightHours(chain[i], chain[i + 1]);
  }

  return pathHours / directHours;
}

/**
 * Drop graph candidates whose path detour exceeds maxRatio; keep pool if all would drop.
 * @param {{ path: string[] }[]} candidates
 * @param {Map<string, unknown> | null | undefined} [airportMeta]
 * @param {number} [maxRatio]
 */
export function filterCandidatesByDetourRatio(candidates, airportMeta, maxRatio = MAX_FLIGHT_PATH_DETOUR_RATIO) {
  if (!candidates?.length) return candidates ?? [];
  const filtered = candidates.filter(
    (c) => flightPathDetourRatio(c.path) <= maxRatio,
  );
  return filtered.length ? filtered : candidates;
}

/**
 * Filter suspicious graph-direct candidates (cargo / stale OpenFlights edges).
 * @param {{ hubIatas: string[], hops: number, source: string, path: string[] }[]} candidates
 * @param {Map<string, Set<string>>} adjacency
 * @param {Map<string, { type?: string, scheduled_service?: string, latitude_deg?: number, longitude_deg?: number }>} airportMeta
 */
export function filterSuspiciousGraphDirect(candidates, adjacency, airportMeta) {
  const hasMultiHop = candidates.some((c) => c.hops > 1);
  if (!hasMultiHop) return candidates;

  return candidates.filter((candidate) => {
    if (candidate.source !== 'graph-direct') return true;
    const path = candidate.path;
    if (path.length !== 2) return true;

    const origin = getAirportHubCoords(path[0]);
    const dest = getAirportHubCoords(path[1]);
    if (!origin || !dest) return true;

    const destMeta = airportMeta.get(path[1]);
    const destType = String(destMeta?.type ?? '');
    const isSmall = destType === 'small_airport' || destType === 'medium_airport';
    const scheduled = destMeta?.scheduled_service !== 'no';

    const directKm = haversineKm(origin, dest);
    const gcKm = directKm;
    const legHours = estimateFlightHours(origin, dest);

    if (scheduled && isSmall && legHours > Math.max(1, Math.round((gcKm / 850) * 1.15))) {
      return false;
    }

    const altExists = (adjacency.get(path[0])?.size ?? 0) > 1;
    if (altExists && isSmall) return false;

    return true;
  });
}

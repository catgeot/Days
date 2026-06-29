/**
 * Flight route geo scoring — Edge port of src/pages/Home/lib/flightRouteGeoRules.js
 */

export const TIER_1_TRANSIT_HUBS = new Set([
  "ATL", "AMS", "AUH", "BKK", "BRU", "CAN", "CDG", "CPH", "DEN", "DFW", "DOH", "DXB",
  "FRA", "HEL", "HKG", "HND", "HNL", "ICN", "IST", "JFK", "KUL", "LAX", "LHR", "MAD",
  "MEL", "MUC", "NRT", "ORD", "PEK", "PVG", "SHA", "SIN", "SYD", "VIE", "YVR", "YYZ",
  "ZRH", "FCO", "SFO", "SEA", "DUB", "WAW", "PRG", "BUD", "OSL", "ARN", "LIS",
]);

export const REGIONAL_TRANSIT_HUBS = new Set([
  "ADD", "JNB", "NBO", "DAR", "DEL", "BOM", "MAA", "CAI", "KTM", "DPS", "SGN", "KIX",
]);

export const MAX_FLIGHT_PATH_DETOUR_RATIO = 1.35;

export function isMajorTransitHub(iata: string): boolean {
  const hub = String(iata || "").trim().toUpperCase();
  return TIER_1_TRANSIT_HUBS.has(hub) || REGIONAL_TRANSIT_HUBS.has(hub);
}

export const EUROPEAN_TRANSIT_HUBS = new Set([
  "AMS", "BRU", "CDG", "CPH", "DUB", "FCO", "FRA", "HEL", "LHR", "LIS", "MAD", "MUC",
  "OSL", "PRG", "VIE", "WAW", "ZRH", "ARN", "BUD",
]);

export type DestRegion =
  | "africa"
  | "south_asia"
  | "southeast_asia"
  | "middle_east"
  | "oceania"
  | "europe"
  | "americas"
  | "unknown";

export type AirportMeta = {
  iata_code: string;
  latitude_deg: number;
  longitude_deg: number;
  iso_country?: string | null;
  continent?: string | null;
  type?: string | null;
  scheduled_service?: string | null;
};

const PREFERRED_HUBS_BY_REGION: Record<DestRegion, Set<string>> = {
  africa: new Set(["ADD", "JNB", "NBO", "DAR", "DOH", "DXB", "CAI"]),
  south_asia: new Set(["DEL", "BOM", "MAA", "DXB", "DOH", "SIN"]),
  southeast_asia: new Set(["SIN", "BKK", "KUL", "SGN", "HKG"]),
  middle_east: new Set(["DOH", "DXB", "AUH", "IST"]),
  oceania: new Set(["SYD", "MEL", "BNE", "AKL", "NAN", "HNL"]),
  europe: new Set(["FRA", "MUC", "CDG", "AMS", "HEL", "CPH", "IST"]),
  americas: new Set(["LAX", "ATL", "GRU", "PTY", "YVR"]),
  unknown: new Set(["DXB", "DOH", "SIN"]),
};

const FLIGHT_SPEED_KMH = 850;
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

function estimateFlightHours(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  return Math.max(1, Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng) / FLIGHT_SPEED_KMH));
}

function initialBearingDeg(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function crossTrackKm(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  point: { lat: number; lng: number },
): number {
  const R = 6371;
  const d13 = haversineKm(origin.lat, origin.lng, point.lat, point.lng) / R;
  const brng12 = toRad(initialBearingDeg(origin, dest));
  const brng13 = toRad(initialBearingDeg(origin, point));
  const xt = Math.asin(Math.min(1, Math.abs(Math.sin(d13) * Math.sin(brng13 - brng12))));
  return xt * R;
}

export function resolveDestRegion(iata: string, meta: AirportMeta | null | undefined): DestRegion {
  const continent = String(meta?.continent ?? "").trim().toUpperCase();
  if (continent === "AF") return "africa";
  if (continent === "EU") return "europe";
  if (continent === "OC") return "oceania";
  if (continent === "NA" || continent === "SA") return "americas";

  const country = String(meta?.iso_country ?? "").trim().toUpperCase();
  const southAsia = new Set(["IN", "LK", "NP", "BD", "PK", "MV", "BT"]);
  const sea = new Set(["TH", "VN", "KH", "LA", "MM", "MY", "SG", "ID", "PH", "BN", "TL"]);
  const me = new Set(["AE", "QA", "SA", "OM", "BH", "KW", "JO", "IL", "TR", "IQ", "IR", "YE"]);
  if (southAsia.has(country)) return "south_asia";
  if (sea.has(country)) return "southeast_asia";
  if (me.has(country)) return "middle_east";

  if (meta?.latitude_deg != null && meta?.longitude_deg != null) {
    const { latitude_deg: lat, longitude_deg: lng } = meta;
    if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 55) return "africa";
    if (lat >= 5 && lat <= 40 && lng >= 60 && lng <= 100) return "south_asia";
  }

  return "unknown";
}

function scoreHubGeoPenalty(
  hubIata: string,
  destRegion: DestRegion,
  destCountry: string | null | undefined,
  hubCountry: string | null | undefined,
): number {
  const hub = String(hubIata || "").trim().toUpperCase();
  let penalty = 0;
  if (destRegion === "africa" && EUROPEAN_TRANSIT_HUBS.has(hub)) penalty += 800;
  const preferred = PREFERRED_HUBS_BY_REGION[destRegion] ?? PREFERRED_HUBS_BY_REGION.unknown;
  if (preferred.has(hub)) penalty -= 200;
  const dc = String(destCountry ?? "").trim().toUpperCase();
  const hc = String(hubCountry ?? "").trim().toUpperCase();
  if (dc && hc && dc === hc) penalty -= 150;
  if (TIER_1_TRANSIT_HUBS.has(hub)) penalty += 2;
  else if (REGIONAL_TRANSIT_HUBS.has(hub)) penalty += 5;
  else penalty += 20;
  return penalty;
}

function scoreOriginRegionHubPenalty(
  originIata: string,
  hubIata: string,
  hubIndex: number,
  destRegion: DestRegion,
  airportMeta?: Map<string, AirportMeta>,
): number {
  const originRegion = resolveDestRegion(originIata, airportMeta?.get(originIata) ?? null);
  const hub = String(hubIata || "").trim().toUpperCase();
  let penalty = 0;

  const originPreferred = PREFERRED_HUBS_BY_REGION[originRegion] ?? PREFERRED_HUBS_BY_REGION.unknown;
  if (originPreferred.has(hub)) penalty -= 100;

  if (originRegion === "americas" && destRegion === "europe") {
    if (EUROPEAN_TRANSIT_HUBS.has(hub)) {
      penalty += hubIndex > 1 ? 600 : 80;
    } else if (!isMajorTransitHub(hub)) {
      penalty += 300;
    }
  }

  if (originRegion === "americas" && destRegion === "americas" && !isMajorTransitHub(hub)) {
    penalty += 500;
  }

  return penalty;
}

function coordsForIata(
  iata: string,
  metaMap: Map<string, AirportMeta> | undefined,
): { lat: number; lng: number } | null {
  const meta = metaMap?.get(iata);
  if (meta && Number.isFinite(meta.latitude_deg) && Number.isFinite(meta.longitude_deg)) {
    return { lat: meta.latitude_deg, lng: meta.longitude_deg };
  }
  return null;
}

export function scoreFlightPathV2(
  path: string[],
  airportMeta?: Map<string, AirportMeta>,
): number {
  const codes = (path ?? [])
    .map((c) => String(c || "").trim().toUpperCase())
    .filter((c) => c.length === 3);
  if (codes.length < 2) return 99999;

  const destIata = codes[codes.length - 1];
  const destMeta = airportMeta?.get(destIata) ?? null;
  const destRegion = resolveDestRegion(destIata, destMeta);
  const destCountry = destMeta?.iso_country ?? null;

  const chain: Array<{ lat: number; lng: number }> = [];
  for (const code of codes) {
    const c = coordsForIata(code, airportMeta);
    if (!c) return 99999;
    chain.push(c);
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
    score += crossTrackKm(origin, dest, chain[i]) * 0.5;
    const hubMeta = airportMeta?.get(codes[i]) ?? null;
    score += scoreHubGeoPenalty(codes[i], destRegion, destCountry, hubMeta?.iso_country ?? null);
    score += scoreOriginRegionHubPenalty(
      originIata,
      codes[i],
      hubIndex,
      destRegion,
      airportMeta,
    );
  }

  return score;
}

export function filterSuspiciousGraphDirect<
  T extends { hubIatas: string[]; hops: number; source: string; path: string[] },
>(
  candidates: T[],
  adjacency: Map<string, Set<string>>,
  airportMeta: Map<string, AirportMeta>,
): T[] {
  const hasMultiHop = candidates.some((c) => c.hops > 1);
  if (!hasMultiHop) return candidates;

  return candidates.filter((candidate) => {
    if (candidate.source !== "graph-direct") return true;
    const path = candidate.path;
    if (path.length !== 2) return true;

    const origin = coordsForIata(path[0], airportMeta);
    const dest = coordsForIata(path[1], airportMeta);
    if (!origin || !dest) return true;

    const destMeta = airportMeta.get(path[1]);
    const destType = String(destMeta?.type ?? "");
    const isSmall = destType === "small_airport" || destType === "medium_airport";
    const scheduled = destMeta?.scheduled_service !== "no";
    const legHours = estimateFlightHours(origin, dest);
    const gcHours = Math.max(1, Math.round(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng) / FLIGHT_SPEED_KMH));

    if (scheduled && isSmall && legHours > Math.max(1, Math.round(gcHours * 1.15))) return false;
    const altExists = (adjacency.get(path[0])?.size ?? 0) > 1;
    if (altExists && isSmall) return false;
    return true;
  });
}

export function flightPathDetourRatio(
  path: string[],
  airportMeta?: Map<string, AirportMeta>,
): number {
  const codes = (path ?? [])
    .map((c) => String(c || "").trim().toUpperCase())
    .filter((c) => c.length === 3);
  if (codes.length < 2) return 1;

  const origin = coordsForIata(codes[0], airportMeta);
  const dest = coordsForIata(codes[codes.length - 1], airportMeta);
  if (!origin || !dest) return 1;

  const directHours = Math.max(1, estimateFlightHours(origin, dest));
  const chain = [origin];
  for (let i = 1; i < codes.length - 1; i += 1) {
    const c = coordsForIata(codes[i], airportMeta);
    if (c) chain.push(c);
  }
  chain.push(dest);

  let pathHours = 0;
  for (let i = 0; i < chain.length - 1; i += 1) {
    pathHours += estimateFlightHours(chain[i], chain[i + 1]);
  }
  return pathHours / directHours;
}

export function filterCandidatesByDetourRatio<
  T extends { path: string[] },
>(
  candidates: T[],
  airportMeta?: Map<string, AirportMeta>,
  maxRatio = MAX_FLIGHT_PATH_DETOUR_RATIO,
): T[] {
  if (!candidates.length) return candidates;
  const filtered = candidates.filter(
    (c) => flightPathDetourRatio(c.path, airportMeta) <= maxRatio,
  );
  return filtered.length ? filtered : candidates;
}

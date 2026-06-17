/** 민감 공역 bbox — NOTAM/FIR 근사 · 「현실감 있는 관문 경로」 guard */

/** @typedef {{ id: string, minLng: number, maxLng: number, minLat: number, maxLat: number }} AvoidZone */

/** @type {AvoidZone[]} */
export const FLIGHT_ROUTE_AVOID_ZONES = [
  { id: 'north-korea', minLng: 124, maxLng: 130.5, minLat: 37.5, maxLat: 43.5 },
  { id: 'ukraine', minLng: 22, maxLng: 40.5, minLat: 44, maxLat: 52.5 },
  /** 러시아 50°N+ — 서쪽 발트·핀란드(lng<30) 제외 */
  { id: 'russia-50n', minLng: 30, maxLng: 180, minLat: 50, maxLat: 82 },
];

/**
 * @param {number} lng
 * @param {number} lat
 * @param {AvoidZone} zone
 */
export function pointInAvoidZone(lng, lat, zone) {
  return lng >= zone.minLng && lng <= zone.maxLng && lat >= zone.minLat && lat <= zone.maxLat;
}

/**
 * @param {[number, number][]} coords
 * @param {AvoidZone[]} [zones]
 * @returns {string[]} crossed zone ids
 */
export function coordsCrossAvoidZones(coords, zones = FLIGHT_ROUTE_AVOID_ZONES) {
  if (!Array.isArray(coords) || !coords.length) return [];
  const crossed = [];
  for (const [lng, lat] of coords) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    for (const zone of zones) {
      if (pointInAvoidZone(lng, lat, zone) && !crossed.includes(zone.id)) {
        crossed.push(zone.id);
      }
    }
  }
  return crossed;
}

const RU_COUNTRY_MARKERS = ['러시아', 'russia', 'Russian Federation'];

/**
 * RU 목적지 — avoid guard skip (모스크바 등 우회 금지).
 * @param {Record<string, unknown> | null | undefined} location
 * @param {[number, number]} [destLngLat]
 * @param {string} [destIata]
 */
export function isRussiaDestinationLocation(location, destLngLat, destIata) {
  const country = String(location?.country ?? '').trim().toLowerCase();
  if (RU_COUNTRY_MARKERS.some((m) => country.includes(m.toLowerCase()))) return true;

  const dest = String(destIata ?? '').trim().toUpperCase();
  const ruDestIatas = new Set(['SVO', 'DME', 'VKO', 'LED', 'KRR', 'OVB', 'SVX', 'KZN', 'UFA']);
  if (dest.length === 3 && ruDestIatas.has(dest)) return true;

  if (Array.isArray(destLngLat) && destLngLat.length >= 2) {
    const [lng, lat] = destLngLat;
    if (Number.isFinite(lng) && Number.isFinite(lat) && lat >= 41 && lat <= 82 && lng >= 19 && lng <= 180) {
      if (lat >= 50 && lng >= 30) return true;
      if (lng >= 30 && lng <= 50 && lat >= 43 && lat <= 60) return true;
    }
  }

  return false;
}

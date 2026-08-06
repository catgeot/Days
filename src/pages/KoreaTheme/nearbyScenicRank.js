/** 명승 홈 내 주변 — 축제홈 NEAR_FESTIVAL_KM과 동일 반경 */
export const NEAR_SCENIC_KM = 80;

function toRad(d) {
  return (d * Math.PI) / 180;
}

/**
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {object | null | undefined} spot
 * @returns {{ lat: number, lng: number } | null}
 */
export function scenicSpotLngLat(spot) {
  const lat = Number(spot?.lat);
  const lng = Number(spot?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 32 || lat > 44 || lng < 123 || lng > 133) return null;
  return { lat, lng };
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @param {number} maxKm
 */
export function spotsWithinKm(items, lat, lng, maxKm) {
  return (items || []).filter((item) => {
    const pt = scenicSpotLngLat(item);
    if (!pt) return false;
    return haversineKm(lat, lng, pt.lat, pt.lng) <= maxKm;
  });
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @returns {{ item: object, km: number }[]}
 */
export function rankSpotsByDistance(items, lat, lng) {
  return (items || [])
    .map((item) => {
      const pt = scenicSpotLngLat(item);
      const km = pt
        ? haversineKm(lat, lng, pt.lat, pt.lng)
        : Number.POSITIVE_INFINITY;
      return { item, km };
    })
    .sort(
      (a, b) =>
        a.km - b.km ||
        String(a.item?.name || '').localeCompare(
          String(b.item?.name || ''),
          'ko',
        ),
    );
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @param {number} [maxKm]
 * @returns {{ item: object, km: number }[]}
 */
export function rankNearbyScenicSpots(items, lat, lng, maxKm = NEAR_SCENIC_KM) {
  return rankSpotsByDistance(spotsWithinKm(items, lat, lng, maxKm), lat, lng);
}

/**
 * @param {number} km
 */
export function formatDistanceKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(0.1, Math.round(km * 10) / 10)}km`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

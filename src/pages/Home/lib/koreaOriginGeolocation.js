import { queryGeolocationPermission } from '../../Korea/festivalLocationHint.js';
import { KOREA_ORIGIN_CITIES } from './koreaOriginCityMatch.js';

function toRad(deg) {
  return (Number(deg) * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nearest 시·군. Coordinates stay in memory for this call only. */
export function nearestKoreaOriginCity(lat, lng, cities = KOREA_ORIGIN_CITIES) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  let best = null;
  let bestKm = Infinity;
  for (const city of cities) {
    if (!Number.isFinite(Number(city.lat)) || !Number.isFinite(Number(city.lng))) continue;
    const km = haversineKm(la, ln, city.lat, city.lng);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  return best;
}

/**
 * Permission is requested only when this runs (button press).
 * Returns a city id/name. Does not persist coordinates.
 */
export async function locateNearestOriginCity() {
  try {
    const permission = await queryGeolocationPermission();
    if (permission === 'denied') return { ok: false };
    const geo = globalThis.navigator?.geolocation;
    if (!geo?.getCurrentPosition) return { ok: false };
    const pos = await new Promise((resolve) => {
      geo.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    });
    const lat = pos?.coords?.latitude;
    const lng = pos?.coords?.longitude;
    const city = nearestKoreaOriginCity(lat, lng);
    if (!city) return { ok: false };
    return { ok: true, city };
  } catch {
    return { ok: false };
  }
}

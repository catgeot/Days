import { RENTAL_AIRPORT_HUBS, DEFAULT_HUB_RADIUS_KM } from './rentalAirportHubs.js';

const toRad = (d) => (d * Math.PI) / 180;

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MIN_ALIAS_LEN = 4;

/**
 * 여행지 객체로부터 렌터카 검색에 쓸 공항(한국어 공식명 + IATA)을 추론합니다.
 * 우선 좌표·반경으로 최근접 허브를 찾고, 실패 시 별칭 부분 문자열 매칭을 사용합니다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {{ officialKo: string, iata: string | null } | null}
 */
export function resolveRentalAirport(location) {
  if (!location || typeof location !== 'object') return null;

  if (typeof location.rental_airport_official_ko === 'string' && location.rental_airport_official_ko.trim()) {
    return {
      officialKo: location.rental_airport_official_ko.trim(),
      iata: typeof location.rental_airport_iata === 'string' ? location.rental_airport_iata : null
    };
  }

  const slug = String(location.slug || '').toLowerCase();
  const name = String(location.name || '').toLowerCase();
  const nameEn = String(location.name_en || '').toLowerCase();
  const country = String(location.country || '').toLowerCase();
  const countryEn = String(location.country_en || '').toLowerCase();
  const hay = `${slug} ${name} ${nameEn} ${country} ${countryEn}`.replace(/-/g, ' ');

  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    let best = null;
    let bestD = Infinity;
    for (const hub of RENTAL_AIRPORT_HUBS) {
      const maxR = hub.radiusKm ?? DEFAULT_HUB_RADIUS_KM;
      const d = distanceKm(lat, lng, hub.lat, hub.lng);
      if (d <= maxR && d < bestD) {
        bestD = d;
        best = { officialKo: hub.officialKo, iata: hub.iata };
      }
    }
    if (best) return best;
  }

  let bestAlias = null;
  let bestLen = 0;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const iataLower = hub.iata.toLowerCase();
    for (const raw of hub.aliases || []) {
      const al = raw.toLowerCase();
      const isIataToken = al.length === 3 && /^[a-z]{3}$/.test(al) && al === iataLower;
      if (al.length < MIN_ALIAS_LEN && !isIataToken) continue;
      if (hay.includes(al) && al.length > bestLen) {
        bestLen = al.length;
        bestAlias = { officialKo: hub.officialKo, iata: hub.iata };
      }
    }
  }

  return bestAlias;
}

/**
 * `rental_airport_official_ko` / `rental_airport_iata` 필드를 채워 반환합니다.
 *
 * @param {T} location
 * @returns {T}
 * @template T
 */
export function enrichLocationWithRentalAirport(location) {
  if (!location || typeof location !== 'object') return location;
  const resolved = resolveRentalAirport(location);
  if (!resolved?.officialKo) return location;
  if (
    location.rental_airport_official_ko === resolved.officialKo &&
    location.rental_airport_iata === resolved.iata
  ) {
    return location;
  }
  const next = { ...location, rental_airport_official_ko: resolved.officialKo };
  if (resolved.iata) next.rental_airport_iata = resolved.iata;
  return next;
}

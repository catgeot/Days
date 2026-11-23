import gateways from '../data/koreaInternationalAirportGateways.json' with { type: 'json' };
import { suggestKoreaOriginCities } from './koreaOriginCityMatch.js';
import { distanceKm } from '../../../utils/rentalAirportMatch.js';

const INTERNATIONAL = gateways.internationalAirports;
const PROVINCE_GATEWAY = gateways.provinceGatewayIata;
const CITY_GATEWAY = gateways.cityGatewayIata;

/**
 * @param {string} cityId
 * @returns {string | null}
 */
export function resolveInternationalGatewayForCityId(cityId) {
  const id = String(cityId || '').trim();
  if (!id) return null;
  if (CITY_GATEWAY[id]) return CITY_GATEWAY[id];
  return null;
}

/**
 * @param {string} province
 * @returns {string | null}
 */
export function resolveInternationalGatewayForProvince(province) {
  const key = String(province || '').trim();
  return PROVINCE_GATEWAY[key] || null;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {string | null}
 */
export function nearestInternationalGatewayIata(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best = null;
  let bestKm = Infinity;
  for (const [iata, row] of Object.entries(INTERNATIONAL)) {
    const km = distanceKm(lat, lng, row.lat, row.lng);
    if (km < bestKm) {
      bestKm = km;
      best = iata;
    }
  }
  return best;
}

/**
 * @param {{ id?: string, province?: string, lat?: number, lng?: number } | null} city
 * @returns {string | null}
 */
export function resolveInternationalGatewayForCity(city) {
  if (!city) return null;
  const fromId = resolveInternationalGatewayForCityId(city.id);
  if (fromId) return fromId;
  const fromProvince = resolveInternationalGatewayForProvince(city.province);
  if (fromProvince) return fromProvince;
  return nearestInternationalGatewayIata(city.lat, city.lng);
}

/**
 * @param {string} iata
 * @param {string} [locale]
 */
export function formatFlightOriginGatewayDepartureLabel(iata, locale = 'ko') {
  const code = String(iata || '').trim().toUpperCase();
  const meta = INTERNATIONAL[code];
  const displayCity = meta
    ? String(locale || '').startsWith('en')
      ? meta.labelEn
      : meta.labelKo
    : code;
  if (String(locale || '').startsWith('en')) {
    return `From ${displayCity} (${code})`;
  }
  return `${displayCity}(${code})에서 출발`;
}

/**
 * @param {string} query
 * @param {{ limit?: number, locale?: string }} [options]
 * @returns {{ iata: string, label: string, officialKo?: string, cityId?: string, score: number }[]}
 */
export function searchKoreaCityInternationalAirportOrigins(query, options = {}) {
  const limit = options.limit ?? 6;
  const locale = options.locale ?? 'ko';
  const raw = String(query ?? '').trim();
  if (!raw) return [];

  const suggestion = suggestKoreaOriginCities(raw);
  const cities = suggestion.cities || [];
  if (!cities.length) return [];

  const rows = [];
  const seen = new Set();
  for (const city of cities) {
    const iata = resolveInternationalGatewayForCity(city);
    if (!iata || seen.has(iata)) continue;
    seen.add(iata);
    rows.push({
      iata,
      label: formatFlightOriginGatewayDepartureLabel(iata, locale),
      officialKo: INTERNATIONAL[iata]?.labelKo,
      cityId: city.id,
      score: suggestion.kind === 'exact' ? 92 : 75,
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

export { INTERNATIONAL as KOREA_INTERNATIONAL_AIRPORTS };
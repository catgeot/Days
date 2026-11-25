import { queryGeolocationPermission } from '../../Korea/festivalLocationHint.js';
import { KOREA_AIRPORT_IATAS } from '../../../utils/koreaAirportIatas.js';
import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import { distanceKm } from '../../../utils/rentalAirportMatch.js';
import { coordsInKorea } from './visitedPlaceSearch.js';
import { KOREA_ORIGIN_CITIES } from './koreaOriginCityMatch.js';
import { geocodeReversePlaceFields } from './mapboxGeocodeSuggestions.js';
import { getFlightOriginDisplayLabel } from './flightCinemaOriginOptions.js';
import { resolveFlightOriginFromCoords } from './flightCinemaOriginSearch.js';
import { listCityAttractionHubs } from './cityAttractionHubs.js';

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

function airportCopy(iata) {
  const code = String(iata || '').trim().toUpperCase();
  const hub = RENTAL_AIRPORT_HUBS.find((row) => row.iata === code);
  return {
    iata: code,
    labelKo: hub?.officialKo || code,
    labelEn: getFlightOriginDisplayLabel(code, 'en') || code,
  };
}

/**
 * Nearest 시·군 inside Korea. Coordinates outside Korea are not snapped to a Korean city.
 * @param {number} lat
 * @param {number} lng
 * @param {typeof KOREA_ORIGIN_CITIES} [cities]
 */
export function nearestKoreaOriginCity(lat, lng, cities = KOREA_ORIGIN_CITIES) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (!coordsInKorea(la, ln)) return null;
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
 * Korea-bound international gateway. PUS when the venue is closer to Busan, otherwise ICN.
 * Outside Korea, the venue's own nearest airport (not a Korean city).
 * @param {{ lat?: number, lng?: number }} [destination]
 */
export function arrivalAirportForAccessDestination(destination = {}) {
  const lat = Number(destination.lat);
  const lng = Number(destination.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return airportCopy('ICN');
  }
  if (!coordsInKorea(lat, lng)) {
    const foreign = resolveFlightOriginFromCoords(lat, lng);
    if (foreign?.iata && !KOREA_AIRPORT_IATAS.has(foreign.iata)) return airportCopy(foreign.iata);
    return airportCopy(foreign?.iata || 'ICN');
  }
  const pus = RENTAL_AIRPORT_HUBS.find((row) => row.iata === 'PUS');
  const icn = RENTAL_AIRPORT_HUBS.find((row) => row.iata === 'ICN');
  if (!pus || !icn) return airportCopy('ICN');
  const toPus = distanceKm(lat, lng, pus.lat, pus.lng);
  const toIcn = distanceKm(lat, lng, icn.lat, icn.lng);
  return airportCopy(toPus <= toIcn ? 'PUS' : 'ICN');
}

function placeNames(hit) {
  const city = String(hit?.name || '').trim();
  const country = String(hit?.country || '').trim();
  const cityEn = String(hit?.name_en || hit?.name || '').trim();
  const countryEn = String(hit?.country_en || hit?.country || '').trim();
  if (!city || !country) return null;
  return { city, country, cityEn: cityEn || city, countryEn: countryEn || country };
}

/** District reverse hits (프라나콘, 따꾸아빠군) sit inside a known city. Farther GPS keeps the geocoded name. */
const MY_LOCATION_CITY_RADIUS_KM = 40;

function compactPlaceName(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s·,._-]+/g, '');
}

function nearestKnownCity(lat, lng) {
  let best = null;
  let bestKm = Infinity;
  for (const hub of listCityAttractionHubs()) {
    const hlat = Number(hub?.lat);
    const hlng = Number(hub?.lng);
    if (!Number.isFinite(hlat) || !Number.isFinite(hlng)) continue;
    const km = distanceKm(lat, lng, hlat, hlng);
    if (km < bestKm) {
      bestKm = km;
      best = hub;
    }
  }
  if (!best || bestKm > MY_LOCATION_CITY_RADIUS_KM) return null;
  return best;
}

function placeNameMatchesHub(names, hub) {
  const keys = [hub.name, hub.name_en, hub.hubId, ...(hub.aliases || [])]
    .map(compactPlaceName)
    .filter(Boolean);
  const got = [names.city, names.cityEn].map(compactPlaceName).filter(Boolean);
  return got.some((name) => keys.includes(name));
}

/**
 * Mapbox reverse often returns the admin district (프라나콘, 따꾸아빠군, Central Water Catchment).
 * The chip and the ask sentence use this city string. Within 40km, use the known city hub
 * (방콕, 카오락, 치앙마이, 크라비, 싱가포르). The airport IATA is chosen separately and is not changed here.
 */
function cityNamesForMyLocation(lat, lng, names) {
  const known = nearestKnownCity(lat, lng);
  if (!known || placeNameMatchesHub(names, known)) return names;
  return {
    city: known.name,
    country: known.country || names.country,
    cityEn: known.name_en || known.name,
    countryEn: known.country_en || names.countryEn,
  };
}

/**
 * GPS → domestic 시·군, or an overseas city plus its nearest airport.
 * Reverse geocode runs only outside Korea.
 * @param {number} lat
 * @param {number} lng
 * @param {{ reverseGeocode?: (lat: number, lng: number) => Promise<unknown> }} [options]
 */
export async function resolveMyLocationOrigin(lat, lng, options = {}) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return { ok: false };
  if (coordsInKorea(la, ln)) {
    const city = nearestKoreaOriginCity(la, ln);
    if (!city) return { ok: false };
    return { ok: true, overseas: false, city };
  }
  const airport = resolveFlightOriginFromCoords(la, ln, { excludeIatas: KOREA_AIRPORT_IATAS });
  if (!airport?.iata || KOREA_AIRPORT_IATAS.has(airport.iata)) return { ok: false };
  const reverseGeocode = options.reverseGeocode
    || ((la2, ln2) => geocodeReversePlaceFields(la2, ln2, { preferLocality: true }));
  let hit = null;
  try {
    hit = await reverseGeocode(la, ln, { preferLocality: true });
  } catch {
    hit = null;
  }
  const geocoded = placeNames(hit);
  if (!geocoded) return { ok: false };
  const names = cityNamesForMyLocation(la, ln, geocoded);
  const described = airportCopy(airport.iata);
  return {
    ok: true,
    overseas: true,
    lat: la,
    lng: ln,
    ...names,
    originIata: described.iata,
    originLabelKo: described.labelKo,
    originLabelEn: described.labelEn,
  };
}

/**
 * Permission is requested only when this runs (button press).
 * Does not persist coordinates. Outside Korea this does not return a Korean city.
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
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
      );
    });
    const lat = pos?.coords?.latitude;
    const lng = pos?.coords?.longitude;
    return resolveMyLocationOrigin(lat, lng);
  } catch {
    return { ok: false };
  }
}

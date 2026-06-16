import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import {
  getPlannerFlightArrivalIata,
  TRIPCOM_DEFAULT_DEPARTURE_AIRPORT,
} from '../../../utils/affiliate.js';

const FLIGHT_SPEED_KMH = 850;
const ROUTE_FLY_ZOOM_MAX = 2.35;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** @param {string} iata */
export function getAirportHubCoords(iata) {
  const code = String(iata || '').trim().toUpperCase();
  if (!code) return null;
  const hub = RENTAL_AIRPORT_HUBS.find((h) => h.iata === code);
  if (!hub) return null;
  return { iata: hub.iata, lng: hub.lng, lat: hub.lat };
}

/** @param {{ lat: number, lng: number }} a @param {{ lat: number, lng: number }} b */
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** @param {{ lat: number, lng: number }} origin @param {{ lat: number, lng: number }} dest */
export function estimateFlightHours(origin, dest) {
  const km = haversineKm(origin, dest);
  return Math.max(1, Math.round(km / FLIGHT_SPEED_KMH));
}

/**
 * Great-circle interpolation — returns [lng, lat].
 * @param {[number, number]} start
 * @param {[number, number]} end
 * @param {number} t 0..1
 */
export function interpolateGreatCircle(start, end, t) {
  const lat1 = toRad(start[1]);
  const lng1 = toRad(start[0]);
  const lat2 = toRad(end[1]);
  const lng2 = toRad(end[0]);

  const d =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((lat1 - lat2) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng1 - lng2) / 2) ** 2
        )
      )
    );

  if (d < 1e-9) return [start[0], start[1]];

  const a = Math.sin((1 - t) * d) / Math.sin(d);
  const b = Math.sin(t * d) / Math.sin(d);
  const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
  const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  return [toDeg(Math.atan2(y, x)), toDeg(Math.asin(Math.min(1, Math.max(-1, z))))];
}

/**
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {number} [points]
 * @returns {[number, number][]}
 */
export function buildGreatCircleLine(originLngLat, destLngLat, points = 72) {
  const coords = [];
  for (let i = 0; i <= points; i += 1) {
    coords.push(interpolateGreatCircle(originLngLat, destLngLat, i / points));
  }
  return coords;
}

/** @param {[number, number][]} coords */
export function sliceArcProgress(coords, progress) {
  const t = Math.min(1, Math.max(0, progress));
  if (!coords.length) return [];
  if (t <= 0) return [coords[0]];
  const lastIndex = Math.max(1, Math.floor(t * (coords.length - 1)));
  return coords.slice(0, lastIndex + 1);
}

/**
 * Camera center on great-circle midpoint — dateline-safe lng average.
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 */
export function buildArcCameraCenter(originLngLat, destLngLat) {
  const mid = interpolateGreatCircle(originLngLat, destLngLat, 0.5);
  return { lng: mid[0], lat: mid[1] };
}

/** 거리별 arc 프레이밍 줌 — GLOBE_VIEW.flyZoom(2.35) 상한 */
export function computeRouteFlyZoom(origin, dest, maxZoom = ROUTE_FLY_ZOOM_MAX) {
  const km = haversineKm(origin, dest);
  if (km > 9000) return 1.35;
  if (km > 6000) return 1.55;
  if (km > 3500) return 1.85;
  if (km > 1500) return 2.05;
  return maxZoom;
}

/**
 * 써머리 카드 — ICN → 도착 IATA (플래너·Trip SSOT)
 * @param {Record<string, unknown> | null | undefined} location
 */
export function resolveSummaryFlightCinemaOd(location) {
  const destIata = getPlannerFlightArrivalIata(location, {});
  const originIata = TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
  if (!destIata || !originIata) return null;

  const normalizedOrigin = String(originIata).trim().toUpperCase();
  const normalizedDest = String(destIata).trim().toUpperCase();
  if (normalizedOrigin === normalizedDest) return null;

  const origin = getAirportHubCoords(normalizedOrigin);
  const dest = getAirportHubCoords(normalizedDest);
  if (!origin || !dest) return null;

  return {
    originIata: normalizedOrigin,
    destIata: normalizedDest,
    origin,
    dest,
    flightHours: estimateFlightHours(origin, dest),
  };
}

/** @param {Record<string, unknown> | null | undefined} location */
export function canPreviewFlightRoute(location) {
  return Boolean(resolveSummaryFlightCinemaOd(location));
}

export const FLIGHT_CINEMA_DURATION_MS = 5500;

import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import {
  getPlannerFlightArrivalIata,
  TRIPCOM_DEFAULT_DEPARTURE_AIRPORT,
} from '../../../utils/affiliate.js';
import { getFlightRouteWaypoints } from '../../../utils/rentalAirportMatch.js';
import { normalizeLngDeltaSigned } from './globeLngUtils.js';

const FLIGHT_SPEED_KMH = 850;
const ROUTE_FLY_ZOOM_MAX = 2.35;
/** Short-arc |lat| above this → prefer long arc or override waypoints (ICN→LPB Arctic loop). */
const POLAR_AVOID_ABS_LAT = 58;

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
  const dLng = toRad(normalizeLngDeltaSigned(a.lng, b.lng));
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

/** @param {[number, number]} lngLat */
function toUnitCartesian(lngLat) {
  const φ = toRad(lngLat[1]);
  const λ = toRad(lngLat[0]);
  return [
    Math.cos(φ) * Math.cos(λ),
    Math.cos(φ) * Math.sin(λ),
    Math.sin(φ),
  ];
}

/** @param {number[]} v */
function fromUnitCartesian(v) {
  return [
    toDeg(Math.atan2(v[1], v[0])),
    toDeg(Math.asin(Math.min(1, Math.max(-1, v[2])))),
  ];
}

/** @param {number[]} a @param {number[]} b */
function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * @param {number[]} v1 unit vector
 * @param {number[]} v2 unit vector
 * @param {number} t 0..1
 * @param {number} omega central angle (rad) along chosen arc
 */
function slerpUnit(v1, v2, t, omega) {
  if (omega < 1e-9) return v1;
  const sinOmega = Math.sin(omega);
  const a = Math.sin((1 - t) * omega) / sinOmega;
  const b = Math.sin(t * omega) / sinOmega;
  return [
    a * v1[0] + b * v2[0],
    a * v1[1] + b * v2[1],
    a * v1[2] + b * v2[2],
  ];
}

/**
 * @param {[number, number]} start
 * @param {[number, number]} end
 * @param {number} omega
 * @param {number} [samples]
 */
function maxAbsLatOnArc(start, end, omega, samples = 24) {
  const v1 = toUnitCartesian(start);
  const v2 = toUnitCartesian(end);
  let maxAbs = 0;
  for (let i = 0; i <= samples; i += 1) {
    const p = fromUnitCartesian(slerpUnit(v1, v2, i / samples, omega));
    maxAbs = Math.max(maxAbs, Math.abs(p[1]));
  }
  return maxAbs;
}

/**
 * Pick short or long great-circle arc — avoid Arctic/polar loops on ICN→South America etc.
 * @param {[number, number]} start
 * @param {[number, number]} end
 */
function chooseGreatCircleOmega(start, end) {
  const v1 = toUnitCartesian(start);
  const v2 = toUnitCartesian(end);
  const dot = Math.max(-1, Math.min(1, dot3(v1, v2)));
  const shortOmega = Math.acos(dot);
  if (shortOmega < 1e-9) return shortOmega;

  const shortMaxLat = maxAbsLatOnArc(start, end, shortOmega);
  if (shortMaxLat <= POLAR_AVOID_ABS_LAT) return shortOmega;

  const longOmega = 2 * Math.PI - shortOmega;
  const longMaxLat = maxAbsLatOnArc(start, end, longOmega);
  return longMaxLat <= shortMaxLat ? longOmega : shortOmega;
}

/**
 * Great-circle interpolation — returns [lng, lat].
 * @param {[number, number]} start
 * @param {[number, number]} end
 * @param {number} t 0..1
 */
export function interpolateGreatCircle(start, end, t) {
  const v1 = toUnitCartesian(start);
  const v2 = toUnitCartesian(end);
  const omega = chooseGreatCircleOmega(start, end);
  if (omega < 1e-9) return [start[0], start[1]];
  return fromUnitCartesian(slerpUnit(v1, v2, t, omega));
}

/**
 * Mapbox LineString — unwrap longitudes so antimeridian segments don't wrap the globe.
 * @param {[number, number][]} coords
 */
export function unwrapRouteLongitudes(coords) {
  if (!coords.length) return [];
  const out = [[coords[0][0], coords[0][1]]];
  let prevLng = coords[0][0];
  for (let i = 1; i < coords.length; i += 1) {
    let lng = coords[i][0];
    while (lng - prevLng > 180) lng -= 360;
    while (lng - prevLng < -180) lng += 360;
    out.push([lng, coords[i][1]]);
    prevLng = lng;
  }
  return out;
}

/**
 * @param {[number, number][]} anchorPoints origin, optional waypoints, dest
 * @param {number} [pointsPerSegment]
 * @returns {[number, number][]}
 */
export function buildGreatCircleChain(anchorPoints, pointsPerSegment = 36) {
  if (!anchorPoints || anchorPoints.length < 2) return [];

  const raw = [];
  for (let seg = 0; seg < anchorPoints.length - 1; seg += 1) {
    const start = anchorPoints[seg];
    const end = anchorPoints[seg + 1];
    const v1 = toUnitCartesian(start);
    const v2 = toUnitCartesian(end);
    const omega = chooseGreatCircleOmega(start, end);
    const startIdx = seg === 0 ? 0 : 1;
    for (let i = startIdx; i <= pointsPerSegment; i += 1) {
      raw.push(fromUnitCartesian(slerpUnit(v1, v2, i / pointsPerSegment, omega)));
    }
  }
  return unwrapRouteLongitudes(raw);
}

/**
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {number} [points]
 * @returns {[number, number][]}
 */
export function buildGreatCircleLine(originLngLat, destLngLat, points = 72) {
  return buildGreatCircleChain([originLngLat, destLngLat], points);
}

/** @param {{ lat: number, lng: number }} from @param {{ lat: number, lng: number }} to */
export function initialBearing(from, to) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(normalizeLngDeltaSigned(from.lng, to.lng));
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * @param {[number, number]} lngLat [lng, lat]
 * @param {number} bearingDeg
 * @param {number} distanceKm
 * @returns {[number, number]}
 */
export function destinationPoint(lngLat, bearingDeg, distanceKm) {
  const δ = distanceKm / 6371;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lngLat[1]);
  const λ1 = toRad(lngLat[0]);
  const φ2 = Math.asin(
    Math.min(1, Math.max(-1, Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)))
  );
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );
  return [toDeg(λ2), toDeg(φ2)];
}

/**
 * @param {[number, number][]} routeCoords
 * @param {Record<string, unknown> | null | undefined} [location]
 * @returns {[number, number][]}
 */
function resolveRouteAnchors(originLngLat, destLngLat, location) {
  const waypoints = getFlightRouteWaypoints(location);
  if (!waypoints.length) return [originLngLat, destLngLat];
  return [originLngLat, ...waypoints, destLngLat];
}

/**
 * 직항 대권 항로 + 구면 측면 오프셋 — 항공 지도에서 흔한 곡선 표현(거리·시간 SSOT는 haversine 유지).
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {{ points?: number, location?: Record<string, unknown> | null }} [options]
 */
export function buildFlightRouteLine(originLngLat, destLngLat, options = {}) {
  const points = options.points ?? 80;
  const anchors = resolveRouteAnchors(originLngLat, destLngLat, options.location);
  const gcLine = buildGreatCircleChain(anchors, Math.max(24, Math.round(points / Math.max(1, anchors.length - 1))));

  const origin = { lng: originLngLat[0], lat: originLngLat[1] };
  const dest = { lng: destLngLat[0], lat: destLngLat[1] };
  const km = haversineKm(origin, dest);
  const peakKm = Math.min(240, Math.max(40, km * 0.055));
  const coords = [];

  for (let i = 0; i < gcLine.length; i += 1) {
    const t = i / Math.max(1, gcLine.length - 1);
    const gc = gcLine[i];
    const bulge = Math.sin(Math.PI * t);
    if (bulge < 0.001) {
      coords.push(gc);
      continue;
    }

    const aheadIdx = Math.min(gcLine.length - 1, i + Math.max(1, Math.round(gcLine.length * 0.008)));
    const ahead = gcLine[aheadIdx];
    const trackBearing = initialBearing(
      { lat: gc[1], lng: gc[0] },
      { lat: ahead[1], lng: ahead[0] }
    );
    coords.push(destinationPoint(gc, trackBearing + 90, peakKm * bulge));
  }

  return unwrapRouteLongitudes(coords);
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
 * Camera center on route bbox — dateline-safe after unwrap.
 * @param {[number, number][]} routeCoords
 */
export function buildArcCameraCenter(routeCoords) {
  if (!routeCoords.length) return { lng: 0, lat: 20 };
  let minLng = routeCoords[0][0];
  let maxLng = routeCoords[0][0];
  let minLat = routeCoords[0][1];
  let maxLat = routeCoords[0][1];
  for (const [lng, lat] of routeCoords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 };
}

/**
 * Route-aware camera — bbox center + distance tier zoom (GLOBE_VIEW.flyZoom 2.35 cap).
 * @param {[number, number][]} routeCoords
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} dest
 * @param {number} [maxZoom]
 */
export function computeRouteCameraView(routeCoords, origin, dest, maxZoom = ROUTE_FLY_ZOOM_MAX) {
  const center = buildArcCameraCenter(routeCoords);
  let zoom = computeRouteFlyZoom(origin, dest, maxZoom);

  if (routeCoords.length >= 2) {
    let minLng = routeCoords[0][0];
    let maxLng = routeCoords[0][0];
    let minLat = routeCoords[0][1];
    let maxLat = routeCoords[0][1];
    for (const [lng, lat] of routeCoords) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    const span = Math.max(maxLng - minLng, maxLat - minLat);
    if (span > 120) zoom = Math.min(zoom, 1.45);
    else if (span > 80) zoom = Math.min(zoom, 1.65);
  }

  return { lng: center.lng, lat: center.lat, zoom };
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
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ originIata?: string, essentialGuide?: Record<string, unknown> | null }} [options]
 */
export function resolveFlightCinemaOd(location, options = {}) {
  const destIata = getPlannerFlightArrivalIata(location, {
    essentialGuide: options.essentialGuide,
  });
  const originIata = options.originIata ?? TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
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

/**
 * 써머리 카드 — ICN → 도착 IATA (플래너·Trip SSOT)
 * @param {Record<string, unknown> | null | undefined} location
 */
export function resolveSummaryFlightCinemaOd(location) {
  return resolveFlightCinemaOd(location, {});
}

/** @param {Record<string, unknown> | null | undefined} location */
export function canPreviewFlightRoute(location) {
  return Boolean(resolveSummaryFlightCinemaOd(location));
}

export const FLIGHT_CINEMA_DURATION_MS = 5500;

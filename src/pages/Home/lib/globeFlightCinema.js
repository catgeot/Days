import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import {
  getFlightRouteHubIatas,
  getFlightRouteWaypoints,
  resolveCinemaDestIata,
} from '../../../utils/rentalAirportMatch.js';
import { normalizeLngDeltaSigned } from './globeLngUtils.js';
import {
  ICN_EUROPE_DEPARTURE_WAYPOINT,
  resolveRegionalCorridorAnchors,
  resolveSouthernCorridorAnchors,
} from './flightRouteCorridors.js';
import {
  coordsCrossAvoidZones,
  isRussiaDestinationLocation,
} from './flightRouteAvoidZones.js';

const FLIGHT_SPEED_KMH = 850;
/** SSOT: `TRIPCOM_DEFAULT_DEPARTURE_AIRPORT` in affiliate.js */
const DEFAULT_ORIGIN_IATA = 'ICN';
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

/** @param {{ lat: number, lng: number }[]} chain origin → hubs → dest */
export function estimateFlightHoursChain(chain) {
  if (!Array.isArray(chain) || chain.length < 2) return 1;
  let totalKm = 0;
  for (let i = 0; i < chain.length - 1; i += 1) {
    totalKm += haversineKm(chain[i], chain[i + 1]);
  }
  return Math.max(1, Math.round(totalKm / FLIGHT_SPEED_KMH));
}

/**
 * @param {string[]} routeIatas origin → hub… → dest
 * @returns {{ fromIata: string, toIata: string, hours: number }[]}
 */
export function estimateFlightLegHours(routeIatas) {
  const codes = (routeIatas ?? [])
    .map((code) => String(code || '').trim().toUpperCase())
    .filter(Boolean);
  if (codes.length < 2) return [];

  /** @type {{ fromIata: string, toIata: string, hours: number }[]} */
  const legs = [];
  for (let i = 0; i < codes.length - 1; i += 1) {
    const from = getAirportHubCoords(codes[i]);
    const to = getAirportHubCoords(codes[i + 1]);
    if (!from || !to) continue;
    legs.push({
      fromIata: codes[i],
      toIata: codes[i + 1],
      hours: estimateFlightHours(from, to),
    });
  }
  return legs;
}

/** @param {[number, number][]} anchors */
function dedupeConsecutiveAnchors(anchors) {
  if (!anchors.length) return [];
  const out = [anchors[0]];
  for (let i = 1; i < anchors.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = anchors[i];
    if (Math.abs(prev[0] - cur[0]) < 1e-6 && Math.abs(prev[1] - cur[1]) < 1e-6) continue;
    out.push(cur);
  }
  return out;
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

/** @param {[number, number]} start @param {[number, number]} end @param {number} omega */
function minLatOnArc(start, end, omega, samples = 24) {
  const v1 = toUnitCartesian(start);
  const v2 = toUnitCartesian(end);
  let minLat = 90;
  for (let i = 0; i <= samples; i += 1) {
    const p = fromUnitCartesian(slerpUnit(v1, v2, i / samples, omega));
    minLat = Math.min(minLat, p[1]);
  }
  return minLat;
}

/** long arc가 남극권(Antarctic loop)이면 true — 버뮤다 등 대서양 목적지 회귀 방지 */
function isAntarcticLongArc(start, end, longOmega) {
  return minLatOnArc(start, end, longOmega) < -POLAR_AVOID_ABS_LAT;
}

/** long arc가 남반구 대우회(인도양·남미)면 true — ICN→LAX/MEX 등 허브 구간 회귀 방지 */
const SOUTHERN_DETOUR_MIN_LAT = -40;

function isSouthernDetourLongArc(start, end, longOmega) {
  return minLatOnArc(start, end, longOmega) < SOUTHERN_DETOUR_MIN_LAT;
}

/** Long arc는 아메리카(dest lng < -30) polar 회피만 — 유럽 short arc는 corridor/guard로 우회 */
const LONG_ARC_DEST_LNG_THRESHOLD = -30;

/**
 * Pick short or long great-circle arc — long arc는 ICN→아메리카 polar·민감공역(short arc 교차) 회피.
 * @param {[number, number]} start
 * @param {[number, number]} end
 */
function chooseGreatCircleOmega(start, end) {
  const v1 = toUnitCartesian(start);
  const v2 = toUnitCartesian(end);
  const dot = Math.max(-1, Math.min(1, dot3(v1, v2)));
  const shortOmega = Math.acos(dot);
  if (shortOmega < 1e-9) return shortOmega;

  const destLng = end[0];
  if (destLng >= LONG_ARC_DEST_LNG_THRESHOLD) return shortOmega;

  const shortMaxLat = maxAbsLatOnArc(start, end, shortOmega);
  const shortArcCoords = [];
  for (let i = 0; i <= 16; i += 1) {
    shortArcCoords.push(fromUnitCartesian(slerpUnit(v1, v2, i / 16, shortOmega)));
  }
  const shortCrossesZones = coordsCrossAvoidZones(shortArcCoords).length > 0;

  if (shortMaxLat <= POLAR_AVOID_ABS_LAT && !shortCrossesZones) return shortOmega;

  const longOmega = 2 * Math.PI - shortOmega;
  const longMaxLat = maxAbsLatOnArc(start, end, longOmega);
  const longArcAntarctic = isAntarcticLongArc(start, end, longOmega);

  if (shortMaxLat > POLAR_AVOID_ABS_LAT) {
    if (longArcAntarctic) return shortOmega;
    return longMaxLat <= shortMaxLat ? longOmega : shortOmega;
  }
  if (longArcAntarctic || isSouthernDetourLongArc(start, end, longOmega)) return shortOmega;
  return longOmega;
}

/** @param {[number, number]} start @param {[number, number]} end */
export function isLongGreatCircleArc(start, end) {
  const v1 = toUnitCartesian(start);
  const v2 = toUnitCartesian(end);
  const dot = Math.max(-1, Math.min(1, dot3(v1, v2)));
  const shortOmega = Math.acos(dot);
  if (shortOmega < 1e-9) return false;
  const omega = chooseGreatCircleOmega(start, end);
  return omega > shortOmega + 1e-6;
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

/** @param {[number, number][]} geoWaypoints @param {[number, number][]} hubCoords @param {[number, number][]} [postHubWaypoints] */
function buildRouteAnchors(originLngLat, destLngLat, geoWaypoints, hubCoords, postHubWaypoints = []) {
  if (!geoWaypoints.length && !hubCoords.length && !postHubWaypoints.length) {
    return [originLngLat, destLngLat];
  }
  return dedupeConsecutiveAnchors([
    originLngLat,
    ...geoWaypoints,
    ...hubCoords,
    ...postHubWaypoints,
    destLngLat,
  ]);
}

/** @param {string[]} hubIatas */
function hubIatasToCoords(hubIatas) {
  return hubIatas
    .map((iata) => getAirportHubCoords(iata))
    .filter(Boolean)
    .map((hub) => [hub.lng, hub.lat]);
}

/**
 * hub 우선순위: overrides/timeline → corridor → avoid guard.
 * @returns {{ hubIatas: string[], geoWaypoints: [number, number][], anchors: [number, number][] }}
 */
export function resolveFlightRoutePlan(originLngLat, destLngLat, location, options = {}) {
  const originIata = options.originIata ?? DEFAULT_ORIGIN_IATA;
  const destIata = options.destIata;

  const overrideHubIatas = Array.isArray(options.hubIatas) && options.hubIatas.length
    ? options.hubIatas
    : getFlightRouteHubIatas(location, {
        originIata,
        destIata,
        essentialGuide: options.essentialGuide,
      });
  let geoWaypoints = getFlightRouteWaypoints(location);
  let postHubWaypoints = [];
  let hubIatas = [...overrideHubIatas];
  const hasOverrideHubs = overrideHubIatas.length > 0;

  if (!hasOverrideHubs) {
    const corridor = resolveRegionalCorridorAnchors(originLngLat, destLngLat, { originIata });
    if (corridor) {
      if (!geoWaypoints.length) geoWaypoints = [...corridor.waypoints];
      postHubWaypoints = [...(corridor.postHubWaypoints ?? [])];
      hubIatas = [...corridor.hubIatas];
    }
  }

  let hubCoords = hubIatasToCoords(hubIatas);

  if (
    String(originIata).trim().toUpperCase() === DEFAULT_ORIGIN_IATA
    && hubIatas.includes('DXB')
    && !geoWaypoints.some(([, lat]) => lat <= 35)
  ) {
    geoWaypoints = [ICN_EUROPE_DEPARTURE_WAYPOINT, ...geoWaypoints];
  }

  let anchors = buildRouteAnchors(originLngLat, destLngLat, geoWaypoints, hubCoords, postHubWaypoints);

  if (
    !hasOverrideHubs
    && !isRussiaDestinationLocation(location, destLngLat, destIata)
  ) {
    const chain = buildGreatCircleChain(anchors, 24);
    const crossed = coordsCrossAvoidZones(chain);
    if (crossed.length > 0) {
      const guard = resolveSouthernCorridorAnchors(destLngLat, { originIata });
      geoWaypoints = guard.hubIatas.length
        ? [...guard.waypoints]
        : (geoWaypoints.length ? geoWaypoints : [...guard.waypoints]);
      postHubWaypoints = [...(guard.postHubWaypoints ?? [])];
      hubIatas = [...guard.hubIatas];
      hubCoords = hubIatasToCoords(hubIatas);
      anchors = buildRouteAnchors(originLngLat, destLngLat, geoWaypoints, hubCoords, postHubWaypoints);
    }
  }

  return { hubIatas, geoWaypoints, anchors };
}

/**
 * @param {Record<string, unknown> | null | undefined} [location]
 * @returns {[number, number][]}
 */
function resolveRouteAnchors(originLngLat, destLngLat, location, options = {}) {
  return resolveFlightRoutePlan(originLngLat, destLngLat, location, options).anchors;
}

/**
 * 직항 대권 항로 + 구면 측면 오프셋 — 항공 지도에서 흔한 곡선 표현(거리·시간 SSOT는 haversine 유지).
 * @param {[number, number][]} gcLine
 * @param {{ lng: number, lat: number }[]} chainPoints
 */
function bulgeGreatCircleLine(gcLine, chainPoints) {
  const km = estimateFlightHoursChain(chainPoints) * FLIGHT_SPEED_KMH;
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

/** @param {[number, number][]} anchors @param {{ lng: number, lat: number }} hub @param {number} [fromIdx] */
function findHubAnchorIndex(anchors, hub, fromIdx = 1) {
  const tol = 0.08;
  for (let i = fromIdx; i < anchors.length - 1; i += 1) {
    const [lng, lat] = anchors[i];
    if (Math.abs(lng - hub.lng) < tol && Math.abs(lat - hub.lat) < tol) return i;
  }
  let bestIdx = Math.max(fromIdx, 1);
  let bestScore = Infinity;
  for (let i = fromIdx; i < anchors.length - 1; i += 1) {
    const [lng, lat] = anchors[i];
    const score = (lng - hub.lng) ** 2 + (lat - hub.lat) ** 2;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function gcLineIndexForAnchor(anchorIdx, pointsPerSegment, anchorCount) {
  if (anchorIdx <= 0) return 0;
  const lastIdx = (anchorCount - 1) * pointsPerSegment;
  return Math.min(lastIdx, anchorIdx * pointsPerSegment);
}

/**
 * @param {[number, number][]} anchors
 * @param {string[]} hubIatas
 * @param {number} pointsPerSegment
 * @param {number} arcLength
 */
export function buildRouteLegEndIndices(anchors, hubIatas, pointsPerSegment, arcLength) {
  const destIdx = arcLength - 1;
  const hubList = (hubIatas ?? [])
    .map((iata) => getAirportHubCoords(iata))
    .filter(Boolean);
  if (!hubList.length) return [destIdx];

  let prevAnchorIdx = 0;
  const ends = [];
  for (const hub of hubList) {
    const anchorIdx = findHubAnchorIndex(anchors, hub, prevAnchorIdx + 1);
    let arcIdx = gcLineIndexForAnchor(anchorIdx, pointsPerSegment, anchors.length);
    const minIdx = (ends.length ? ends[ends.length - 1] : 0) + 1;
    arcIdx = Math.max(minIdx, Math.min(arcIdx, destIdx - 1));
    ends.push(arcIdx);
    prevAnchorIdx = anchorIdx;
  }
  if (ends[ends.length - 1] !== destIdx) ends.push(destIdx);
  return ends;
}

/**
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {{ points?: number, location?: Record<string, unknown> | null, hubIatas?: string[], essentialGuide?: Record<string, unknown> | null, originIata?: string, destIata?: string }} [options]
 * @returns {{ coords: [number, number][], legEndIndices: number[] }}
 */
export function buildFlightRouteLineWithLegs(originLngLat, destLngLat, options = {}) {
  const points = options.points ?? 80;
  const plan = resolveFlightRoutePlan(originLngLat, destLngLat, options.location, {
    originIata: options.originIata,
    destIata: options.destIata,
    hubIatas: options.hubIatas,
    essentialGuide: options.essentialGuide,
  });
  const { anchors } = plan;
  const hubIatas = Array.isArray(options.hubIatas) && options.hubIatas.length
    ? options.hubIatas
    : plan.hubIatas;
  const pps = Math.max(24, Math.round(points / Math.max(1, anchors.length - 1)));
  const gcLine = buildGreatCircleChain(anchors, pps);

  const origin = { lng: originLngLat[0], lat: originLngLat[1] };
  const dest = { lng: destLngLat[0], lat: destLngLat[1] };
  const chainPoints = [
    origin,
    ...anchors.slice(1, -1).map(([lng, lat]) => ({ lng, lat })),
    dest,
  ];
  const coords = bulgeGreatCircleLine(gcLine, chainPoints);
  const legEndIndices = buildRouteLegEndIndices(anchors, hubIatas, pps, coords.length);
  return { coords, legEndIndices };
}

/**
 * @param {[number, number]} originLngLat
 * @param {[number, number]} destLngLat
 * @param {{ points?: number, location?: Record<string, unknown> | null, hubIatas?: string[], essentialGuide?: Record<string, unknown> | null }} [options]
 */
export function buildFlightRouteLine(originLngLat, destLngLat, options = {}) {
  return buildFlightRouteLineWithLegs(originLngLat, destLngLat, options).coords;
}

/** @param {[number, number][]} coords */
export function sliceArcProgress(coords, progress) {
  const t = Math.min(1, Math.max(0, progress));
  if (!coords.length) return [];
  if (t <= 0) return [coords[0]];
  const lastIndex = Math.max(1, Math.floor(t * (coords.length - 1)));
  return coords.slice(0, lastIndex + 1);
}

/** @param {[number, number][]} coords @param {number} startIdx @param {number} endIdx @param {number} progress */
export function sliceArcLegProgress(coords, startIdx, endIdx, progress) {
  const t = Math.min(1, Math.max(0, progress));
  if (!coords.length) return [];
  const from = Math.max(0, Math.min(startIdx, coords.length - 1));
  const to = Math.max(from, Math.min(endIdx, coords.length - 1));
  if (t <= 0) return coords.slice(0, from + 1);
  const idx = Math.max(from, Math.floor(from + t * (to - from)));
  return coords.slice(0, idx + 1);
}

/**
 * @param {number[]} legEndIndices
 * @param {{ drawMs?: number, legPauseMs?: number, initialDelayMs?: number }} [options]
 */
export function buildFlightArcDrawSchedule(legEndIndices, options = {}) {
  const {
    drawMs = 6500,
    legPauseMs = FLIGHT_CINEMA_LEG_PAUSE_MS,
    initialDelayMs = FLIGHT_CINEMA_INITIAL_DELAY_MS,
  } = options;

  const ends = legEndIndices?.length ? legEndIndices : [0];
  const totalSpan = Math.max(1, ends[ends.length - 1]);
  /** @type {{ startIdx: number, endIdx: number, drawStartMs: number, drawEndMs: number }[]} */
  const legs = [];
  let prevEnd = 0;
  let cursor = initialDelayMs;

  for (let i = 0; i < ends.length; i += 1) {
    const endIdx = ends[i];
    const span = Math.max(1, endIdx - prevEnd);
    const legDrawMs = Math.max(400, Math.round(drawMs * (span / totalSpan)));
    legs.push({
      startIdx: prevEnd,
      endIdx,
      drawStartMs: cursor,
      drawEndMs: cursor + legDrawMs,
    });
    cursor += legDrawMs;
    if (i < ends.length - 1) cursor += legPauseMs;
    prevEnd = endIdx;
  }

  return { legs, totalMs: cursor, initialDelayMs, legPauseMs };
}

/**
 * @param {[number, number][]} fullArc
 * @param {ReturnType<typeof buildFlightArcDrawSchedule>} schedule
 * @param {number} elapsedMs
 */
export function resolveArcDrawAtTime(fullArc, schedule, elapsedMs) {
  if (!fullArc?.length) return [];
  const { legs, initialDelayMs } = schedule ?? {};
  if (!legs?.length) return fullArc.slice(0, 1);
  const t = Math.max(0, elapsedMs);

  if (t < initialDelayMs) return fullArc.slice(0, 1);

  for (let i = 0; i < legs.length; i += 1) {
    const leg = legs[i];
    if (t < leg.drawStartMs) {
      const prevEnd = legs[i - 1]?.endIdx ?? 0;
      return fullArc.slice(0, prevEnd + 1);
    }
    if (t <= leg.drawEndMs) {
      const progress = (t - leg.drawStartMs) / Math.max(1, leg.drawEndMs - leg.drawStartMs);
      return sliceArcLegProgress(fullArc, leg.startIdx, leg.endIdx, progress);
    }
  }

  const last = legs[legs.length - 1];
  return fullArc.slice(0, last.endIdx + 1);
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
  const destIata = resolveCinemaDestIata(location, {
    essentialGuide: options.essentialGuide,
  });
  const originIata = options.originIata ?? DEFAULT_ORIGIN_IATA;
  if (!destIata || !originIata) return null;

  const normalizedOrigin = String(originIata).trim().toUpperCase();
  const normalizedDest = String(destIata).trim().toUpperCase();
  if (normalizedOrigin === normalizedDest) return null;

  const origin = getAirportHubCoords(normalizedOrigin);
  const dest = getAirportHubCoords(normalizedDest);
  if (!origin || !dest) return null;

  const plan = resolveFlightRoutePlan(
    [origin.lng, origin.lat],
    [dest.lng, dest.lat],
    location,
    {
      originIata: normalizedOrigin,
      destIata: normalizedDest,
      essentialGuide: options.essentialGuide,
    }
  );
  const hubIatas = plan.hubIatas;
  const routeIatas = [normalizedOrigin, ...hubIatas, normalizedDest];
  const chainPoints = [
    origin,
    ...hubIatas
      .map((iata) => getAirportHubCoords(iata))
      .filter(Boolean),
    dest,
  ];

  return {
    originIata: normalizedOrigin,
    destIata: normalizedDest,
    hubIatas,
    routeIatas,
    isConnecting: hubIatas.length > 0,
    origin,
    dest,
    flightHours: estimateFlightHoursChain(chainPoints),
    flightLegHours: estimateFlightLegHours(routeIatas),
  };
}

/**
 * 써머리 카드 — ICN → 도착 IATA (플래너·Trip SSOT)
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 */
export function resolveSummaryFlightCinemaOd(location, options = {}) {
  return resolveFlightCinemaOd(location, options);
}

/** @param {Record<string, unknown> | null | undefined} location @param {{ essentialGuide?: Record<string, unknown> | null }} [options] */
export function canPreviewFlightRoute(location, options = {}) {
  return Boolean(resolveSummaryFlightCinemaOd(location, options));
}

export const FLIGHT_CINEMA_DURATION_MS = 10000;
export const FLIGHT_CINEMA_LEG_PAUSE_MS = 700;
export const FLIGHT_CINEMA_INITIAL_DELAY_MS = 500;

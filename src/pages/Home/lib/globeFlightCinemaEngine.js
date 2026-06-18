import {
  buildFlightRouteLineWithLegs,
  buildFlightArcDrawSchedule,
  computeRouteCameraView,
  getAirportHubCoords,
  resolveArcDrawAtTime,
  FLIGHT_CINEMA_DURATION_MS,
  FLIGHT_CINEMA_INITIAL_DELAY_MS,
  FLIGHT_CINEMA_LEG_PAUSE_MS,
} from './globeFlightCinema.js';
import { normalizeLngNear } from './globeLngUtils.js';

export const FLIGHT_CINEMA_ARC_SOURCE_ID = 'gateo-flight-cinema-arc';
export const FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID = 'gateo-flight-cinema-endpoints';
export const FLIGHT_CINEMA_ARC_LAYER_ID = 'gateo-flight-cinema-arc-line';
export const FLIGHT_CINEMA_ARC_GLOW_LAYER_ID = 'gateo-flight-cinema-arc-glow';
export const FLIGHT_CINEMA_AIRPORT_LAYER_ID = 'gateo-flight-cinema-airports';
export const FLIGHT_CINEMA_AIRPORT_LABEL_LAYER_ID = 'gateo-flight-cinema-airport-labels';
/** @deprecated legacy layer ids for label-policy compat */
export const FLIGHT_CINEMA_ORIGIN_LAYER_ID = 'gateo-flight-cinema-origin';
/** @deprecated legacy layer ids for label-policy compat */
export const FLIGHT_CINEMA_DEST_LAYER_ID = 'gateo-flight-cinema-dest';

export const FLIGHT_CINEMA_LAYER_IDS = [
  FLIGHT_CINEMA_ARC_GLOW_LAYER_ID,
  FLIGHT_CINEMA_ARC_LAYER_ID,
  FLIGHT_CINEMA_AIRPORT_LAYER_ID,
  FLIGHT_CINEMA_AIRPORT_LABEL_LAYER_ID,
];

const EMPTY_FC = { type: 'FeatureCollection', features: [] };

const ARC_LINE_CORE = {
  'line-color': '#ffffff',
  'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.5, 4, 4, 8, 6],
  'line-opacity': 1,
};

const ARC_LINE_GLOW = {
  'line-color': '#38bdf8',
  'line-width': ['interpolate', ['linear'], ['zoom'], 1, 6, 4, 10, 8, 14],
  'line-opacity': 0.55,
  'line-blur': 1.2,
};

function safeMapUpdate(map, fn) {
  if (!map?.getStyle?.() || map._removed) return;
  try {
    fn();
  } catch {
    // Style may be mid-transition.
  }
}

function arcLineFeature(coords) {
  const lineCoords = coords.length >= 2
    ? coords
    : coords.length === 1
      ? [coords[0], coords[0]]
      : [];
  return {
    type: 'FeatureCollection',
    features: lineCoords.length >= 2
      ? [{
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: lineCoords },
        }]
      : [],
  };
}

const AIRPORT_ROLE = ['get', 'role'];

const AIRPORT_DOT_PAINT = {
  'circle-radius': [
    'interpolate',
    ['linear'],
    ['zoom'],
    1,
    ['match', AIRPORT_ROLE, 'dest', 6, 'hub', 4, 5],
    4,
    ['match', AIRPORT_ROLE, 'dest', 10, 'hub', 7, 9],
    8,
    ['match', AIRPORT_ROLE, 'dest', 14, 'hub', 10, 12],
  ],
  'circle-color': [
    'match',
    AIRPORT_ROLE,
    'origin',
    '#22d3ee',
    'dest',
    '#fbbf24',
    'hub',
    '#ef4444',
    '#ffffff',
  ],
  'circle-stroke-width': 2.5,
  'circle-stroke-color': '#ffffff',
};

const AIRPORT_LABEL_LAYOUT = {
  'text-field': ['get', 'iata'],
  'text-size': ['interpolate', ['linear'], ['zoom'], 1, 15, 4, 19, 8, 24],
  'text-offset': [
    'interpolate',
    ['linear'],
    ['zoom'],
    1,
    ['literal', [0.75, 0]],
    4,
    ['literal', [0.9, 0]],
    8,
    ['literal', [1.1, 0]],
  ],
  'text-anchor': 'left',
  'text-max-width': 8,
  'text-allow-overlap': true,
  'text-ignore-placement': true,
  'text-letter-spacing': 0.08,
};

const AIRPORT_LABEL_PAINT = {
  'text-color': '#ffffff',
  'text-halo-color': 'rgba(2,6,23,0.95)',
  'text-halo-width': 1.5,
};

function routeAirportsFeature(originIata, destIata, hubIatas = []) {
  /** @type {import('geojson').Feature[]} */
  const features = [];
  const seen = new Set();

  const pushAirport = (iata, role) => {
    const code = String(iata || '').trim().toUpperCase();
    if (!code || seen.has(code)) return;
    const hub = getAirportHubCoords(code);
    if (!hub) return;
    seen.add(code);
    features.push({
      type: 'Feature',
      properties: { role, iata: code },
      geometry: { type: 'Point', coordinates: [hub.lng, hub.lat] },
    });
  };

  pushAirport(originIata, 'origin');
  for (const hubIata of hubIatas) pushAirport(hubIata, 'hub');
  pushAirport(destIata, 'dest');

  return { type: 'FeatureCollection', features };
}

function removeLegacyAirportLayers(map) {
  for (const legacyId of [FLIGHT_CINEMA_ORIGIN_LAYER_ID, FLIGHT_CINEMA_DEST_LAYER_ID]) {
    if (map.getLayer(legacyId)) {
      try {
        map.removeLayer(legacyId);
      } catch {
        // Style may be mid-transition.
      }
    }
  }
}

function applyLayerPaint(map, layerId, paint) {
  if (!map.getLayer(layerId)) return;
  for (const [key, value] of Object.entries(paint)) {
    try {
      map.setPaintProperty(layerId, key, value);
    } catch {
      // Style may be mid-transition.
    }
  }
}

function applyLayerLayout(map, layerId, layout) {
  if (!map.getLayer(layerId)) return;
  for (const [key, value] of Object.entries(layout)) {
    try {
      map.setLayoutProperty(layerId, key, value);
    } catch {
      // Style may be mid-transition.
    }
  }
}

export function isFlightCinemaLayer(layerId = '') {
  const id = String(layerId);
  return FLIGHT_CINEMA_LAYER_IDS.includes(id)
    || id === FLIGHT_CINEMA_ORIGIN_LAYER_ID
    || id === FLIGHT_CINEMA_DEST_LAYER_ID;
}

export function setupFlightCinemaLayers(map, { visible = true } = {}) {
  if (!map?.getStyle?.() || !map.isStyleLoaded?.()) return false;

  try {
    if (!map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID)) {
      map.addSource(FLIGHT_CINEMA_ARC_SOURCE_ID, { type: 'geojson', data: EMPTY_FC });
    }
    if (!map.getSource(FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID)) {
      map.addSource(FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID, { type: 'geojson', data: EMPTY_FC });
    }

    if (!map.getLayer(FLIGHT_CINEMA_ARC_GLOW_LAYER_ID)) {
      map.addLayer({
        id: FLIGHT_CINEMA_ARC_GLOW_LAYER_ID,
        type: 'line',
        source: FLIGHT_CINEMA_ARC_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: ARC_LINE_GLOW,
      });
    }

    if (!map.getLayer(FLIGHT_CINEMA_ARC_LAYER_ID)) {
      map.addLayer({
        id: FLIGHT_CINEMA_ARC_LAYER_ID,
        type: 'line',
        source: FLIGHT_CINEMA_ARC_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: ARC_LINE_CORE,
      });
    }

    removeLegacyAirportLayers(map);

    if (!map.getLayer(FLIGHT_CINEMA_AIRPORT_LAYER_ID)) {
      map.addLayer({
        id: FLIGHT_CINEMA_AIRPORT_LAYER_ID,
        type: 'circle',
        source: FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID,
        paint: AIRPORT_DOT_PAINT,
      });
    } else {
      applyLayerPaint(map, FLIGHT_CINEMA_AIRPORT_LAYER_ID, AIRPORT_DOT_PAINT);
    }

    if (!map.getLayer(FLIGHT_CINEMA_AIRPORT_LABEL_LAYER_ID)) {
      map.addLayer({
        id: FLIGHT_CINEMA_AIRPORT_LABEL_LAYER_ID,
        type: 'symbol',
        source: FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID,
        layout: AIRPORT_LABEL_LAYOUT,
        paint: AIRPORT_LABEL_PAINT,
      });
    } else {
      applyLayerLayout(map, FLIGHT_CINEMA_AIRPORT_LABEL_LAYER_ID, AIRPORT_LABEL_LAYOUT);
      applyLayerPaint(map, FLIGHT_CINEMA_AIRPORT_LABEL_LAYER_ID, AIRPORT_LABEL_PAINT);
    }

    for (const layerId of FLIGHT_CINEMA_LAYER_IDS) {
      if (!map.getLayer(layerId)) continue;
      try {
        if (visible) {
          map.setLayerZoomRange(layerId, 0, 24);
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        } else {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
        map.moveLayer(layerId);
      } catch {
        // Style may be mid-transition.
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function clearFlightCinemaLayers(map) {
  if (!map?.getStyle?.()) return;
  safeMapUpdate(map, () => {
    map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID)?.setData(EMPTY_FC);
    map.getSource(FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID)?.setData(EMPTY_FC);
    for (const layerId of FLIGHT_CINEMA_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
  });
}

function normalizeLngNearRef(currentLng, targetLng) {
  return normalizeLngNear(currentLng, targetLng);
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ defaultView?: { longitude: number, latitude: number, zoom: number, pitch?: number, bearing?: number }, flyZoom?: number }} [options]
 */
export function createFlightCinemaEngine(map, options = {}) {
  const defaultView = options.defaultView ?? {
    longitude: 0,
    latitude: 20,
    zoom: 1.25,
    pitch: 0,
    bearing: 0,
  };
  const flyZoom = options.flyZoom ?? 2.35;

  let active = false;
  let animating = false;
  let cancelled = false;
  let rafId = null;
  let runGen = 0;
  let onCompleteRef = null;
  let fullArcRef = null;
  let arcScheduleRef = null;
  let animationStartAt = 0;

  const cleanupTimers = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  /** Stale active/timers without invoking a previous onComplete (re-entry guard). */
  const forceReset = () => {
    active = false;
    animating = false;
    cancelled = false;
    runGen += 1;
    fullArcRef = null;
    arcScheduleRef = null;
    animationStartAt = 0;
    cleanupTimers();
    onCompleteRef = null;
    clearFlightCinemaLayers(map);
  };

  const finish = (reason = 'close') => {
    if (!active) return;
    active = false;
    animating = false;
    runGen += 1;
    fullArcRef = null;
    arcScheduleRef = null;
    animationStartAt = 0;
    cleanupTimers();
    try {
      map.stop();
    } catch {
      // ignore
    }
    clearFlightCinemaLayers(map);
    const cb = onCompleteRef;
    onCompleteRef = null;
    cb?.(reason);
  };

  const cancel = () => {
    if (!active) return;
    cancelled = true;
    finish('cancel');
  };

  const revealFullRoute = () => {
    if (!active) return;
    cleanupTimers();
    animating = false;
    if (fullArcRef) {
      safeMapUpdate(map, () => {
        map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID)?.setData(arcLineFeature(fullArcRef));
      });
    }
  };

  const close = () => {
    if (active) {
      finish('close');
      return;
    }
    clearFlightCinemaLayers(map);
  };

  /**
   * @param {{
   *   originIata: string,
   *   destIata: string,
   *   origin: { lng: number, lat: number },
   *   dest: { lng: number, lat: number },
   *   location?: Record<string, unknown> | null,
   *   hubIatas?: string[],
   *   essentialGuide?: Record<string, unknown> | null,
   *   durationMs?: number,
   *   onComplete?: (reason: string) => void,
   * }} params
   */
  const start = (params) => {
    if (!map?.getStyle?.()) return false;

    if (active) {
      forceReset();
    } else {
      cleanupTimers();
    }

    const originLngLat = [params.origin.lng, params.origin.lat];
    const destLngLat = [params.dest.lng, params.dest.lat];
    const { coords: fullArc, legEndIndices } = buildFlightRouteLineWithLegs(originLngLat, destLngLat, {
      location: params.location ?? null,
      originIata: params.originIata,
      destIata: params.destIata,
      hubIatas: params.hubIatas,
      essentialGuide: params.essentialGuide ?? null,
    });
    fullArcRef = fullArc;
    const durationMs = params.durationMs ?? FLIGHT_CINEMA_DURATION_MS;
    arcScheduleRef = buildFlightArcDrawSchedule(legEndIndices, {
      drawMs: Math.round(durationMs * 0.68),
      legPauseMs: FLIGHT_CINEMA_LEG_PAUSE_MS,
      initialDelayMs: FLIGHT_CINEMA_INITIAL_DELAY_MS,
    });
    const cameraMs = Math.round(durationMs * 0.5);
    const cameraView = computeRouteCameraView(fullArc, params.origin, params.dest, flyZoom);

    if (!setupFlightCinemaLayers(map, { visible: true })) return false;

    const gen = runGen + 1;
    runGen = gen;
    active = true;
    animating = true;
    cancelled = false;
    onCompleteRef = params.onComplete ?? null;

    safeMapUpdate(map, () => {
      map.getSource(FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID)?.setData(
        routeAirportsFeature(params.originIata, params.destIata, params.hubIatas)
      );
      map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID)?.setData(arcLineFeature([originLngLat]));
    });

    autoRotateOff(map);

    const normalizedLng = normalizeLngNearRef(map.getCenter().lng, cameraView.lng);
    const cameraTarget = {
      center: [normalizedLng, cameraView.lat],
      zoom: cameraView.zoom,
      pitch: 0,
      bearing: 0,
    };

    try {
      map.flyTo({
        ...cameraTarget,
        duration: cameraMs,
        essential: true,
      });
    } catch {
      map.jumpTo(cameraTarget);
    }

    animationStartAt = performance.now();

    const tick = (now) => {
      if (!active || cancelled || gen !== runGen) return;
      const schedule = arcScheduleRef;
      const elapsed = now - animationStartAt;
      const partial = resolveArcDrawAtTime(fullArc, schedule, elapsed);
      safeMapUpdate(map, () => {
        map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID)?.setData(arcLineFeature(partial));
      });
      if (elapsed < (schedule?.totalMs ?? 0)) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      animating = false;
      rafId = null;
    };

    rafId = requestAnimationFrame(tick);

    return true;
  };

  return { start, revealFullRoute, close, cancel, forceReset, isActive: () => active };
}

function autoRotateOff(map) {
  // Caller owns autoRotateRef — engine only stops current motion.
  try {
    map.stop();
  } catch {
    // ignore
  }
}

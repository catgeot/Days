import {
  buildFlightRouteLine,
  computeRouteCameraView,
  sliceArcProgress,
  FLIGHT_CINEMA_DURATION_MS,
} from './globeFlightCinema.js';
import { normalizeLngNear } from './globeLngUtils.js';

export const FLIGHT_CINEMA_ARC_SOURCE_ID = 'gateo-flight-cinema-arc';
export const FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID = 'gateo-flight-cinema-endpoints';
export const FLIGHT_CINEMA_ARC_LAYER_ID = 'gateo-flight-cinema-arc-line';
export const FLIGHT_CINEMA_ARC_GLOW_LAYER_ID = 'gateo-flight-cinema-arc-glow';
export const FLIGHT_CINEMA_ORIGIN_LAYER_ID = 'gateo-flight-cinema-origin';
export const FLIGHT_CINEMA_DEST_LAYER_ID = 'gateo-flight-cinema-dest';

export const FLIGHT_CINEMA_LAYER_IDS = [
  FLIGHT_CINEMA_ARC_GLOW_LAYER_ID,
  FLIGHT_CINEMA_ARC_LAYER_ID,
  FLIGHT_CINEMA_ORIGIN_LAYER_ID,
  FLIGHT_CINEMA_DEST_LAYER_ID,
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

function endpointsFeature(originLngLat, destLngLat, originIata, destIata) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { role: 'origin', iata: originIata },
        geometry: { type: 'Point', coordinates: originLngLat },
      },
      {
        type: 'Feature',
        properties: { role: 'dest', iata: destIata },
        geometry: { type: 'Point', coordinates: destLngLat },
      },
    ],
  };
}

export function isFlightCinemaLayer(layerId = '') {
  return FLIGHT_CINEMA_LAYER_IDS.includes(String(layerId));
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

    if (!map.getLayer(FLIGHT_CINEMA_ORIGIN_LAYER_ID)) {
      map.addLayer({
        id: FLIGHT_CINEMA_ORIGIN_LAYER_ID,
        type: 'circle',
        source: FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID,
        filter: ['==', ['get', 'role'], 'origin'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 5, 4, 9, 8, 12],
          'circle-color': '#22d3ee',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    if (!map.getLayer(FLIGHT_CINEMA_DEST_LAYER_ID)) {
      map.addLayer({
        id: FLIGHT_CINEMA_DEST_LAYER_ID,
        type: 'circle',
        source: FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID,
        filter: ['==', ['get', 'role'], 'dest'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 6, 4, 10, 8, 14],
          'circle-color': '#fbbf24',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });
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
  let arcDelayTimer = null;
  let runGen = 0;
  let onCompleteRef = null;
  let fullArcRef = null;

  const cleanupTimers = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (arcDelayTimer != null) {
      clearTimeout(arcDelayTimer);
      arcDelayTimer = null;
    }
  };

  /** Stale active/timers without invoking a previous onComplete (re-entry guard). */
  const forceReset = () => {
    active = false;
    animating = false;
    cancelled = false;
    runGen += 1;
    fullArcRef = null;
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
    const fullArc = buildFlightRouteLine(originLngLat, destLngLat, {
      location: params.location ?? null,
    });
    fullArcRef = fullArc;
    const durationMs = params.durationMs ?? FLIGHT_CINEMA_DURATION_MS;
    const arcDrawMs = Math.round(durationMs * 0.6);
    const cameraMs = Math.round(durationMs * 0.45);
    const cameraView = computeRouteCameraView(fullArc, params.origin, params.dest, flyZoom);

    if (!setupFlightCinemaLayers(map)) return false;

    const gen = runGen + 1;
    runGen = gen;
    active = true;
    animating = true;
    cancelled = false;
    onCompleteRef = params.onComplete ?? null;

    safeMapUpdate(map, () => {
      map.getSource(FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID)?.setData(
        endpointsFeature(originLngLat, destLngLat, params.originIata, params.destIata)
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

    const arcDelayMs = 350;
    const arcStartAt = performance.now() + arcDelayMs;

    const tick = (now) => {
      if (!active || cancelled || gen !== runGen) return;
      const elapsed = now - arcStartAt;
      const progress = Math.min(1, Math.max(0, elapsed / arcDrawMs));
      const partial = sliceArcProgress(fullArc, progress);
      safeMapUpdate(map, () => {
        map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID)?.setData(arcLineFeature(partial));
      });
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      animating = false;
      rafId = null;
    };

    arcDelayTimer = window.setTimeout(() => {
      arcDelayTimer = null;
      if (!active || cancelled || gen !== runGen) return;
      rafId = requestAnimationFrame(tick);
    }, arcDelayMs);

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

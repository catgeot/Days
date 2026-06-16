import {
  buildArcCameraCenter,
  buildGreatCircleLine,
  computeRouteFlyZoom,
  sliceArcProgress,
  FLIGHT_CINEMA_DURATION_MS,
} from './globeFlightCinema.js';

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
  return {
    type: 'FeatureCollection',
    features: coords.length >= 2
      ? [{
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
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

export function setupFlightCinemaLayers(map) {
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
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        try {
          map.moveLayer(layerId);
        } catch {
          // Layer order best-effort.
        }
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

function normalizeLngNear(currentLng, targetLng) {
  let lng = targetLng;
  while (lng - currentLng > 180) lng -= 360;
  while (lng - currentLng < -180) lng += 360;
  return lng;
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
  let cancelled = false;
  let rafId = null;
  let completeTimer = null;
  let onCompleteRef = null;

  const cleanupTimers = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (completeTimer != null) {
      clearTimeout(completeTimer);
      completeTimer = null;
    }
  };

  const finish = (reason = 'complete') => {
    if (!active) return;
    active = false;
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

  const skip = () => {
    if (!active) return;
    finish('skip');
  };

  /**
   * @param {{
   *   originIata: string,
   *   destIata: string,
   *   origin: { lng: number, lat: number },
   *   dest: { lng: number, lat: number },
   *   durationMs?: number,
   *   onComplete?: (reason: string) => void,
   * }} params
   */
  const start = (params) => {
    if (active || !map?.getStyle?.()) return false;

    const originLngLat = [params.origin.lng, params.origin.lat];
    const destLngLat = [params.dest.lng, params.dest.lat];
    const fullArc = buildGreatCircleLine(originLngLat, destLngLat);
    const durationMs = params.durationMs ?? FLIGHT_CINEMA_DURATION_MS;
    const arcDrawMs = Math.round(durationMs * 0.6);
    const cameraMs = Math.round(durationMs * 0.45);
    const routeZoom = computeRouteFlyZoom(params.origin, params.dest, flyZoom);

    if (!setupFlightCinemaLayers(map)) return false;

    active = true;
    cancelled = false;
    onCompleteRef = params.onComplete ?? null;

    const endpointsSource = map.getSource(FLIGHT_CINEMA_ENDPOINTS_SOURCE_ID);
    const arcSource = map.getSource(FLIGHT_CINEMA_ARC_SOURCE_ID);
    endpointsSource?.setData(
      endpointsFeature(originLngLat, destLngLat, params.originIata, params.destIata)
    );
    arcSource?.setData(arcLineFeature([originLngLat]));

    autoRotateOff(map);

    const center = buildArcCameraCenter(originLngLat, destLngLat);
    const normalizedLng = normalizeLngNear(map.getCenter().lng, center.lng);
    const cameraTarget = {
      center: [normalizedLng, center.lat],
      zoom: routeZoom,
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
    const totalMs = arcDelayMs + arcDrawMs + 450;

    const tick = (now) => {
      if (!active || cancelled) return;
      const elapsed = now - arcStartAt;
      const progress = Math.min(1, Math.max(0, elapsed / arcDrawMs));
      const partial = sliceArcProgress(fullArc, progress);
      arcSource?.setData(arcLineFeature(partial));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    window.setTimeout(() => {
      if (!active || cancelled) return;
      rafId = requestAnimationFrame(tick);
    }, arcDelayMs);

    completeTimer = window.setTimeout(() => {
      if (!active) return;
      finish('complete');
    }, totalMs);

    return true;
  };

  return { start, skip, cancel, isActive: () => active };
}

function autoRotateOff(map) {
  // Caller owns autoRotateRef — engine only stops current motion.
  try {
    map.stop();
  } catch {
    // ignore
  }
}

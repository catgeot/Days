const DEM_SOURCE_ID = 'mapbox-dem';
const DEM_SOURCE_URL = 'mapbox://mapbox.mapbox-terrain-dem-v1';
const BUILDINGS_LAYER_ID = 'gateo-tour-3d-buildings';
const COMPOSITE_SOURCE_ID = 'composite';
const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 6000;
const DEFAULT_TERRAIN_EXAGGERATION = 1.5;

/** PlaceMiniMap fill-extrusion pattern — composite/building source-layer. */
const BUILDINGS_LAYER = {
  id: BUILDINGS_LAYER_ID,
  source: COMPOSITE_SOURCE_ID,
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': '#aaa',
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      14.05,
      ['get', 'height']
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      14.05,
      ['get', 'min_height']
    ],
    'fill-extrusion-opacity': 0.6
  }
};

export function isGlobe3dActive(map) {
  if (!map?.getTerrain) return false;
  const terrain = map.getTerrain();
  return Boolean(terrain?.source);
}

export function isGlobe3dBuildingsActive(map) {
  return Boolean(map?.getLayer?.(BUILDINGS_LAYER_ID));
}

function ensureDemSource(map) {
  if (map.getSource(DEM_SOURCE_ID)) return;
  map.addSource(DEM_SOURCE_ID, {
    type: 'raster-dem',
    url: DEM_SOURCE_URL,
    tileSize: 512,
    maxzoom: 14
  });
}

function canUseCompositeBuildings(map) {
  return Boolean(map.getSource?.(COMPOSITE_SOURCE_ID));
}

/** Add fill-extrusion buildings; returns false when style has no composite source (e.g. Standard). */
function ensureBuildingsLayer(map) {
  if (map.getLayer(BUILDINGS_LAYER_ID)) return true;
  if (!canUseCompositeBuildings(map)) return false;
  map.addLayer(BUILDINGS_LAYER);
  return true;
}

function removeBuildingsLayer(map) {
  try {
    if (map.getLayer(BUILDINGS_LAYER_ID)) {
      map.removeLayer(BUILDINGS_LAYER_ID);
    }
  } catch {
    // Layer may be mid-transition.
  }
}

/**
 * Enable Mapbox DEM terrain (+ optional 3D buildings).
 * Resolves when tiles load or timeout (globe rotation never idles).
 */
export function bootstrapGlobe3d(map, {
  exaggeration = DEFAULT_TERRAIN_EXAGGERATION,
  buildings = false,
  timeoutMs = DEFAULT_BOOTSTRAP_TIMEOUT_MS
} = {}) {
  if (!map || map._removed) {
    return Promise.reject(new Error('Map unavailable for 3D bootstrap'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const waitKeys = new Set(['terrain']);
    const listeners = [];

    const addListener = (event, handler) => {
      map.on(event, handler);
      listeners.push([event, handler]);
    };

    const cleanup = () => {
      clearTimeout(timer);
      listeners.forEach(([event, handler]) => map.off(event, handler));
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      removeBuildingsLayer(map);
      reject(error);
    };

    const waitForIdleAfterSource = () => {
      addListener('idle', () => finish());
      requestAnimationFrame(() => {
        if (!settled && typeof map.isMoving === 'function' && !map.isMoving()) {
          finish();
        }
      });
    };

    const markReady = (key) => {
      if (!waitKeys.has(key)) return;
      waitKeys.delete(key);
      if (waitKeys.size === 0) waitForIdleAfterSource();
    };

    const onError = (event) => fail(event?.error || new Error('3D bootstrap failed'));
    const timer = setTimeout(finish, timeoutMs);

    if (buildings && ensureBuildingsLayer(map)) {
      waitKeys.add('buildings');
      if (map.isSourceLoaded?.(COMPOSITE_SOURCE_ID)) {
        markReady('buildings');
      } else {
        addListener('sourcedata', (event) => {
          if (event.sourceId !== COMPOSITE_SOURCE_ID || !event.isSourceLoaded) return;
          markReady('buildings');
        });
      }
    }

    const onDemSourceData = (event) => {
      if (event.sourceId !== DEM_SOURCE_ID || !event.isSourceLoaded) return;
      markReady('terrain');
    };

    try {
      map.stop();
      ensureDemSource(map);
      map.setTerrain({ source: DEM_SOURCE_ID, exaggeration });

      if (map.isSourceLoaded?.(DEM_SOURCE_ID)) {
        markReady('terrain');
      } else {
        addListener('sourcedata', onDemSourceData);
      }
      addListener('error', onError);
    } catch (error) {
      fail(error);
    }
  });
}

/** Tear down terrain, buildings layer, and DEM source — return to flat 2D globe. */
export function teardownGlobe3d(map) {
  if (!map || map._removed) return;
  removeBuildingsLayer(map);
  try {
    map.setTerrain(null);
  } catch {
    // Ignore terrain reset during style transitions.
  }
  try {
    if (map.getSource(DEM_SOURCE_ID)) {
      map.removeSource(DEM_SOURCE_ID);
    }
  } catch {
    // Source may still be referenced mid-transition.
  }
}

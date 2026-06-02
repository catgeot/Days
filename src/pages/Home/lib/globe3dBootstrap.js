const DEM_SOURCE_ID = 'mapbox-dem';
const DEM_SOURCE_URL = 'mapbox://mapbox.mapbox-terrain-dem-v1';
const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 6000;

export function isGlobe3dActive(map) {
  if (!map?.getTerrain) return false;
  const terrain = map.getTerrain();
  return Boolean(terrain?.source);
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

/** Enable Mapbox DEM terrain; resolve when tiles load or timeout (globe rotation never idles). */
export function bootstrapGlobe3d(map, { exaggeration = 1.5, timeoutMs = DEFAULT_BOOTSTRAP_TIMEOUT_MS } = {}) {
  if (!map || map._removed) {
    return Promise.reject(new Error('Map unavailable for 3D bootstrap'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      map.off('idle', onIdle);
      map.off('sourcedata', onSourceData);
      map.off('error', onError);
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
      reject(error);
    };

    const onIdle = () => finish();
    const onError = (event) => fail(event?.error || new Error('Terrain bootstrap failed'));
    const timer = setTimeout(finish, timeoutMs);

    const waitForIdleAfterSource = () => {
      map.once('idle', onIdle);
      requestAnimationFrame(() => {
        if (!settled && typeof map.isMoving === 'function' && !map.isMoving()) {
          finish();
        }
      });
    };

    const onSourceData = (event) => {
      if (event.sourceId !== DEM_SOURCE_ID || !event.isSourceLoaded) return;
      map.off('sourcedata', onSourceData);
      waitForIdleAfterSource();
    };

    try {
      map.stop();
      ensureDemSource(map);
      map.setTerrain({ source: DEM_SOURCE_ID, exaggeration });

      if (map.isSourceLoaded?.(DEM_SOURCE_ID)) {
        waitForIdleAfterSource();
      } else {
        map.on('sourcedata', onSourceData);
      }
      map.once('error', onError);
    } catch (error) {
      fail(error);
    }
  });
}

/** Tear down terrain and DEM source — return to flat 2D globe. */
export function teardownGlobe3d(map) {
  if (!map || map._removed) return;
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

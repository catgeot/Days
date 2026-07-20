export const REACH_SOURCE_ID = 'gateo-reach-boundaries';
export const REACH_DRIVE_FILL_ID = 'gateo-reach-drive-fill';
export const REACH_DRIVE_HALO_ID = 'gateo-reach-drive-halo';
export const REACH_DRIVE_LINE_ID = 'gateo-reach-drive-line';
export const REACH_WALK_HALO_ID = 'gateo-reach-walk-halo';
export const REACH_WALK_LINE_ID = 'gateo-reach-walk-line';

/** @deprecated walk fill only — kept for cleanup of older sessions */
const LEGACY_LAYER_IDS = ['gateo-reach-walk-fill'];

export const REACH_LAYER_IDS = [
  REACH_DRIVE_FILL_ID,
  REACH_DRIVE_HALO_ID,
  REACH_DRIVE_LINE_ID,
  REACH_WALK_HALO_ID,
  REACH_WALK_LINE_ID
];

export function isReachBoundaryLayer(layerId = '') {
  const id = String(layerId);
  return id.startsWith('gateo-reach') || REACH_LAYER_IDS.includes(id);
}

/** Default contour minutes — walk: immediate neighborhood, drive: local day-trip bubble. */
export const REACH_CONTOUR_MINUTES = {
  walk: 20,
  drive: 30
};

/** Circle fallback radii (km) when Isochrone API is unavailable. */
const FALLBACK_RADIUS_KM = {
  walk: 1.6,
  drive: 24
};

/**
 * Walk: line contours along pedestrian network (detail preserved).
 * Drive: road-network isochrone polygon — semi-transparent fill + softened outer edge
 * (industry default: TravelTime, Geoapify, Mapbox demos; not distance circles).
 */
const ISOCHRONE_FETCH = {
  walk: { profile: 'walking', polygons: false, generalizeM: null },
  drive: { profile: 'driving', polygons: true, generalizeM: 500 }
};

const EMPTY_FC = { type: 'FeatureCollection', features: [] };

const MODE_FILTER = (mode) => ['==', ['get', 'mode'], mode];

const DRIVE_HALO_WIDTH = ['interpolate', ['linear'], ['zoom'], 10, 5, 13, 7, 16, 10];
const DRIVE_LINE_WIDTH = ['interpolate', ['linear'], ['zoom'], 10, 2, 13, 2.8, 16, 3.5];
const WALK_HALO_WIDTH = ['interpolate', ['linear'], ['zoom'], 10, 4, 13, 6, 16, 8];
const WALK_LINE_WIDTH = ['interpolate', ['linear'], ['zoom'], 10, 1.8, 13, 2.4, 16, 3];

function safeMapUpdate(map, fn) {
  try {
    if (!map?.getStyle?.()?.layers) return;
    fn();
  } catch {
    // Style may be reloading after theme changes.
  }
}

/** Approximate geodesic circle — offline fallback for isochrone failures. */
export function geodesicCirclePolygon(lng, lat, radiusKm, pointCount = 64) {
  const coords = [];
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const angularDist = radiusKm / 6371;

  for (let i = 0; i <= pointCount; i += 1) {
    const bearing = (i / pointCount) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(angularDist)
        + Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearing)
    );
    const lng2 = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDist) * Math.cos(latRad),
      Math.cos(angularDist) - Math.sin(latRad) * Math.sin(lat2)
    );
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return { type: 'Polygon', coordinates: [coords] };
}

function fallbackFeature(lng, lat, mode) {
  const radiusKm = FALLBACK_RADIUS_KM[mode] ?? 5;
  return {
    type: 'Feature',
    properties: { mode, fallback: true },
    geometry: geodesicCirclePolygon(lng, lat, radiusKm)
  };
}

async function fetchIsochroneProfile(lng, lat, profile, minutes, token, {
  polygons = false,
  generalizeM = null
} = {}) {
  const url = new URL(
    `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}`
  );
  url.searchParams.set('contours_minutes', String(minutes));
  url.searchParams.set('polygons', polygons ? 'true' : 'false');
  if (Number.isFinite(generalizeM) && generalizeM > 0) {
    url.searchParams.set('generalize', String(generalizeM));
  } else if (!polygons) {
    // Walking lines: keep full path detail.
    url.searchParams.set('generalize', '0');
  }
  url.searchParams.set('access_token', token);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`isochrone ${profile} ${res.status}`);
  const data = await res.json();
  if (!data?.features?.length) throw new Error(`isochrone ${profile} empty`);
  return data.features;
}

/**
 * Fetch walking line contours + driving isochrone polygons.
 * Falls back to geodesic circles when the Isochrone API is unavailable.
 * @returns {import('geojson').FeatureCollection}
 */
export async function resolveReachBoundaryGeoJSON(lng, lat, token, {
  walkMinutes = REACH_CONTOUR_MINUTES.walk,
  driveMinutes = REACH_CONTOUR_MINUTES.drive
} = {}) {
  const features = [];

  const profiles = [
    { mode: 'walk', minutes: walkMinutes, ...ISOCHRONE_FETCH.walk },
    { mode: 'drive', minutes: driveMinutes, ...ISOCHRONE_FETCH.drive }
  ];

  await Promise.all(profiles.map(async ({ mode, profile, minutes, polygons, generalizeM }) => {
    try {
      if (token) {
        const isoFeatures = await fetchIsochroneProfile(lng, lat, profile, minutes, token, {
          polygons,
          generalizeM
        });
        for (const feature of isoFeatures) {
          features.push({
            ...feature,
            properties: {
              ...(feature.properties || {}),
              mode,
              contourMinutes: minutes
            }
          });
        }
        return;
      }
    } catch {
      // Fall through to circle fallback.
    }
    features.push(fallbackFeature(lng, lat, mode));
  }));

  return { type: 'FeatureCollection', features };
}

export function reachBoundaryLayersReady(map) {
  if (!map?.getStyle?.()) return false;
  return REACH_LAYER_IDS.every((id) => Boolean(map.getLayer(id)));
}

function removeLegacyLayers(map) {
  for (const layerId of LEGACY_LAYER_IDS) {
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    } catch {
      // Layer may be mid-transition.
    }
  }
}

function raiseReachBoundaryLayers(map) {
  for (const layerId of REACH_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.moveLayer(layerId);
    } catch {
      // Layer may be mid-transition.
    }
  }
}

export function setupReachBoundaryLayers(map) {
  if (!map?.getStyle?.() || !map.isStyleLoaded?.()) return false;

  try {
    removeLegacyLayers(map);

    if (!map.getSource(REACH_SOURCE_ID)) {
      map.addSource(REACH_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FC
      });
    }

    if (!map.getLayer(REACH_DRIVE_FILL_ID)) {
      try {
        map.addLayer({
          id: REACH_DRIVE_FILL_ID,
          type: 'fill',
          source: REACH_SOURCE_ID,
          filter: MODE_FILTER('drive'),
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.16,
            'fill-outline-color': 'transparent'
          }
        });
      } catch {
        // Continue — partial layers still render; next sync retries missing ids.
      }
    }

    const lineLayerDefs = [
      {
        id: REACH_DRIVE_HALO_ID,
        filter: MODE_FILTER('drive'),
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f172a',
          'line-width': DRIVE_HALO_WIDTH,
          'line-opacity': 0.35,
          'line-blur': 0.35
        }
      },
      {
        id: REACH_DRIVE_LINE_ID,
        filter: MODE_FILTER('drive'),
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#60a5fa',
          'line-width': DRIVE_LINE_WIDTH,
          'line-opacity': 0.72
        }
      },
      {
        id: REACH_WALK_HALO_ID,
        filter: MODE_FILTER('walk'),
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f172a',
          'line-width': WALK_HALO_WIDTH,
          'line-opacity': 0.5,
          'line-blur': 0.35
        }
      },
      {
        id: REACH_WALK_LINE_ID,
        filter: MODE_FILTER('walk'),
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#4ade80',
          'line-width': WALK_LINE_WIDTH,
          'line-opacity': 1,
          'line-dasharray': [2.2, 1.4]
        }
      }
    ];

    for (const def of lineLayerDefs) {
      if (map.getLayer(def.id)) continue;
      try {
        map.addLayer({
          id: def.id,
          type: 'line',
          source: REACH_SOURCE_ID,
          filter: def.filter,
          layout: def.layout,
          paint: def.paint
        });
      } catch {
        // Continue — partial layers still render; next sync retries missing ids.
      }
    }

    raiseReachBoundaryLayers(map);
    return true;
  } catch {
    return false;
  }
}

/** Soft landing after tour — settle to oblique explore pitch (not top-down). Bearing unchanged. */
const TOUR_SETTLE_PITCH = 52;

export function easeCameraForReachReveal(map) {
  if (!map?.easeTo) return;
  const pitch = map.getPitch?.() ?? 0;
  const zoom = map.getZoom?.() ?? 12;
  if (pitch <= TOUR_SETTLE_PITCH) return;

  map.easeTo({
    pitch: TOUR_SETTLE_PITCH,
    zoom: Math.max(zoom - 0.35, 11.0),
    duration: 1200,
    essential: true
  });
}

export function updateReachBoundarySource(map, geojson) {
  if (!map?.getStyle?.()) return;
  const source = map.getSource(REACH_SOURCE_ID);
  if (!source) return;
  source.setData(geojson || EMPTY_FC);
}

export function clearReachBoundaries(map) {
  updateReachBoundarySource(map, EMPTY_FC);
}

export function setReachBoundaryVisibility(map, visible) {
  if (!map?.getStyle?.()) return;
  const visibility = visible ? 'visible' : 'none';
  safeMapUpdate(map, () => {
    for (const layerId of [...REACH_LAYER_IDS, ...LEGACY_LAYER_IDS]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  });
}

import { getClusterMembersWithCoords } from '../../../utils/travelSpotClusters.js';

export const CLUSTER_HULL_SOURCE_ID = 'gateo-cluster-hull';
export const CLUSTER_POI_SOURCE_ID = 'gateo-cluster-poi';
export const CLUSTER_HULL_FILL_ID = 'gateo-cluster-hull-fill';
export const CLUSTER_HULL_LINE_ID = 'gateo-cluster-hull-line';
export const CLUSTER_POI_DOT_ID = 'gateo-cluster-poi-dot';
export const CLUSTER_POI_LABEL_ID = 'gateo-cluster-poi-label';

export const CLUSTER_LAYER_IDS = [
  CLUSTER_HULL_FILL_ID,
  CLUSTER_HULL_LINE_ID,
  CLUSTER_POI_DOT_ID,
  CLUSTER_POI_LABEL_ID
];

const EMPTY_FC = { type: 'FeatureCollection', features: [] };

const HULL_PADDING_RATIO = 0.12;

export function isClusterBoundaryLayer(layerId = '') {
  const id = String(layerId);
  return id.startsWith('gateo-cluster');
}

function cross(o, a, b) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Andrew's monotone chain convex hull — lng/lat treated as planar (regional clusters only). */
export function convexHullLngLat(points) {
  if (!points?.length) return [];
  if (points.length === 1) return [...points];

  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function expandRingFromCentroid(ring, ratio = HULL_PADDING_RATIO) {
  if (!ring.length) return ring;
  const cx = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
  const cy = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
  return ring.map(([lng, lat]) => [
    lng + (lng - cx) * ratio,
    lat + (lat - cy) * ratio
  ]);
}

function bboxPolygonFromPoints(points, padDeg = 0.35) {
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const minLng = Math.min(...lngs) - padDeg;
  const maxLng = Math.max(...lngs) + padDeg;
  const minLat = Math.min(...lats) - padDeg;
  const maxLat = Math.max(...lats) + padDeg;
  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat]
  ];
}

function buildHullRing(members) {
  const coords = members.map((m) => [m.lng, m.lat]);
  if (coords.length === 1) {
    return bboxPolygonFromPoints(coords, 0.45);
  }
  if (coords.length === 2) {
    return bboxPolygonFromPoints(coords, 0.55);
  }
  const hull = convexHullLngLat(coords);
  if (hull.length < 3) return bboxPolygonFromPoints(coords, 0.45);
  const expanded = expandRingFromCentroid(hull);
  return [...expanded, expanded[0]];
}

/**
 * @param {string | null | undefined} focusSlug
 * @returns {{ hull: import('geojson').FeatureCollection, poi: import('geojson').FeatureCollection, meta: { clusterId: string, labelKo: string } | null }}
 */
export function buildClusterOverlayGeoJSON(focusSlug) {
  const cluster = getClusterMembersWithCoords(focusSlug);
  if (!cluster) {
    return { hull: EMPTY_FC, poi: EMPTY_FC, meta: null };
  }

  const ring = buildHullRing(cluster.members);
  const hull = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        clusterId: cluster.clusterId,
        labelKo: cluster.labelKo
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring]
      }
    }]
  };

  const poiFeatures = cluster.members
    .filter((m) => !m.isCurrent)
    .map((m) => ({
      type: 'Feature',
      properties: {
        slug: m.slug,
        name: m.name,
        clusterId: cluster.clusterId
      },
      geometry: {
        type: 'Point',
        coordinates: [m.lng, m.lat]
      }
    }));

  return {
    hull,
    poi: { type: 'FeatureCollection', features: poiFeatures },
    meta: { clusterId: cluster.clusterId, labelKo: cluster.labelKo }
  };
}

function safeMapUpdate(map, fn) {
  try {
    if (!map?.getStyle?.()?.layers) return;
    fn();
  } catch {
    // Style may be reloading after theme changes.
  }
}

export function clusterBoundaryLayersReady(map) {
  if (!map?.getStyle?.()) return false;
  try {
    return CLUSTER_LAYER_IDS.every((id) => Boolean(map.getLayer(id)));
  } catch {
    // getLayer throws while style is mid-load.
    return false;
  }
}

function raiseClusterBoundaryLayers(map) {
  for (const layerId of CLUSTER_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.moveLayer(layerId);
    } catch {
      // Layer may be mid-transition.
    }
  }
}

export function setupClusterBoundaryLayers(map) {
  if (!map?.getStyle?.() || !map.isStyleLoaded?.()) return false;

  try {
    if (!map.getSource(CLUSTER_HULL_SOURCE_ID)) {
      map.addSource(CLUSTER_HULL_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FC
      });
    }
    if (!map.getSource(CLUSTER_POI_SOURCE_ID)) {
      map.addSource(CLUSTER_POI_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FC
      });
    }

    if (!map.getLayer(CLUSTER_HULL_FILL_ID)) {
      map.addLayer({
        id: CLUSTER_HULL_FILL_ID,
        type: 'fill',
        source: CLUSTER_HULL_SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': '#f59e0b',
          // 면 채움 비활성 — 경계선(line)만 노출
          'fill-opacity': 0,
          'fill-outline-color': 'transparent'
        }
      });
    } else {
      try {
        map.setLayoutProperty(CLUSTER_HULL_FILL_ID, 'visibility', 'none');
        map.setPaintProperty(CLUSTER_HULL_FILL_ID, 'fill-opacity', 0);
      } catch {
        /* style mid-swap */
      }
    }

    if (!map.getLayer(CLUSTER_HULL_LINE_ID)) {
      map.addLayer({
        id: CLUSTER_HULL_LINE_ID,
        type: 'line',
        source: CLUSTER_HULL_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#fbbf24',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.6, 8, 2.4, 12, 3.2],
          'line-opacity': 0.85,
          'line-dasharray': [2.5, 1.5]
        }
      });
    }

    if (!map.getLayer(CLUSTER_POI_DOT_ID)) {
      map.addLayer({
        id: CLUSTER_POI_DOT_ID,
        type: 'circle',
        source: CLUSTER_POI_SOURCE_ID,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4, 8, 6, 12, 8],
          'circle-color': '#fbbf24',
          'circle-opacity': 0.95,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0f172a'
        }
      });
    }

    if (!map.getLayer(CLUSTER_POI_LABEL_ID)) {
      map.addLayer({
        id: CLUSTER_POI_LABEL_ID,
        type: 'symbol',
        source: CLUSTER_POI_SOURCE_ID,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 11, 12, 12],
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-max-width': 8
        },
        paint: {
          'text-color': '#fde68a',
          'text-halo-color': '#0f172a',
          'text-halo-width': 1.2
        }
      });
    }

    raiseClusterBoundaryLayers(map);
    return true;
  } catch {
    return false;
  }
}

export function updateClusterHullSource(map, geojson) {
  if (!map?.getStyle?.()) return;
  const source = map.getSource(CLUSTER_HULL_SOURCE_ID);
  if (!source) return;
  source.setData(geojson || EMPTY_FC);
}

export function updateClusterPoiSource(map, geojson) {
  if (!map?.getStyle?.()) return;
  const source = map.getSource(CLUSTER_POI_SOURCE_ID);
  if (!source) return;
  source.setData(geojson || EMPTY_FC);
}

export function clearClusterBoundaries(map) {
  updateClusterHullSource(map, EMPTY_FC);
  updateClusterPoiSource(map, EMPTY_FC);
}

export function setClusterBoundaryVisibility(map, visible) {
  if (!map?.getStyle?.()) return;
  const visibility = visible ? 'visible' : 'none';
  safeMapUpdate(map, () => {
    for (const layerId of CLUSTER_LAYER_IDS) {
      if (!map.getLayer(layerId)) continue;
      // 면 채움은 항상 숨김 — 점선 경계·POI만 토글
      if (layerId === CLUSTER_HULL_FILL_ID) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        continue;
      }
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ x: number, y: number }} point
 * @returns {{ slug: string, name: string } | null}
 */
export function findClusterPoiAtPoint(map, point) {
  if (!map || !point) return null;
  const layers = [CLUSTER_POI_DOT_ID, CLUSTER_POI_LABEL_ID].filter((id) => map.getLayer(id));
  if (!layers.length) return null;

  const features = map.queryRenderedFeatures(point, { layers });
  const top = features?.[0];
  const slug = top?.properties?.slug;
  if (!slug) return null;

  return {
    slug: String(slug),
    name: String(top.properties?.name || slug)
  };
}

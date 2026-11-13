import { localizedMarkerPinLabel } from '../../../i18n/globeUi.js';
import { GLOBE_LABEL_TIER2_BOUNDARY_ZOOM } from './globeZoomPolicy.js';

/** Mapbox GeoJSON layers for gateo globe markers (GPU-attached, no DOM jitter) */

export const GATEO_SOURCE_ID = 'gateo-spots';
export const GATEO_DOT_LAYER_ID = 'gateo-spots-dot';
export const GATEO_LABEL_LAYER_ID = 'gateo-spots-label';
export const GATEO_LABEL_OVERLAP_LAYER_ID = 'gateo-spots-label-overlap';
export const GATEO_ACTIVE_LAYER_ID = 'gateo-spots-active';

/** @deprecated Tier split uses zoom in layer filter, not maxzoom/minzoom. */
export const GLOBE_LABEL_LAYER_LOW_MAX_ZOOM = GLOBE_LABEL_TIER2_BOUNDARY_ZOOM;

export const GATEO_LABEL_LAYER_IDS = [GATEO_LABEL_LAYER_ID, GATEO_LABEL_OVERLAP_LAYER_ID];

export const GATEO_LAYER_IDS = [
  GATEO_DOT_LAYER_ID,
  ...GATEO_LABEL_LAYER_IDS,
  GATEO_ACTIVE_LAYER_ID,
];

const CATEGORY_COLORS = {
  paradise: '#67d6ff',
  nature: '#6ee7a6',
  urban: '#7ab6ff',
  nearby: '#ffd76a',
  adventure: '#ff9b8f',
  culture: '#b89cff',
  default: '#b7c7db',
};

const IS_ACTIVE = ['==', ['to-number', ['get', 'isActive']], 1];
const IS_MAJOR = ['==', ['get', 'type'], 'major'];
const SHOW_DOT = ['!=', ['get', 'type'], 'major'];
const LABEL_OVERLAP_ELIGIBLE = ['==', ['get', 'labelOverlapEligible'], 1];
const LABEL_NOT_OVERLAP_ELIGIBLE = ['!=', ['get', 'labelOverlapEligible'], 1];
/** Primary: all labels below tier-2; at tier-2+ only non-eligible (main collision rules). */
const LABEL_PRIMARY_FILTER = [
  'any',
  ['<', ['zoom'], GLOBE_LABEL_TIER2_BOUNDARY_ZOOM],
  LABEL_NOT_OVERLAP_ELIGIBLE,
];
/** Tier-2 gate is layer minzoom (SSOT) — avoid zoom-in-filter (Mapbox overlap layer quirk). */
const LABEL_OVERLAP_FILTER = LABEL_OVERLAP_ELIGIBLE;

const DOT_RADIUS = ['interpolate', ['linear'], ['zoom'], 1, 3, 3, 5, 6, 7];

const LABEL_TEXT_SIZE = ['interpolate', ['linear'], ['zoom'], 1, 10, 3, 11, 5, 12, 8, 13];

const ACTIVE_RING_RADIUS = ['interpolate', ['linear'], ['zoom'], 1, 10, 3, 14, 6, 18];

const LABEL_LAYOUT_CORE = {
  'text-field': ['get', 'name'],
  'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
  'text-size': LABEL_TEXT_SIZE,
  'text-offset': [
    'case',
    IS_MAJOR,
    ['literal', [0, 0]],
    ['literal', [0.9, 0]],
  ],
  'text-anchor': ['case', IS_MAJOR, 'center', 'left'],
  'text-max-width': 8,
  'text-ignore-placement': false,
  'symbol-sort-key': ['-', 4, ['to-number', ['get', 'tier']]],
};

const LABEL_PAINT = {
  'text-color': [
    'case',
    IS_ACTIVE,
    '#fecaca',
    IS_MAJOR,
    ['get', 'color'],
    '#e6edf7',
  ],
  'text-halo-color': 'rgba(2,6,23,0.95)',
  'text-halo-width': 1.2,
  'text-opacity': ['to-number', ['get', 'opacity']],
};

const truncate = (str, length = 12) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}..` : str;
};

export function markerToFeature(marker, index = 0, locale = 'ko') {
  const lat = Number(marker.lat) + (Number(marker._offsetLat) || 0);
  const lng = Number(marker.lng) + (Number(marker._offsetLng) || 0);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const displayName = localizedMarkerPinLabel(marker, locale);
  const type = marker.type || 'major';
  const category = marker.category || 'default';
  const color = type === 'temp-base'
    ? '#94a3b8'
    : type === 'saved-base'
      ? '#e2e8f0'
      : (CATEGORY_COLORS[category] || CATEGORY_COLORS.default);

  return {
    type: 'Feature',
    id: marker.id || marker.tripId || marker.slug || `spot-${index}`,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      markerId: String(marker.id || marker.tripId || marker.slug || `spot-${index}`),
      name: truncate(displayName, type === 'major' ? 12 : 10),
      fullName: displayName,
      slug: marker.slug || '',
      country: marker.country || '',
      country_en: marker.country_en || '',
      type,
      category,
      color,
      tier: Number(marker.tier) || 3,
      isActive: marker.isActive ? 1 : 0,
      isGhost: marker.isGhost ? 1 : 0,
      isBookmarked: marker.isBookmarked ? 1 : 0,
      hasChat: marker.hasChat ? 1 : 0,
      hiddenClusterCount: Number(marker.hiddenClusterCount) || 0,
      labelOverlapEligible: marker.labelOverlapEligible ? 1 : 0,
      opacity: marker.isGhost ? 0.55 : 1,
    },
  };
}

export function markersToGeoJSON(markers = [], locale = 'ko') {
  const features = markers
    .map((marker, index) => markerToFeature(marker, index, locale))
    .filter(Boolean);
  return { type: 'FeatureCollection', features };
}

import { isGlobeMapStyleReady } from './globeMapStyleGuard.js';

export function isGateoLayer(layerId = '') {
  return GATEO_LAYER_IDS.some((id) => layerId === id || layerId.startsWith('gateo-spots'));
}

function safeMapUpdate(map, fn) {
  if (!isGlobeMapStyleReady(map)) return;
  try {
    fn();
  } catch {
    // Style may be reloading after theme changes.
  }
}

function mapIsCameraMoving(map) {
  return typeof map?.isMoving === 'function' && map.isMoving();
}

export function gateoMarkerLayersReady(map) {
  if (!isGlobeMapStyleReady(map)) return false;
  try {
    return GATEO_LAYER_IDS.every((id) => Boolean(map.getLayer(id)));
  } catch {
    return false;
  }
}

export function areGateoMarkerLayersVisible(map) {
  if (!gateoMarkerLayersReady(map)) return false;
  return GATEO_LAYER_IDS.some((layerId) => {
    try {
      return map.getLayoutProperty(layerId, 'visibility') !== 'none';
    } catch {
      return false;
    }
  });
}

/** Hide gateo spot layers until GeoJSON source is synced (avoids label flash on base reveal). */
export function setGateoMarkerLayerVisibility(map, visible) {
  if (!isGlobeMapStyleReady(map)) return;
  const visibility = visible ? 'visible' : 'none';
  GATEO_LAYER_IDS.forEach((layerId) => {
    try {
      if (!map.getLayer(layerId)) return;
      map.setLayoutProperty(layerId, 'visibility', visibility);
    } catch {
      // Style may be mid-transition.
    }
  });
}

/** Symbol placement races flyTo during flight cinema — hide text labels only. */
export function setGateoMarkerLabelVisibility(map, visible) {
  if (!isGlobeMapStyleReady(map)) return;
  const visibility = visible ? 'visible' : 'none';
  GATEO_LABEL_LAYER_IDS.forEach((layerId) => {
    try {
      if (!map.getLayer(layerId)) return;
      map.setLayoutProperty(layerId, 'visibility', visibility);
    } catch {
      // Style may be mid-transition.
    }
  });
}

/** 레이어가 이미 있을 때 스타일·필터 동기화 (테마 전환·핫리로드) */
export function syncGateoMarkerLayerStyle(map) {
  if (!gateoMarkerLayersReady(map)) return;

  safeMapUpdate(map, () => {
    map.setFilter(GATEO_DOT_LAYER_ID, SHOW_DOT);
    syncOneLabelLayer(map, GATEO_LABEL_LAYER_ID, LABEL_PRIMARY_FILTER, false);
    syncOneLabelLayer(
      map,
      GATEO_LABEL_OVERLAP_LAYER_ID,
      LABEL_OVERLAP_FILTER,
      true,
      GLOBE_LABEL_TIER2_BOUNDARY_ZOOM,
    );
  });
}

function syncOneLabelLayer(map, layerId, filter, allowOverlap, minzoom) {
  if (!map.getLayer(layerId)) return;
  map.setFilter(layerId, filter);
  if (Number.isFinite(minzoom)) {
    map.setLayerZoomRange(layerId, minzoom, 24);
  }
  map.setLayoutProperty(layerId, 'text-size', LABEL_TEXT_SIZE);
  map.setLayoutProperty(layerId, 'text-font', ['DIN Pro Medium', 'Arial Unicode MS Regular']);
  map.setLayoutProperty(layerId, 'text-offset', LABEL_LAYOUT_CORE['text-offset']);
  map.setLayoutProperty(layerId, 'text-anchor', LABEL_LAYOUT_CORE['text-anchor']);
  map.setLayoutProperty(layerId, 'symbol-sort-key', LABEL_LAYOUT_CORE['symbol-sort-key']);
  map.setLayoutProperty(layerId, 'text-allow-overlap', allowOverlap);
  map.setLayoutProperty(layerId, 'text-ignore-placement', allowOverlap);
  map.setPaintProperty(layerId, 'text-color', LABEL_PAINT['text-color']);
}

function addGateoLabelLayer(map, { id, filter, textAllowOverlap, minzoom, bindPointerCursor }) {
  const layer = {
    id,
    type: 'symbol',
    source: GATEO_SOURCE_ID,
    filter,
    layout: {
      ...LABEL_LAYOUT_CORE,
      'text-allow-overlap': textAllowOverlap,
      'text-ignore-placement': textAllowOverlap,
    },
    paint: LABEL_PAINT,
  };
  if (Number.isFinite(minzoom)) {
    layer.minzoom = minzoom;
  }
  map.addLayer(layer);
  bindPointerCursor(id);
}

export function setupGateoMarkerLayers(map) {
  if (!isGlobeMapStyleReady(map)) return false;

  try {
    if (!map.getSource(GATEO_SOURCE_ID)) {
      map.addSource(GATEO_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (gateoMarkerLayersReady(map)) return true;

    const bindPointerCursor = (layerId) => {
      map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
    };

    map.addLayer({
      id: GATEO_ACTIVE_LAYER_ID,
      type: 'circle',
      source: GATEO_SOURCE_ID,
      filter: IS_ACTIVE,
      paint: {
        'circle-radius': ACTIVE_RING_RADIUS,
        'circle-color': '#ef4444',
        'circle-opacity': 0.2,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ef4444',
        'circle-stroke-opacity': 0.8,
      },
    });

    map.addLayer({
      id: GATEO_DOT_LAYER_ID,
      type: 'circle',
      source: GATEO_SOURCE_ID,
      filter: SHOW_DOT,
      paint: {
        'circle-radius': DOT_RADIUS,
        'circle-color': ['get', 'color'],
        'circle-opacity': ['*', ['to-number', ['get', 'opacity']], 0.92],
        'circle-stroke-width': ['case', IS_ACTIVE, 2, 1],
        'circle-stroke-color': ['case', IS_ACTIVE, '#ef4444', 'rgba(2,6,23,0.85)'],
      },
    });
    bindPointerCursor(GATEO_DOT_LAYER_ID);

    // Primary first (collision field), overlap on top — eligible labels must not lose to primary placement.
    addGateoLabelLayer(map, {
      id: GATEO_LABEL_LAYER_ID,
      filter: LABEL_PRIMARY_FILTER,
      textAllowOverlap: false,
      bindPointerCursor,
    });

    addGateoLabelLayer(map, {
      id: GATEO_LABEL_OVERLAP_LAYER_ID,
      filter: LABEL_OVERLAP_FILTER,
      textAllowOverlap: true,
      minzoom: GLOBE_LABEL_TIER2_BOUNDARY_ZOOM,
      bindPointerCursor,
    });

    syncGateoMarkerLayerStyle(map);
    setGateoMarkerLayerVisibility(map, false);
    return true;
  } catch (err) {
    console.error('[gateo] setupGateoMarkerLayers failed', err);
    return false;
  }
}

/** @type {WeakMap<object, { busy: boolean }>} */
const globeCameraBusyState = new WeakMap();

export function markGlobeCameraBusy(map) {
  if (!map) return;
  let state = globeCameraBusyState.get(map);
  if (!state) {
    state = { busy: false };
    globeCameraBusyState.set(map, state);
  }
  state.busy = true;
}

export function clearGlobeCameraBusy(map) {
  if (!map) return;
  const state = globeCameraBusyState.get(map);
  if (!state) return;
  state.busy = false;
}

export function isGlobeCameraBusy(map) {
  return Boolean(globeCameraBusyState.get(map)?.busy);
}

const GATEO_EMPTY_FC = { type: 'FeatureCollection', features: [] };
const lastGateoSourceData = new WeakMap();

export function updateGateoMarkerSource(map, geojson) {
  safeMapUpdate(map, () => {
    const source = map.getSource(GATEO_SOURCE_ID);
    if (!source) return;
    const data = geojson || GATEO_EMPTY_FC;
    if (lastGateoSourceData.get(source) === data) return;
    lastGateoSourceData.set(source, data);
    source.setData(data);
  });
}

/** @type {WeakMap<object, { pending: object | null }>} */
const scheduledMarkerUpdates = new WeakMap();

function runPendingGateoMarkerFlush(map) {
  if (!map) return false;
  const state = scheduledMarkerUpdates.get(map);
  const data = state?.pending;
  if (!data) return false;

  if (mapIsCameraMoving(map)) return false;

  if (state) state.pending = null;
  updateGateoMarkerSource(map, data);
  return true;
}

export function flushPendingGateoMarkerSource(map) {
  return runPendingGateoMarkerFlush(map);
}

export function scheduleUpdateGateoMarkerSource(map, geojson) {
  if (!map) return;

  let state = scheduledMarkerUpdates.get(map);
  if (!state) {
    state = { pending: null };
    scheduledMarkerUpdates.set(map, state);
  }
  state.pending = geojson || { type: 'FeatureCollection', features: [] };

  if (mapIsCameraMoving(map)) {
    return;
  }

  requestAnimationFrame(() => requestAnimationFrame(() => runPendingGateoMarkerFlush(map)));
}

const LAYER_HIT_PRIORITY = {
  [GATEO_LABEL_LAYER_ID]: 0,
  [GATEO_LABEL_OVERLAP_LAYER_ID]: 0,
  [GATEO_DOT_LAYER_ID]: 1,
  [GATEO_ACTIVE_LAYER_ID]: 2,
};

function pixelDistanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function geoDistanceSq(lat1, lng1, lat2, lng2) {
  const dLat = lat2 - lat1;
  let dLng = lng2 - lng1;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;
  return dLat * dLat + dLng * dLng;
}

function markerHitFromEntry(entry) {
  const { props, coords } = entry;
  return {
    id: props.markerId,
    name: props.fullName || props.name,
    slug: props.slug,
    lat: coords[1],
    lng: coords[0],
    type: props.type,
    category: props.category,
    country: props.country || undefined,
    country_en: props.country_en || undefined,
    isActive: Number(props.isActive) === 1,
    isBookmarked: Number(props.isBookmarked) === 1,
    hasChat: Number(props.hasChat) === 1,
    hiddenClusterCount: Number(props.hiddenClusterCount) || 0,
  };
}

export function findGateoMarkerAtPoint(map, point, clickLngLat = null, thresholdPx = 32) {
  if (!map || !point) return null;

  const layers = [...GATEO_LABEL_LAYER_IDS, GATEO_DOT_LAYER_ID, GATEO_ACTIVE_LAYER_ID].filter(
    (id) => map.getLayer(id),
  );
  if (layers.length === 0) return null;

  const bbox = [
    [point.x - thresholdPx, point.y - thresholdPx],
    [point.x + thresholdPx, point.y + thresholdPx],
  ];

  const features = map.queryRenderedFeatures(bbox, { layers });
  if (!features?.length) return null;

  const candidates = new Map();
  for (const feature of features) {
    const props = feature.properties || {};
    const markerId = String(props.markerId || props.slug || feature.id || '');
    if (!markerId) continue;

    const coords = feature.geometry?.coordinates;
    if (!coords?.length) continue;

    const projected = map.project({ lng: coords[0], lat: coords[1] });
    const distSq = pixelDistanceSq(projected, point);
    const priority = LAYER_HIT_PRIORITY[feature.layer?.id] ?? 3;
    const prev = candidates.get(markerId);

    if (!prev || distSq < prev.distSq || (distSq === prev.distSq && priority < prev.priority)) {
      candidates.set(markerId, { props, coords, distSq, priority });
    }
  }

  let entries = [...candidates.values()];
  if (entries.length === 0) return null;

  const hasClickLngLat = clickLngLat
    && Number.isFinite(clickLngLat.lat)
    && Number.isFinite(clickLngLat.lng);

  entries.sort((a, b) => {
    if (hasClickLngLat) {
      const geoA = geoDistanceSq(clickLngLat.lat, clickLngLat.lng, a.coords[1], a.coords[0]);
      const geoB = geoDistanceSq(clickLngLat.lat, clickLngLat.lng, b.coords[1], b.coords[0]);
      if (geoA !== geoB) return geoA - geoB;
    }
    if (a.distSq !== b.distSq) return a.distSq - b.distSq;
    return a.priority - b.priority;
  });

  return markerHitFromEntry(entries[0]);
}

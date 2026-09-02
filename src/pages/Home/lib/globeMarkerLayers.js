import { localizedMarkerPinLabel } from '../../../i18n/globeUi.js';

/** Mapbox GeoJSON layers for gateo globe markers (GPU-attached, no DOM jitter) */

export const GATEO_SOURCE_ID = 'gateo-spots';
export const GATEO_DOT_LAYER_ID = 'gateo-spots-dot';
export const GATEO_LABEL_LAYER_ID = 'gateo-spots-label';
export const GATEO_ACTIVE_LAYER_ID = 'gateo-spots-active';

export const GATEO_LAYER_IDS = [
  GATEO_DOT_LAYER_ID,
  GATEO_LABEL_LAYER_ID,
  GATEO_ACTIVE_LAYER_ID
];

const CATEGORY_COLORS = {
  paradise: '#67d6ff',
  nature: '#6ee7a6',
  urban: '#7ab6ff',
  nearby: '#ffd76a',
  adventure: '#ff9b8f',
  culture: '#b89cff',
  default: '#b7c7db'
};

const IS_ACTIVE = ['==', ['to-number', ['get', 'isActive']], 1];
const IS_MAJOR = ['==', ['get', 'type'], 'major'];
const SHOW_DOT = ['!=', ['get', 'type'], 'major'];

const DOT_RADIUS = ['interpolate', ['linear'], ['zoom'], 1, 3, 3, 5, 6, 7];

const LABEL_TEXT_SIZE = ['interpolate', ['linear'], ['zoom'], 1, 10, 3, 11, 5, 12, 8, 13];

const ACTIVE_RING_RADIUS = ['interpolate', ['linear'], ['zoom'], 1, 10, 3, 14, 6, 18];

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
      opacity: marker.isGhost ? 0.55 : 1
    }
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

export function gateoMarkerLayersReady(map) {
  if (!isGlobeMapStyleReady(map)) return false;
  try {
    // getLayer throws "Style is not done loading" while the style is mid-load
    // (e.g. 2s reveal fallback before idle/styledata).
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
  try {
    if (!map.getLayer(GATEO_LABEL_LAYER_ID)) return;
    map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
  } catch {
    // Style may be mid-transition.
  }
}

/** 레이어가 이미 있을 때 스타일·필터 동기화 (테마 전환·핫리로드) */
export function syncGateoMarkerLayerStyle(map) {
  if (!gateoMarkerLayersReady(map)) return;

  safeMapUpdate(map, () => {
    map.setFilter(GATEO_DOT_LAYER_ID, SHOW_DOT);

    map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'text-size', LABEL_TEXT_SIZE);
    map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'text-font', ['DIN Pro Medium', 'Arial Unicode MS Regular']);
    map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'text-offset', [
      'case',
      IS_MAJOR,
      ['literal', [0, 0]],
      ['literal', [0.9, 0]]
    ]);
    map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'text-anchor', [
      'case',
      IS_MAJOR,
      'center',
      'left'
    ]);
    map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'symbol-sort-key', [
      '-',
      4,
      ['to-number', ['get', 'tier']]
    ]);

    map.setPaintProperty(GATEO_LABEL_LAYER_ID, 'text-color', [
      'case',
      IS_ACTIVE,
      '#fecaca',
      IS_MAJOR,
      ['get', 'color'],
      '#e6edf7'
    ]);
  });
}

export function setupGateoMarkerLayers(map) {
  if (!isGlobeMapStyleReady(map)) return false;

  try {
    if (!map.getSource(GATEO_SOURCE_ID)) {
      map.addSource(GATEO_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
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
        'circle-stroke-opacity': 0.8
      }
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
        'circle-stroke-color': ['case', IS_ACTIVE, '#ef4444', 'rgba(2,6,23,0.85)']
      }
    });
    bindPointerCursor(GATEO_DOT_LAYER_ID);

    map.addLayer({
      id: GATEO_LABEL_LAYER_ID,
      type: 'symbol',
      source: GATEO_SOURCE_ID,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': LABEL_TEXT_SIZE,
        'text-offset': [
          'case',
          IS_MAJOR,
          ['literal', [0, 0]],
          ['literal', [0.9, 0]]
        ],
        'text-anchor': [
          'case',
          IS_MAJOR,
          'center',
          'left'
        ],
        'text-max-width': 8,
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'symbol-sort-key': ['-', 4, ['to-number', ['get', 'tier']]]
      },
      paint: {
        'text-color': [
          'case',
          IS_ACTIVE,
          '#fecaca',
          IS_MAJOR,
          ['get', 'color'],
          '#e6edf7'
        ],
        'text-halo-color': 'rgba(2,6,23,0.95)',
        'text-halo-width': 1.2,
        'text-opacity': ['to-number', ['get', 'opacity']]
      }
    });
    bindPointerCursor(GATEO_LABEL_LAYER_ID);

    syncGateoMarkerLayerStyle(map);
    setGateoMarkerLayerVisibility(map, false);
    return true;
  } catch {
    return false;
  }
}

/** @type {WeakMap<object, { busy: boolean, safetyTimer: ReturnType<typeof setTimeout> | null }>} */
const globeCameraBusyState = new WeakMap();

export function markGlobeCameraBusy(map) {
  if (!map) return;
  let state = globeCameraBusyState.get(map);
  if (!state) {
    state = { busy: false, safetyTimer: null };
    globeCameraBusyState.set(map, state);
  }
  state.busy = true;
  if (state.safetyTimer) clearTimeout(state.safetyTimer);
  state.safetyTimer = setTimeout(() => {
    state.busy = false;
    state.safetyTimer = null;
    runPendingGateoMarkerFlush(map);
  }, 5000);
}

export function clearGlobeCameraBusy(map) {
  if (!map) return;
  const state = globeCameraBusyState.get(map);
  if (!state) return;
  state.busy = false;
  if (state.safetyTimer) {
    clearTimeout(state.safetyTimer);
    state.safetyTimer = null;
  }
}

export function isGlobeCameraBusy(map) {
  return Boolean(globeCameraBusyState.get(map)?.busy);
}

export function updateGateoMarkerSource(map, geojson) {
  safeMapUpdate(map, () => {
    const source = map.getSource(GATEO_SOURCE_ID);
    if (source) source.setData(geojson || { type: 'FeatureCollection', features: [] });
  });
}

/** @type {WeakMap<object, { pending: object | null }>} */
const scheduledMarkerUpdates = new WeakMap();

function runPendingGateoMarkerFlush(map) {
  if (!map) return false;
  const state = scheduledMarkerUpdates.get(map);
  const data = state?.pending;
  if (!data) return false;

  if (typeof map.isMoving === 'function' && map.isMoving()) return false;
  if (isGlobeCameraBusy(map)) return false;

  if (state) state.pending = null;
  updateGateoMarkerSource(map, data);
  return true;
}

/** flyTo/easeTo 종료·idle 후 호출 — 대기 중인 GeoJSON flush */
export function flushPendingGateoMarkerSource(map) {
  return runPendingGateoMarkerFlush(map);
}

/**
 * flyTo/easeTo 중 symbol continuePlacement 크래시 방지 — camera idle 전 setData 금지.
 */
export function scheduleUpdateGateoMarkerSource(map, geojson) {
  if (!map) return;

  let state = scheduledMarkerUpdates.get(map);
  if (!state) {
    state = { pending: null };
    scheduledMarkerUpdates.set(map, state);
  }
  state.pending = geojson || { type: 'FeatureCollection', features: [] };

  if (isGlobeCameraBusy(map) || (typeof map.isMoving === 'function' && map.isMoving())) {
    return;
  }

  requestAnimationFrame(() => requestAnimationFrame(() => runPendingGateoMarkerFlush(map)));
}

/** locale 토글 등 — 자전 중에도 핀 라벨 즉시 갱신(flyTo/easeTo 중엔 기존 스케줄러 사용). */
export function forceUpdateGateoMarkerSource(map, geojson) {
  if (!map) return;
  const state = scheduledMarkerUpdates.get(map);
  if (state) state.pending = null;
  if (isGlobeCameraBusy(map)) {
    scheduleUpdateGateoMarkerSource(map, geojson);
    return;
  }
  updateGateoMarkerSource(map, geojson);
}

const LAYER_HIT_PRIORITY = {
  [GATEO_LABEL_LAYER_ID]: 0,
  [GATEO_DOT_LAYER_ID]: 1,
  [GATEO_ACTIVE_LAYER_ID]: 2
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
    hiddenClusterCount: Number(props.hiddenClusterCount) || 0
  };
}

export function findGateoMarkerAtPoint(map, point, clickLngLat = null, thresholdPx = 32) {
  if (!map || !point) return null;

  const layers = [GATEO_LABEL_LAYER_ID, GATEO_DOT_LAYER_ID, GATEO_ACTIVE_LAYER_ID]
    .filter((id) => map.getLayer(id));
  if (layers.length === 0) return null;

  const bbox = [
    [point.x - thresholdPx, point.y - thresholdPx],
    [point.x + thresholdPx, point.y + thresholdPx]
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

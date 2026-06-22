import { PLACE_LABEL_MIN_ZOOM } from './globeZoomPolicy';
import { isGateoLayer } from './globeMarkerLayers';
import { isReachBoundaryLayer } from './globeReachBoundaries';
import { isClusterBoundaryLayer } from './globeClusterBoundaries';
import { isFlightCinemaLayer } from './globeFlightCinemaEngine';
import {
  applyStandardBasemapConfig,
  isStandardBasemapLayer,
  STANDARD_HOME_CONFIG,
  STANDARD_HOME_GLOBE_CONTEXT_CONFIG,
  STANDARD_HOME_SPACE_CONFIG
} from './globeStandardBasemap';

const MAPBOX_LABEL_MAX_ZOOM = 22;
const GLOBE_CONTEXT_LABEL_MIN_ZOOM = 0;
/** Layers pinned above max globe zoom so they never paint in space view. */
const FORCE_HIDDEN_ZOOM_MIN = 22;
const FORCE_HIDDEN_ZOOM_MAX = 24;

const ADMIN_BOUNDARY_HINTS = ['admin', 'boundary', 'border', 'disputed'];
const ROAD_OVERLAY_HINTS = ['road', 'street', 'highway', 'motorway', 'transit', 'rail', 'ferry'];
const MAPBOX_PLACE_LABEL_HINTS = [
  'place-label',
  'settlement',
  'country-label',
  'state-label',
];

/** satellite-streets 대륙·대양 — 줌 4 미만에서도 유지 (도시·국가 지명과 분리) */
export const MAPBOX_GLOBE_CONTEXT_LABEL_HINTS = [
  'continent-label',
  'continent',
  'marine-label',
  'marine',
  'water-label',
  'water-point-label',
  'ocean-label',
  'ocean',
];

const MAPBOX_SYMBOL_LABEL_HINTS = [
  ...MAPBOX_PLACE_LABEL_HINTS,
  'landmark',
  'poi',
  'label',
  'airport',
  'natural',
];

const layerMatchesHints = (layerId, sourceLayer, hints) => {
  const id = layerId || '';
  const sl = sourceLayer || '';
  return hints.some((hint) => id.includes(hint) || sl.includes(hint));
};

export function isGlobeContextBasemapLabel(layerId, sourceLayer) {
  return layerMatchesHints(layerId, sourceLayer, MAPBOX_GLOBE_CONTEXT_LABEL_HINTS);
}

export function resolveStandardHomeBasemapConfig({ isPinVisible, zoom }) {
  if (!isPinVisible || !Number.isFinite(zoom)) {
    return STANDARD_HOME_SPACE_CONFIG;
  }
  if (zoom >= PLACE_LABEL_MIN_ZOOM) {
    return STANDARD_HOME_CONFIG;
  }
  return STANDARD_HOME_GLOBE_CONTEXT_CONFIG;
}

export function shouldShowMapboxGlobeLabels({ isPinVisible, zoom }) {
  return Boolean(isPinVisible && Number.isFinite(zoom) && zoom >= PLACE_LABEL_MIN_ZOOM);
}

export function forceHideMapboxLayer(map, layerId) {
  if (!map?.getLayer?.(layerId)) return;
  try {
    map.setLayoutProperty(layerId, 'visibility', 'none');
    map.setLayerZoomRange(layerId, FORCE_HIDDEN_ZOOM_MIN, FORCE_HIDDEN_ZOOM_MAX);
  } catch {
    // Style may be mid-transition.
  }
}

export function showMapboxDetailLayer(map, layerId) {
  if (!map?.getLayer?.(layerId)) return;
  try {
    map.setLayerZoomRange(layerId, PLACE_LABEL_MIN_ZOOM, MAPBOX_LABEL_MAX_ZOOM);
    map.setLayoutProperty(layerId, 'visibility', 'visible');
  } catch {
    // Style may be mid-transition.
  }
}

/** 대륙·대양 Mapbox 라벨 — gateo 여행지명과 겹칠 때 여행지 우선(sort-key는 스타일 기본값) */
export function showGlobeContextBasemapLayer(map, layerId) {
  if (!map?.getLayer?.(layerId)) return;
  try {
    map.setLayerZoomRange(layerId, GLOBE_CONTEXT_LABEL_MIN_ZOOM, MAPBOX_LABEL_MAX_ZOOM);
    map.setLayoutProperty(layerId, 'visibility', 'visible');
    map.setPaintProperty(layerId, 'text-opacity', [
      'interpolate',
      ['linear'],
      ['zoom'],
      1,
      0.68,
      4,
      0.58,
      6,
      0.42,
      8,
      0.25,
    ]);
    map.setPaintProperty(layerId, 'text-halo-color', 'rgba(2, 6, 23, 0.88)');
    map.setPaintProperty(layerId, 'text-halo-width', 1.1);
  } catch {
    // Style may be mid-transition or layer paint not overridable.
  }
}

function isMapboxLabelSymbolLayer(layer) {
  const id = layer.id || '';
  const sourceLayer = layer['source-layer'] || '';
  if (isGateoLayer(id) || isReachBoundaryLayer(id) || isClusterBoundaryLayer(id) || isFlightCinemaLayer(id)) {
    return false;
  }
  if (isStandardBasemapLayer(id)) return true;
  if (Boolean(layer.layout?.['text-field'])) return true;
  return layerMatchesHints(id, sourceLayer, MAPBOX_SYMBOL_LABEL_HINTS);
}

/**
 * Apply before the style fully paints (bright Standard only) to avoid a one-frame label flash.
 */
export function applyEarlyMapboxGlobeLabelSuppress(map, globeTheme = 'deep') {
  if (!map || globeTheme !== 'bright') return;
  applyStandardBasemapConfig(map, STANDARD_HOME_SPACE_CONFIG);
}

/**
 * Single SSOT for Mapbox place/landmark labels + admin boundaries on the home globe.
 * Standard (bright) labels are driven by setConfigProperty; satellite layers are toggled explicitly.
 */
export function applyMapboxGlobeLabelPolicy(
  map,
  { globeTheme = 'deep', isPinVisible = true, placeLabelLayerIds = [] } = {}
) {
  if (!map?.getStyle || !map.isStyleLoaded?.()) return null;

  const zoom = map.getZoom();
  const showDetail = shouldShowMapboxGlobeLabels({ isPinVisible, zoom });

  if (globeTheme === 'bright') {
    applyStandardBasemapConfig(
      map,
      resolveStandardHomeBasemapConfig({ isPinVisible, zoom })
    );
  }

  let layers;
  try {
    layers = map.getStyle().layers || [];
  } catch {
    return false;
  }

  const placeLabelSet = new Set(placeLabelLayerIds);

  for (const layer of layers) {
    const layerId = layer.id;
    if (
      !layerId
      || isGateoLayer(layerId)
      || isReachBoundaryLayer(layerId)
      || isClusterBoundaryLayer(layerId)
      || isFlightCinemaLayer(layerId)
    ) {
      continue;
    }

    if (layer.type === 'symbol') {
      const isLandmark = isStandardBasemapLayer(layerId);
      const isContextLabel = isGlobeContextBasemapLabel(layerId, layer['source-layer']);
      const isPlaceLabel = placeLabelSet.has(layerId)
        || layerMatchesHints(layerId, layer['source-layer'], MAPBOX_PLACE_LABEL_HINTS);
      const isMapboxLabel = isMapboxLabelSymbolLayer(layer);

      if (isContextLabel) {
        if (isPinVisible) showGlobeContextBasemapLayer(map, layerId);
        else forceHideMapboxLayer(map, layerId);
        continue;
      }

      if (globeTheme === 'bright') {
        // Home never uses Standard landmark icons; config + layer hide (tour uses separate config).
        if (isLandmark || !showDetail) {
          forceHideMapboxLayer(map, layerId);
        } else if (!isMapboxLabel) {
          forceHideMapboxLayer(map, layerId);
        }
        continue;
      }

      // satellite-streets (deep / neon)
      if (!showDetail || !isPlaceLabel) {
        forceHideMapboxLayer(map, layerId);
      } else {
        showMapboxDetailLayer(map, layerId);
      }
      continue;
    }

    if (layer.type === 'line') {
      const isRoad = layerMatchesHints(layerId, layer['source-layer'], ROAD_OVERLAY_HINTS);
      const isBoundary = layerMatchesHints(layerId, layer['source-layer'], ADMIN_BOUNDARY_HINTS);
      if (isRoad) {
        forceHideMapboxLayer(map, layerId);
      } else if (isBoundary) {
        if (showDetail) showMapboxDetailLayer(map, layerId);
        else forceHideMapboxLayer(map, layerId);
      } else {
        forceHideMapboxLayer(map, layerId);
      }
    }

    if (layer.type === 'fill' || layer.type === 'fill-extrusion') {
      const id = layerId || '';
      const sourceLayer = layer['source-layer'] || '';
      const isOverlay = [...ROAD_OVERLAY_HINTS, ...ADMIN_BOUNDARY_HINTS]
        .some((hint) => id.includes(hint) || sourceLayer.includes(hint));
      if (isOverlay) forceHideMapboxLayer(map, layerId);
    }
  }

  return showDetail;
}

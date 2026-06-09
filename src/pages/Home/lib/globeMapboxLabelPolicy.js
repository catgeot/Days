import { PLACE_LABEL_MIN_ZOOM } from './globeZoomPolicy';
import { isGateoLayer } from './globeMarkerLayers';
import { isReachBoundaryLayer } from './globeReachBoundaries';
import {
  applyStandardBasemapConfig,
  isStandardBasemapLayer,
  STANDARD_HOME_CONFIG,
  STANDARD_HOME_SPACE_CONFIG
} from './globeStandardBasemap';

const MAPBOX_LABEL_MAX_ZOOM = 22;
/** Layers pinned above max globe zoom so they never paint in space view. */
const FORCE_HIDDEN_ZOOM_MIN = 22;
const FORCE_HIDDEN_ZOOM_MAX = 24;

const ADMIN_BOUNDARY_HINTS = ['admin', 'boundary', 'border', 'disputed'];
const ROAD_OVERLAY_HINTS = ['road', 'street', 'highway', 'motorway', 'transit', 'rail', 'ferry'];
const MAPBOX_SYMBOL_LABEL_HINTS = [
  'place-label',
  'settlement',
  'country-label',
  'state-label',
  'landmark',
  'poi',
  'label',
  'airport',
  'continent',
  'marine',
  'water-label',
  'natural'
];

const layerMatchesHints = (layerId, sourceLayer, hints) => {
  const id = layerId || '';
  const sl = sourceLayer || '';
  return hints.some((hint) => id.includes(hint) || sl.includes(hint));
};

export function resolveStandardHomeBasemapConfig({ isPinVisible, zoom }) {
  const showDetail = isPinVisible
    && Number.isFinite(zoom)
    && zoom >= PLACE_LABEL_MIN_ZOOM;
  return showDetail ? STANDARD_HOME_CONFIG : STANDARD_HOME_SPACE_CONFIG;
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

function isMapboxLabelSymbolLayer(layer) {
  const id = layer.id || '';
  const sourceLayer = layer['source-layer'] || '';
  if (isGateoLayer(id) || isReachBoundaryLayer(id)) return false;
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
    if (!layerId || isGateoLayer(layerId) || isReachBoundaryLayer(layerId)) continue;

    if (layer.type === 'symbol') {
      const isLandmark = isStandardBasemapLayer(layerId);
      const isPlaceLabel = placeLabelSet.has(layerId)
        || layerMatchesHints(layerId, layer['source-layer'], ['place-label', 'settlement', 'country-label', 'state-label']);
      const isMapboxLabel = isMapboxLabelSymbolLayer(layer);

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

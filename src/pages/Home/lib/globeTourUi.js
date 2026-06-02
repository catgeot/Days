import { GATEO_LABEL_LAYER_ID, isGateoLayer } from './globeMarkerLayers';

/** Hide Mapbox + gateo labels during 3D tour for a clean cinematic view. */
export function applyTourMapUi(map, { active, globeTheme } = {}) {
  if (!map?.getStyle) return;

  const layers = map.getStyle().layers || [];
  for (const layer of layers) {
    if (layer.type !== 'symbol') continue;
    if (!map.getLayer(layer.id)) continue;
    try {
      map.setLayoutProperty(layer.id, 'visibility', active ? 'none' : 'visible');
    } catch {
      // Style may be mid-transition.
    }
  }

  if (map.getLayer(GATEO_LABEL_LAYER_ID)) {
    try {
      map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'visibility', active ? 'none' : 'visible');
    } catch {
      // Ignore label toggle failures.
    }
  }

  if (globeTheme === 'bright' && typeof map.setConfigProperty === 'function') {
    [
      ['showPlaceLabels', !active],
      ['showPointOfInterestLabels', false],
      ['showRoadLabels', false],
      ['showTransitLabels', false]
    ].forEach(([key, value]) => {
      try { map.setConfigProperty('basemap', key, value); } catch {}
    });
  }
}

/** Restore non-gateo symbols to hidden (home globe default). */
export function restoreGlobeMapUi(map, reapplyPlaceLabels) {
  if (!map?.getStyle) return;

  const layers = map.getStyle().layers || [];
  for (const layer of layers) {
    if (layer.type !== 'symbol' || isGateoLayer(layer.id)) continue;
    if (!map.getLayer(layer.id)) continue;
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    } catch {
      // Ignore per-layer restore failures.
    }
  }

  if (map.getLayer(GATEO_LABEL_LAYER_ID)) {
    try {
      map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'visibility', 'visible');
    } catch {
      // Ignore gateo label restore failures.
    }
  }

  if (typeof reapplyPlaceLabels === 'function') {
    reapplyPlaceLabels();
  }
}

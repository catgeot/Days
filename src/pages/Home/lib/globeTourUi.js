import { GATEO_LABEL_LAYER_ID } from './globeMarkerLayers';
import {
  applyStandardBasemapConfig,
  isStandardBasemapLayer,
  STANDARD_HOME_SPACE_CONFIG,
  STANDARD_URBAN_TOUR_LANDMARKS_CONFIG
} from './globeStandardBasemap';

/** Hide Mapbox + gateo labels during 3D tour for a clean cinematic view. */
export function applyTourMapUi(map, { active, globeTheme, tourTemplate } = {}) {
  if (!map?.getStyle) return;

  const urbanLandmarkDemo =
    globeTheme === 'bright' && active && tourTemplate === 'cityOrbit';

  if (active) {
    const layers = map.getStyle().layers || [];
    for (const layer of layers) {
      if (layer.type !== 'symbol') continue;
      if (!map.getLayer(layer.id)) continue;
      if (urbanLandmarkDemo && isStandardBasemapLayer(layer.id)) continue;
      try {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      } catch {
        // Style may be mid-transition.
      }
    }

    if (globeTheme === 'bright') {
      if (urbanLandmarkDemo) {
        applyStandardBasemapConfig(map, STANDARD_URBAN_TOUR_LANDMARKS_CONFIG);
      } else {
        applyStandardBasemapConfig(map, STANDARD_HOME_SPACE_CONFIG);
      }
    }
  }

  if (map.getLayer(GATEO_LABEL_LAYER_ID)) {
    try {
      map.setLayoutProperty(GATEO_LABEL_LAYER_ID, 'visibility', active ? 'none' : 'visible');
    } catch {
      // Ignore label toggle failures.
    }
  }
}

/** Restore home globe label/boundary policy after 3D tour. */
export function restoreGlobeMapUi(map, reapplyPlaceLabels) {
  if (!map?.getStyle) return;

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

import {
  applyStandardBasemapConfig,
  STANDARD_URBAN_TOUR_LANDMARKS_CONFIG
} from './globeStandardBasemap';

/** cityOrbit bright-theme tours — 3D landmark basemap only; labels follow home globe policy. */
export function applyTourMapUi(map, { active, globeTheme, tourTemplate } = {}) {
  if (!map?.getStyle) return;

  const urbanLandmarkDemo =
    globeTheme === 'bright' && active && tourTemplate === 'cityOrbit';

  if (globeTheme === 'bright' && urbanLandmarkDemo) {
    applyStandardBasemapConfig(map, STANDARD_URBAN_TOUR_LANDMARKS_CONFIG);
  }
}

/** Restore home globe label/boundary policy after 3D tour. */
export function restoreGlobeMapUi(map, reapplyPlaceLabels) {
  if (!map?.getStyle) return;

  if (typeof reapplyPlaceLabels === 'function') {
    reapplyPlaceLabels();
  }
}

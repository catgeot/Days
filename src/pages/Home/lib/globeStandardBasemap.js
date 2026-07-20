/** Mapbox Standard (`mapbox://styles/mapbox/standard`) runtime config — valid keys only. */

const VALID_KEYS = new Set([
  'showPedestrianRoads',
  'showPlaceLabels',
  'showPointOfInterestLabels',
  'showRoadLabels',
  'showTransitLabels',
  'show3dObjects',
  'show3dBuildings',
  'show3dTrees',
  'show3dLandmarks',
  'show3dFacades',
  'showLandmarkIcons',
  'showLandmarkIconLabels',
  'showAdminBoundaries',
  'showIndoor',
  'showIndoorLabels',
  'theme',
  'lightPreset',
  'font'
]);

/** Space / idle globe / pins hidden — no Mapbox labels, landmarks, or boundaries. */
export const STANDARD_HOME_SPACE_CONFIG = [
  ['showPlaceLabels', false],
  ['showPointOfInterestLabels', false],
  ['showPedestrianRoads', false],
  ['showRoadLabels', false],
  ['showTransitLabels', false],
  ['showAdminBoundaries', false],
  ['showLandmarkIcons', false],
  ['showLandmarkIconLabels', false],
  ['show3dLandmarks', false],
  ['show3dObjects', false],
  ['showIndoorLabels', false]
];

/** Zoomed-in home (4–5.5) — place labels + admin; POI/roads clutter off. */
export const STANDARD_HOME_CONFIG = [
  ['showPlaceLabels', true],
  ['showPointOfInterestLabels', false],
  ['showPedestrianRoads', false],
  ['showRoadLabels', false],
  ['showTransitLabels', false],
  ['showAdminBoundaries', true],
  ['showLandmarkIcons', false],
  ['showLandmarkIconLabels', false],
  ['show3dLandmarks', false]
];

/** High-zoom explore (≥ 5.5) — place + POI/landmark labels; roads/transit still off. */
export const STANDARD_HOME_POI_CONFIG = [
  ['showPlaceLabels', true],
  ['showPointOfInterestLabels', true],
  ['showPedestrianRoads', false],
  ['showRoadLabels', false],
  ['showTransitLabels', false],
  ['showAdminBoundaries', true],
  ['showLandmarkIcons', true],
  ['showLandmarkIconLabels', true],
  ['show3dLandmarks', false]
];

/** Globe view (zoom < 4) — 대륙·대양 등 Mapbox place 라벨만; POI·도로 clutter off */
export const STANDARD_HOME_GLOBE_CONTEXT_CONFIG = [
  ['showPlaceLabels', true],
  ['showPointOfInterestLabels', false],
  ['showPedestrianRoads', false],
  ['showRoadLabels', false],
  ['showTransitLabels', false],
  ['showAdminBoundaries', false],
  ['showLandmarkIcons', false],
  ['showLandmarkIconLabels', false],
  ['show3dLandmarks', false],
  ['show3dObjects', false],
  ['showIndoorLabels', false]
];

/**
 * Urban 3D tour demo — stylized landmark icons + labels + Mapbox 3D landmark models.
 * @see https://docs.mapbox.com/map-styles/standard/api/
 */
export const STANDARD_URBAN_TOUR_LANDMARKS_CONFIG = [
  ['showPlaceLabels', true],
  ['showPointOfInterestLabels', false],
  ['showRoadLabels', false],
  ['showTransitLabels', false],
  ['showAdminBoundaries', true],
  ['showLandmarkIcons', true],
  ['showLandmarkIconLabels', true],
  ['show3dObjects', true],
  ['show3dLandmarks', true],
  ['show3dBuildings', true],
  ['show3dTrees', false],
  ['lightPreset', 'day']
];

export function isStandardBasemapLayer(layerId = '') {
  const id = String(layerId).toLowerCase();
  return id.includes('landmark');
}

export function applyStandardBasemapConfig(map, entries = []) {
  if (!map || typeof map.setConfigProperty !== 'function') return;

  const apply = () => {
    for (const [key, value] of entries) {
      if (!VALID_KEYS.has(key)) continue;
      try {
        map.setConfigProperty('basemap', key, value);
      } catch {
        // Style may not be Standard yet.
      }
    }
  };

  if (map.isStyleLoaded?.()) {
    apply();
    return;
  }
  map.once('style.load', apply);
}

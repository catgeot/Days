/** Home globe zoom-tier visibility SSOT */

/** Mapbox place labels + admin boundaries visible at/above this zoom (gateo 마커·카테고리 노출 후). */
export const PLACE_LABEL_MIN_ZOOM = 4.0;

export const TIER_STAGE_ZOOM_LEVELS = {
  tier1: 1.1,
  tier2: 2.45
};

export const HIGH_ZOOM_FULL_REVEAL = 3.0;

export const GLOBE_ZOOM_POLICY = {
  /** zoom < 2.0: gateo tier-1 only, Mapbox place labels off */
  gateoTier1MaxZoom: 2.0,
  /** 2.0–3.9: gateo tier 1–2, Mapbox place labels off */
  gateoTier2MaxZoom: TIER_STAGE_ZOOM_LEVELS.tier2,
  /** 4.0+: Mapbox Korean place labels + boundaries on */
  mapboxLabelsMinZoom: PLACE_LABEL_MIN_ZOOM
};

export const getMaxTierForZoom = (zoom) => {
  if (zoom < TIER_STAGE_ZOOM_LEVELS.tier1) return 1;
  if (zoom < TIER_STAGE_ZOOM_LEVELS.tier2) return 2;
  return 3;
};

export const getMajorMergeThreshold = (zoom) => {
  if (zoom >= HIGH_ZOOM_FULL_REVEAL) return 0.12;
  if (zoom < 1.7) return 1.75;
  if (zoom < 2.5) return 1.1;
  return 0.55;
};

export const getMarkerCollisionThreshold = (zoom) => {
  if (zoom >= HIGH_ZOOM_FULL_REVEAL) return 0.06;
  if (zoom < 1.7) return 1.2;
  if (zoom < 2.5) return 0.82;
  return 0.42;
};

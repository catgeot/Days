/**
 * First-load globe labels vs auto-rotate.
 *
 * jumpTo every rAF restarts Mapbox continuePlacement and starves idle —
 * gateo layers stay hidden until something pauses rotate (EN toggle).
 *
 * Safari/WebKit: globe init can report isMoving with autoRotate still false,
 * and Korean CJK glyphs often land after overlay setData. EN toggle works
 * because it pauses rotate and rewrites text-field while the camera is still.
 */

export const GLOBE_LABEL_PLACEMENT_SETTLE_MS = 320;

/** Max hold before resume rotate so a missing idle cannot freeze the globe. */
export const GLOBE_LABEL_FIRST_HOLD_MAX_MS = 1600;

/** Pump text-field apply while rotate is held (Safari glyph + swallowed layout). */
export const GLOBE_LABEL_APPLY_PUMP_MS = [0, 80, 220, 480, 800, 1200];

export function shouldHoldGlobeAutoRotate({
  pauseRender = false,
  labelsSettled = false,
} = {}) {
  if (pauseRender) return true;
  return !labelsSettled;
}

/** Overlay GeoJSON is not enough — continent labels need a stopped text-field apply. */
export function shouldMarkGlobeLabelsSettled({
  overlayRevealed = false,
  basemapLabelsApplied = false,
} = {}) {
  return Boolean(overlayRevealed && basemapLabelsApplied);
}

export function shouldRetryBasemapLabelApply({
  appliedCount = 0,
  contextLayerCount = 0,
  isStyleLoaded = false,
} = {}) {
  if (!isStyleLoaded) return true;
  if (contextLayerCount === 0) return true;
  return appliedCount <= 0;
}

export function hasPaintedBasemapContextLabels(features = []) {
  return Array.isArray(features) && features.length > 0;
}

export function queryRenderedSymbolFeatures(map, layerIds) {
  if (!map || !Array.isArray(layerIds) || layerIds.length === 0) return [];
  const layers = layerIds.filter((id) => {
    try {
      return Boolean(map.getLayer(id));
    } catch {
      return false;
    }
  });
  if (!layers.length) return [];
  try {
    const canvas = map.getCanvas?.();
    const width = Number(canvas?.width) || 0;
    const height = Number(canvas?.height) || 0;
    if (width > 0 && height > 0) {
      return map.queryRenderedFeatures(
        [[0, 0], [width, height]],
        { layers },
      ) || [];
    }
    return map.queryRenderedFeatures(undefined, { layers }) || [];
  } catch {
    return [];
  }
}

/**
 * Retry overlay while the camera is settling.
 * Safari globe init reports isMoving without autoRotate; jumpTo rotate also.
 * flyTo/easeTo keep cameraAnimating / globeCameraBusy.
 */
export function shouldRetryOverlayRevealAfterRotatePause({
  cameraAnimating = false,
  globeCameraBusy = false,
  isMoving = false,
} = {}) {
  if (cameraAnimating || globeCameraBusy) return false;
  return Boolean(isMoving);
}

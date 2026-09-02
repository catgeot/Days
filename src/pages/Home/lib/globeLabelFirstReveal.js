/**
 * First-load globe labels vs auto-rotate.
 * jumpTo every rAF restarts Mapbox continuePlacement and starves idle —
 * gateo layers stay hidden until something pauses rotate (EN toggle).
 */

export const GLOBE_LABEL_PLACEMENT_SETTLE_MS = 320;

export function shouldHoldGlobeAutoRotate({
  pauseRender = false,
  labelsSettled = false,
} = {}) {
  if (pauseRender) return true;
  return !labelsSettled;
}

/** Auto-rotate jumpTo is not flyTo — pause and retry overlay reveal. */
export function shouldRetryOverlayRevealAfterRotatePause({
  cameraAnimating = false,
  globeCameraBusy = false,
  isMoving = false,
  autoRotate = false,
} = {}) {
  if (cameraAnimating || globeCameraBusy) return false;
  return Boolean(isMoving && autoRotate);
}

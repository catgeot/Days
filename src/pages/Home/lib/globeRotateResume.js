import { shouldHoldGlobeAutoRotate } from './globeLabelFirstReveal.js';

/**
 * Seconds to advance idle spin.
 * iOS Low Power Mode can invoke rAF with a repeated timestamp, so a rAF-delta
 * jumpTo moves 0°. Wall clock advances; a stuck clock still steps 1/30s.
 * A long gap (background tab) must not sling the globe.
 */
export function globeSpinDeltaSeconds(nowMs, lastMs) {
  if (!Number.isFinite(nowMs) || !Number.isFinite(lastMs)) return 0;
  const delta = (nowMs - lastMs) / 1000;
  if (!(delta > 0)) return 1 / 30;
  if (delta > 0.25) return 1 / 20;
  return delta;
}

/** Single gate for every auto-rotate resume path (#176 / #180 / #182 / orient fly / locale). */
export function canResumeGlobeAutoRotate({
  pauseRender = false,
  userPausedRotate = false,
  interaction = false,
  tourActive = false,
  immerseActive = false,
  flightCinemaActive = false,
  cameraAnimating = false,
  globeCameraBusy = false,
  mapMoving = false,
  labelsSettled = false,
  placeCardOpen = false,
} = {}) {
  if (pauseRender || userPausedRotate || interaction) return false;
  if (tourActive || immerseActive || flightCinemaActive) return false;
  if (cameraAnimating || globeCameraBusy || mapMoving) return false;
  if (placeCardOpen) return false;
  if (shouldHoldGlobeAutoRotate({ pauseRender, labelsSettled })) return false;
  return true;
}

import { shouldHoldGlobeAutoRotate } from './globeLabelFirstReveal.js';

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
} = {}) {
  if (pauseRender || userPausedRotate || interaction) return false;
  if (tourActive || immerseActive || flightCinemaActive) return false;
  if (cameraAnimating || globeCameraBusy || mapMoving) return false;
  if (shouldHoldGlobeAutoRotate({ pauseRender, labelsSettled })) return false;
  return true;
}

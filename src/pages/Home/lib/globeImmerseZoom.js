/**
 * 써머리「이 지역 보기」몰입 줌.
 * 진입: zoom 6. ×2 / ×4는 현재 줌에서 누적 확대만 (후퇴 없음).
 * Mapbox: +1 zoom ≈ ×2, +2 ≈ ×4.
 */
export const IMMERSE_ENTRY = {
  zoom: 6,
  pitch: 25,
  pitchDeep: 35,
  altitude: 0.55,
};

/** @typedef {'x2' | 'x4'} ImmerseZoomStep */

export const IMMERSE_ZOOM_DELTA = {
  x2: 1,
  x4: 2,
};

/** legacy globe.gl — altitude 배율 (낮을수록 확대) */
export const IMMERSE_ALT_FACTOR = {
  x2: 0.5,
  x4: 0.25,
};

export const IMMERSE_MIN_ALTITUDE = 0.05;

/** @deprecated 고정 단계 호환 — 진입만 사용 */
export const IMMERSE_LEVELS = {
  base: { zoom: IMMERSE_ENTRY.zoom, pitch: IMMERSE_ENTRY.pitch, altitude: IMMERSE_ENTRY.altitude },
};

/** @param {'base' | string | null | undefined} level */
export function resolveImmerseCamera(level = 'base') {
  if (level === 'base' || !level) {
    return {
      zoom: IMMERSE_ENTRY.zoom,
      pitch: IMMERSE_ENTRY.pitch,
      altitude: IMMERSE_ENTRY.altitude,
    };
  }
  return {
    zoom: IMMERSE_ENTRY.zoom,
    pitch: IMMERSE_ENTRY.pitch,
    altitude: IMMERSE_ENTRY.altitude,
  };
}

/**
 * @param {number | null | undefined} currentZoom
 * @param {ImmerseZoomStep} step
 * @param {number} [maxZoom]
 */
export function nextImmerseZoom(currentZoom, step, maxZoom = 22) {
  const base = Number.isFinite(currentZoom) ? currentZoom : IMMERSE_ENTRY.zoom;
  const delta = step === 'x4' ? IMMERSE_ZOOM_DELTA.x4 : IMMERSE_ZOOM_DELTA.x2;
  return Math.min(maxZoom, base + delta);
}

/**
 * @param {number | null | undefined} currentAltitude
 * @param {ImmerseZoomStep} step
 */
export function nextImmerseAltitude(currentAltitude, step) {
  const base = Number.isFinite(currentAltitude) ? currentAltitude : IMMERSE_ENTRY.altitude;
  const factor = step === 'x4' ? IMMERSE_ALT_FACTOR.x4 : IMMERSE_ALT_FACTOR.x2;
  return Math.max(IMMERSE_MIN_ALTITUDE, base * factor);
}

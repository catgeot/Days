/** fit 도착 줌 기준 상대 페이드 — 소국(고줌 fit)도 도착 시점에는 peak 유지 */
export const FILL_PEAK_OPACITY = 0.48;
export const LINE_PEAK_OPACITY = 0.95;
export const HALO_PEAK_OPACITY = 0.85;
export const DISPUTED_PEAK_OPACITY = 0.85;
export const DEFAULT_SETTLE_ZOOM = 4.2;

/** 줌 아웃(전체 위치 확인) 시 peak 유지 · 추가 확대(줌 인) 시에만 옅어짐 */
export const HIGHLIGHT_OPACITY_FLOOR_ZOOM = 1;

/** settle 대비 줌 인 페이드 구간 — 값이 클수록 확대해도 fill이 오래 유지 */
export const HIGHLIGHT_ZOOM_IN_FADE_START_OFFSET = 1.5;
export const HIGHLIGHT_ZOOM_IN_FADE_MID_OFFSET = 3;
export const HIGHLIGHT_ZOOM_IN_FADE_END_OFFSET = 4.5;

/**
 * @param {number} settleZoom fit/도착 줌
 * @param {number} peak 도착 줌 이하에서의 불투명도
 */
export function opacityExprFromSettle(settleZoom, peak) {
  const z = Number.isFinite(settleZoom) ? settleZoom : DEFAULT_SETTLE_ZOOM;
  const zPeak = Math.max(HIGHLIGHT_OPACITY_FLOOR_ZOOM, z);
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    HIGHLIGHT_OPACITY_FLOOR_ZOOM,
    peak,
    zPeak,
    peak,
    zPeak + HIGHLIGHT_ZOOM_IN_FADE_START_OFFSET,
    peak * 0.45,
    zPeak + HIGHLIGHT_ZOOM_IN_FADE_MID_OFFSET,
    peak * 0.12,
    zPeak + HIGHLIGHT_ZOOM_IN_FADE_END_OFFSET,
    0,
  ];
}

/**
 * @param {number} settleZoom
 * @returns {[number, number, number, number, number]}
 */
export function resolveHighlightZoomInFadeStops(settleZoom) {
  const z = Number.isFinite(settleZoom) ? settleZoom : DEFAULT_SETTLE_ZOOM;
  const zPeak = Math.max(HIGHLIGHT_OPACITY_FLOOR_ZOOM, z);
  return [
    HIGHLIGHT_OPACITY_FLOOR_ZOOM,
    zPeak,
    zPeak + HIGHLIGHT_ZOOM_IN_FADE_START_OFFSET,
    zPeak + HIGHLIGHT_ZOOM_IN_FADE_MID_OFFSET,
    zPeak + HIGHLIGHT_ZOOM_IN_FADE_END_OFFSET,
  ];
}

/**
 * 스모크용 — Mapbox interpolate(linear)와 동일한 구간 평가.
 * @param {number} settleZoom
 * @param {number} peak
 * @param {number} zoom
 */
export function sampleOpacityAtZoom(settleZoom, peak, zoom) {
  const z = Number.isFinite(settleZoom) ? settleZoom : DEFAULT_SETTLE_ZOOM;
  const zPeak = Math.max(HIGHLIGHT_OPACITY_FLOOR_ZOOM, z);
  const stops = [
    [HIGHLIGHT_OPACITY_FLOOR_ZOOM, peak],
    [zPeak, peak],
    [zPeak + HIGHLIGHT_ZOOM_IN_FADE_START_OFFSET, peak * 0.45],
    [zPeak + HIGHLIGHT_ZOOM_IN_FADE_MID_OFFSET, peak * 0.12],
    [zPeak + HIGHLIGHT_ZOOM_IN_FADE_END_OFFSET, 0],
  ];
  if (zoom <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i += 1) {
    const [z0, o0] = stops[i - 1];
    const [z1, o1] = stops[i];
    if (zoom <= z1) {
      const t = (zoom - z0) / (z1 - z0);
      return o0 + t * (o1 - o0);
    }
  }
  return stops[stops.length - 1][1];
}

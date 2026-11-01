/** /place→홈 flyTo — 도착 vs 중단 시 자전 재개 여부 SSOT */

export const HOME_GLOBE_FLY_ARRIVAL_LAT_DEG = 0.2;
export const HOME_GLOBE_FLY_ARRIVAL_LNG_DEG = 0.2;
/** 홈 복귀 fly 도착 후 캡처·라벨 안정화 — 자전 재개 전 대기 */
export const HOME_GLOBE_SETTLE_MS = 15_000;

/**
 * @param {{ lat: number, lng: number }} center
 * @param {{ lat: number, lng: number }} target
 * @returns {'arrived'|'short'}
 */
export function classifyHomeGlobeFlyOutcome(center, target) {
  if (!center || !target) return 'short';
  const lat = Number(center.lat);
  const lng = Number(center.lng);
  const tLat = Number(target.lat);
  const tLng = Number(target.lng);
  if (![lat, lng, tLat, tLng].every(Number.isFinite)) return 'short';
  const latDelta = Math.abs(lat - tLat);
  let lngDelta = Math.abs(lng - tLng);
  while (lngDelta > 180) lngDelta = 360 - lngDelta;
  if (latDelta <= HOME_GLOBE_FLY_ARRIVAL_LAT_DEG && lngDelta <= HOME_GLOBE_FLY_ARRIVAL_LNG_DEG) {
    return 'arrived';
  }
  return 'short';
}

/**
 * @param {'arrived'|'short'|'interrupted'|'repress'|'cancelled'} outcome
 */
export function shouldResumeAutoRotateAfterHomeFly(outcome) {
  return outcome !== 'arrived';
}

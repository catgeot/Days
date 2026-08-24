/**
 * 항공 시네마·경유 칩 디버그 (로직 변경 없음 — 관측만).
 *
 * 켜기 (브라우저 콘솔):
 *   localStorage.setItem('gateo:flight-cinema-debug', '1'); location.reload();
 * 끄기:
 *   localStorage.removeItem('gateo:flight-cinema-debug'); location.reload();
 *
 * DEV(`npm run dev`)에서는 localStorage 없이도 기본 ON.
 * 필터: 콘솔에서 `[FlightCinema:debug]` 검색.
 */

const LS_KEY = 'gateo:flight-cinema-debug';

export function isFlightCinemaDebugEnabled() {
  if (import.meta.env.DEV) return true;
  try {
    return globalThis.localStorage?.getItem(LS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {string} phase
 * @param {Record<string, unknown>} [data]
 */
export function logFlightCinemaDebug(phase, data = {}) {
  if (!isFlightCinemaDebugEnabled()) return;
  console.log('[FlightCinema:debug]', phase, {
    t: Date.now(),
    ...data,
  });
}

/**
 * @param {string} phase
 * @param {Record<string, unknown>} [data]
 */
export function warnFlightCinemaDebug(phase, data = {}) {
  if (!isFlightCinemaDebugEnabled()) return;
  console.warn('[FlightCinema:debug]', phase, {
    t: Date.now(),
    ...data,
  });
}

/** @param {Record<string, unknown> | null | undefined} location */
export function flightCinemaDebugLocationTag(location) {
  if (!location) return null;
  const slug = location.slug ?? location.placeId ?? null;
  const name = location.name ?? location.name_en ?? null;
  return slug || name || null;
}

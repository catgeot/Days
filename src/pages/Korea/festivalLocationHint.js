/** @typedef {'granted' | 'prompt' | 'denied' | 'unsupported'} GeolocationPermissionState */

export const LOC_HINT_DISMISS_KEY = 'korea-festival-loc-hint-dismissed-at';
export const LOC_HINT_SUCCESS_KEY = 'korea-festival-loc-success';

export const LOC_HINT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {number} ts
 * @param {number} [now]
 * @param {number} [ttlMs]
 */
export function isWithinTtl(ts, now = Date.now(), ttlMs = LOC_HINT_TTL_MS) {
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return now - ts < ttlMs;
}

/**
 * @param {Pick<Storage, 'getItem'> | null | undefined} storage
 * @param {number} [now]
 */
export function readDismissTimestamp(storage, now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOC_HINT_DISMISS_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    if (!isWithinTtl(ts, now)) return null;
    return ts;
  } catch {
    return null;
  }
}

/**
 * @param {Pick<Storage, 'getItem'> | null | undefined} storage
 * @param {number} [now]
 */
export function isHintDismissed(storage, now = Date.now()) {
  return readDismissTimestamp(storage, now) != null;
}

/**
 * @param {Pick<Storage, 'setItem'> | null | undefined} storage
 * @param {number} [now]
 */
export function writeHintDismissed(storage, now = Date.now()) {
  if (!storage) return;
  try {
    storage.setItem(LOC_HINT_DISMISS_KEY, String(now));
  } catch {
    /* private mode */
  }
}

/**
 * @typedef {{ at: number, lat: number, lng: number }} FestivalLocationSuccessRecord
 */

/**
 * @param {Pick<Storage, 'getItem'> | null | undefined} storage
 * @param {number} [now]
 * @returns {FestivalLocationSuccessRecord | null}
 */
export function readLocationSuccess(storage, now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOC_HINT_SUCCESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const at = Number(parsed?.at);
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    if (!isWithinTtl(at, now)) return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { at, lat, lng };
  } catch {
    return null;
  }
}

/**
 * @param {Pick<Storage, 'setItem'> | null | undefined} storage
 * @param {number} lat
 * @param {number} lng
 * @param {number} [now]
 */
export function writeLocationSuccess(storage, lat, lng, now = Date.now()) {
  if (!storage) return;
  try {
    storage.setItem(
      LOC_HINT_SUCCESS_KEY,
      JSON.stringify({ at: now, lat, lng }),
    );
  } catch {
    /* private mode */
  }
}

/**
 * @param {GeolocationPermissionState} permission
 * @param {FestivalLocationSuccessRecord | null} recentSuccess
 * @param {boolean} hintDismissed
 */
export function shouldAttemptSilentGeolocation(permission, recentSuccess, hintDismissed) {
  if (permission === 'granted') return true;
  if (recentSuccess) return true;
  if (permission === 'denied') return false;
  if (permission === 'prompt' && recentSuccess) return true;
  return false;
}

/**
 * @param {object} p
 * @param {boolean} p.hintDismissed
 * @param {FestivalLocationSuccessRecord | null} [p.recentSuccess]
 * @param {GeolocationPermissionState} [p.permission]
 * @param {boolean} p.loading
 * @param {boolean} p.error
 * @param {boolean} p.nearActive
 * @param {string | null} p.personalTab
 * @param {string} p.areaCode
 * @param {string} p.cityName
 * @param {string} p.defaultAreaCode
 * @param {boolean} p.searchActive
 */
export function shouldShowDefaultLocHint(p) {
  if (p.personalTab != null) return false;
  if (p.loading || p.error) return false;
  if (p.nearActive) return false;
  if (p.hintDismissed) return false;
  if (p.recentSuccess) return false;
  if (p.permission === 'granted') return false;
  if (p.areaCode !== p.defaultAreaCode || p.cityName !== 'all') return false;
  if (p.searchActive) return false;
  return true;
}

/**
 * @returns {Promise<GeolocationPermissionState>}
 */
export async function queryGeolocationPermission() {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      return 'unsupported';
    }
    const status = await navigator.permissions.query({ name: 'geolocation' });
    const state = status?.state;
    if (state === 'granted' || state === 'prompt' || state === 'denied') {
      return state;
    }
    return 'unsupported';
  } catch {
    return 'unsupported';
  }
}

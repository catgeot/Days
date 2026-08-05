const KEY = 'gateo:place-return-to';
const ALLOWED_EXACT = new Set([
  '/korea',
  '/korea/theme',
  '/korea/theme/top10',
  '/korea/theme/scenic',
  '/korea/theme/courses',
  '/korea/theme/regions',
  '/korea/theme/packages',
]);

/**
 * @param {unknown} path
 * @returns {path is string}
 */
function isAllowed(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  if (ALLOWED_EXACT.has(path)) return true;
  const pathname = path.split('?')[0];
  if (pathname === '/korea') return true;
  if (pathname === '/korea/theme' || pathname.startsWith('/korea/theme/')) {
    return ALLOWED_EXACT.has(pathname) || pathname === '/korea/theme';
  }
  return false;
}

/** @param {unknown} path */
export function isKoreaPlaceReturnPath(path) {
  return (
    typeof path === 'string' &&
    (path === '/korea' ||
      path.startsWith('/korea?') ||
      path === '/korea/theme' ||
      path.startsWith('/korea/theme/') ||
      path.startsWith('/korea/theme?'))
  );
}

/** @param {string} path */
export function setPlaceReturnTo(path) {
  if (!isAllowed(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* private mode */
  }
}

export function clearPlaceReturnTo() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

/**
 * @param {unknown} routeState
 * @returns {string | null}
 */
export function peekPlaceReturnTo(routeState) {
  const fromState =
    routeState && typeof routeState === 'object' && 'returnTo' in routeState
      ? /** @type {{ returnTo?: unknown }} */ (routeState).returnTo
      : null;
  if (isAllowed(fromState)) return fromState;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (isAllowed(stored)) return stored;
  } catch {
    /* private mode */
  }
  return null;
}

/**
 * @param {unknown} routeState
 * @returns {string | null}
 */
export function consumePlaceReturnTo(routeState) {
  const path = peekPlaceReturnTo(routeState);
  if (path) clearPlaceReturnTo();
  return path;
}

const EXACT_PATHS = new Set([
  '/',
  '/about',
  '/qa',
  '/account',
  '/admin/gallery',
]);

const PREFIX_PATHS = [
  '/place/',
  '/korea',
  '/world-events',
  '/explore',
  '/blog',
  '/auth/',
  '/p/',
  '/blog/e/',
];

function isKnownAppShellPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false;
  if (EXACT_PATHS.has(pathname)) return true;
  return PREFIX_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

/**
 * Paths that may keep their pathname when the English boot effect adds `?lang=en`.
 * Unknown paths (e.g. /reels with no registered route) normalize to `/` so we
 * never leave the SPA on a URL with no matching route.
 *
 * @param {string} pathname
 * @returns {string}
 */
export function resolveLocaleBootPathname(pathname) {
  const path = String(pathname || '/').trim() || '/';
  if (path === '/reels' || path.startsWith('/reels/')) {
    return '/';
  }
  return isKnownAppShellPath(path) ? path : '/';
}

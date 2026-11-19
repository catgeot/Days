/**
 * Place card href after navigation or async hydration.
 * Gallery is a real URL segment when present; an omitted tab is the bare /place/:slug path.
 */

function normalizeSearch(search) {
  const raw = String(search || '');
  if (!raw) return '';
  return raw.startsWith('?') ? raw : `?${raw}`;
}

function livePlaceTab(pathname) {
  const parts = String(pathname || '').split('?')[0].split('#')[0].split('/').filter(Boolean);
  if (parts[0] !== 'place' || !parts[1]) return '';
  return String(parts[2] || '').trim().toLowerCase();
}

/**
 * @param {{
 *   param: string,
 *   tab?: string,
 *   preserveRoute?: boolean,
 *   pathname?: string,
 *   search?: string,
 * }} input
 */
export function resolvePlaceCardHref({
  param,
  tab,
  preserveRoute = false,
  pathname = '',
  search = '',
}) {
  let tabKey = String(tab || '').trim().toLowerCase();
  let searchSuffix = '';
  if (preserveRoute) {
    if (!tabKey) tabKey = livePlaceTab(pathname);
    searchSuffix = normalizeSearch(search);
  }
  const tabSuffix = tabKey ? `/${tabKey}` : '';
  return `/place/${param}${tabSuffix}${searchSuffix}`;
}

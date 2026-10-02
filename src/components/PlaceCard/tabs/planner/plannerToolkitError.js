const SAFETY_HREF = 'https://www.0404.go.kr/dev/country_search.moa';

/**
 * @param {unknown} error
 * @param {unknown} data
 * @returns {'badRequest'|'unauthorized'|'forbidden'|'rateLimit'|'generic'|'network'|null}
 */
export function plannerToolkitErrorKey(error, data) {
  const status = Number(error?.context?.status ?? error?.status);
  if (status === 400) return 'badRequest';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rateLimit';
  if (error) return 'network';
  if (data && data.success === false) return 'generic';
  return null;
}

export function plannerToolkitSafetyHref() {
  return SAFETY_HREF;
}

/**
 * @param {{ lat?: unknown, lng?: unknown, name?: unknown }} [location]
 */
export function plannerToolkitMapHref(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const name = String(location?.name || '').trim();
  if (!name) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

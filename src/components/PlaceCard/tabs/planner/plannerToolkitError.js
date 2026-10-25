const SAFETY_HREF = 'https://www.0404.go.kr/dev/country_search.moa';

function toolkitErrorMessage(error, data) {
  const fromData = data?.error;
  if (typeof fromData === 'string' && fromData.trim()) return fromData.trim().toLowerCase();
  const ctxBody = error?.context?.body;
  if (typeof ctxBody === 'string' && ctxBody.trim()) {
    try {
      const parsed = JSON.parse(ctxBody);
      if (typeof parsed?.error === 'string') return parsed.error.trim().toLowerCase();
    } catch {
      return ctxBody.trim().toLowerCase();
    }
  }
  return String(error?.message ?? '').trim().toLowerCase();
}

/**
 * @param {unknown} error
 * @param {unknown} data
 * @returns {'badRequest'|'forbidden'|'rateLimit'|'generic'|'network'|null}
 */
export function plannerToolkitErrorKey(error, data) {
  const status = Number(error?.context?.status ?? error?.status);
  const msg = toolkitErrorMessage(error, data);
  if (status === 400) return 'badRequest';
  if (status === 429 || msg.includes('rate limited') || msg.includes('generation attempted recently')) {
    return 'rateLimit';
  }
  if (msg.includes('unregistered') || msg.includes('forbidden: unregistered')) {
    return 'forbidden';
  }
  if (status === 401 || status === 403) return 'generic';
  if (data && data.success === false) return 'generic';
  if (error) return 'network';
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

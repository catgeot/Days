const MOBILE_UA_PATTERN = /android|iphone|ipad|ipod|mobile/i;

export function isMobileUserAgent(userAgent = '') {
  try {
    return MOBILE_UA_PATTERN.test(userAgent || window.navigator?.userAgent || '');
  } catch {
    return false;
  }
}

export function resolveHomeGlobeEngine({
  mapboxToken,
  isProd = import.meta.env.PROD,
  userAgent
} = {}) {
  if (!mapboxToken) return 'legacy';
  if (isProd) return 'mapbox';

  // Dev-only: LAN mobile QA hits Mapbox token URL restrictions (403/CORS).
  if (isMobileUserAgent(userAgent)) return 'legacy';
  return 'mapbox';
}

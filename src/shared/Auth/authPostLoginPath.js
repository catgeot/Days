import { isInAppRelativePath } from '../navigation/appHistoryPathIndex.js';

const DEFAULT_FALLBACK = '/';
const MAX_DECODE_ROUNDS = 8;
const FORBIDDEN_IN_RAW = /\\|[\x00-\x1f\x7f]|\s/;

/** @param {string} origin */
function resolveAuthOrigin(origin) {
  if (typeof origin === 'string' && origin) return origin;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'https://www.gateo.kr';
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function decodeAuthPostLoginPath(raw) {
  let current = raw;
  for (let i = 0; i < MAX_DECODE_ROUNDS; i += 1) {
    if (FORBIDDEN_IN_RAW.test(current)) return null;
    try {
      const next = decodeURIComponent(current);
      if (next === current) return current;
      current = next;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {string} decoded
 * @returns {boolean}
 */
function firstPathSegmentAllowsColon(decoded) {
  const pathname = decoded.split('?')[0].split('#')[0];
  const first = pathname.split('/').find((seg) => seg.length > 0);
  if (!first) return true;
  return !first.includes(':');
}

/**
 * Post-login SPA navigation target. Same-site relative paths only (open-redirect guard).
 * @param {unknown} candidate
 * @param {string} [fallback]
 * @param {string} [origin]
 * @returns {string}
 */
export function sanitizeAuthPostLoginPath(candidate, fallback = DEFAULT_FALLBACK, origin) {
  const safeFallback = isInAppRelativePath(fallback) ? fallback : DEFAULT_FALLBACK;
  if (typeof candidate !== 'string') return safeFallback;
  const trimmed = candidate.trim();
  if (!trimmed) return safeFallback;

  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed) || trimmed.includes('://')) {
    return safeFallback;
  }
  if (FORBIDDEN_IN_RAW.test(trimmed)) return safeFallback;

  const decoded = decodeAuthPostLoginPath(trimmed);
  if (!decoded || !isInAppRelativePath(decoded)) return safeFallback;
  if (decoded.startsWith('//') || decoded.includes('//')) return safeFallback;
  if (!firstPathSegmentAllowsColon(decoded)) return safeFallback;

  const baseOrigin = resolveAuthOrigin(origin);
  let url;
  try {
    url = new URL(decoded, baseOrigin);
  } catch {
    return safeFallback;
  }
  if (url.origin !== baseOrigin) return safeFallback;

  const normalized = `${url.pathname}${url.search}${url.hash}`;
  if (!isInAppRelativePath(normalized) || normalized.startsWith('//')) return safeFallback;
  if (!firstPathSegmentAllowsColon(normalized)) return safeFallback;
  return normalized;
}
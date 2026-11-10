import { resolvePlaceTargetFromSlug } from './placeRouteHydrate.js';
import { isHangulPlaceStatsSlug } from './placeStatsSlugHydrate.js';

const TOUR_SLUG_RE = /^tour-(\d{1,32})$/;
const COORD_SLUG_PREFIX_RE = /^(city|loc|search|label)-/;

/** Slug needs network/async hydration before we can mark the route missing. */
export function isAsyncPlaceSlugHydration(slug, options = {}) {
  if (resolvePlaceTargetFromSlug(slug, options)) return false;
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return false;
  if (TOUR_SLUG_RE.test(normalized)) return true;
  if (isHangulPlaceStatsSlug(normalized)) return true;
  return false;
}

/** /place routes that synthesize a pin from coords or session even without SSOT hit. */
export function isSyntheticCoordPlaceSlug(slug) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!COORD_SLUG_PREFIX_RE.test(normalized)) return false;
  return /-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/.test(normalized);
}

export function inferInitialPlaceRouteResolve(slug, options = {}) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return { slug: normalized, status: 'missing' };
  if (resolvePlaceTargetFromSlug(slug, options)) {
    return { slug: normalized, status: 'found' };
  }
  if (isSyntheticCoordPlaceSlug(slug)) {
    return { slug: normalized, status: 'pending' };
  }
  if (isAsyncPlaceSlugHydration(slug, options)) {
    return { slug: normalized, status: 'pending' };
  }
  return { slug: normalized, status: 'missing' };
}

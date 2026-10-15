import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';
import { getPlaceUrlParam } from './formatUrlName.js';
import { resolveSearchResultSelect } from './exploreRecentHistory.js';

/**
 * Plan-2 sitewide search step 2 — county-safe open when flag ON.
 * Step 1 (POI vs 시군 slug, #466) stays on main unconditionally via resolveSearchResultSelect.
 */

export function isSiteSearchOpenEnabled() {
  return isGateoSiteSearchEnabled();
}

/**
 * @param {object | null | undefined} spot
 * @returns {object | null | undefined}
 */
export function applySiteSearchOpenPin(spot) {
  if (!isSiteSearchOpenEnabled() || !spot || typeof spot !== 'object') return spot;
  const decision = resolveSearchResultSelect(spot);
  return decision?.spot ?? spot;
}

/**
 * @param {object | null | undefined} spot
 * @returns {{ type: 'place', spot: object, param: string } | { type: 'home', spot: object } | null}
 */
export function resolveSiteSearchOpen(spot) {
  if (!isSiteSearchOpenEnabled()) return null;
  return resolveSearchResultSelect(spot);
}

/**
 * `/place/:param` or null when sitewide open says home/uiPlace only.
 * @param {object | null | undefined} spot
 */
export function siteSearchCatalogPlaceParam(spot) {
  if (!spot || typeof spot !== 'object') return '';
  if (!isSiteSearchOpenEnabled()) return getPlaceUrlParam(spot);
  const decision = resolveSearchResultSelect(spot);
  if (!decision) return '';
  if (decision.type === 'place') return decision.param;
  return '';
}

/**
 * Explore Enter 검색 — 탭 선택(onSelect)과 동일한 county-safe open (flag ON만).
 * @param {object | null | undefined} spot
 * @returns {{ mode: 'legacy' | 'skip' | 'place' | 'home', pin: object, param?: string }}
 */
export function siteSearchExploreEnterCommit(spot) {
  if (!spot || typeof spot !== 'object') return { mode: 'skip', pin: spot };
  if (!isSiteSearchOpenEnabled()) return { mode: 'legacy', pin: spot };
  const decision = resolveSearchResultSelect(spot);
  if (!decision) return { mode: 'skip', pin: spot };
  if (decision.type === 'place') {
    return { mode: 'place', pin: decision.spot, param: decision.param };
  }
  return { mode: 'home', pin: decision.spot };
}

import { PLACE_URL_TAB_BY_MEDIA_MODE } from '../../components/PlaceCard/common/placeMediaTabRoutes.js';

/**
 * Sitemap lists the place root plus gallery/planner/wiki.
 * Every router tab canonicalizes to itself. The bare `/place/:slug` stays the root —
 * pass the URL param, not the defaulted visible tab (`tab || 'gallery'`).
 */
const INDEXED_PLACE_TABS = new Set(['gallery', 'planner', 'wiki']);
const ROUTER_PLACE_TABS = new Set(Object.values(PLACE_URL_TAB_BY_MEDIA_MODE));

/**
 * @param {string | undefined | null} slug
 * @param {string | undefined | null} tab URL param, not the defaulted visible tab
 */
export function placeCanonicalPath(slug, tab) {
  const clean = String(slug ?? '').trim();
  const tabKey = String(tab ?? '').trim().toLowerCase();
  if (clean && ROUTER_PLACE_TABS.has(tabKey)) return `/place/${clean}/${tabKey}`;
  return `/place/${clean}`;
}

/**
 * Router tabs that are not gallery/planner/wiki.
 * Crawler title and description still come from the place root (#833). Canonical is the tab URL.
 */
export function isPlaceRootAliasTab(tab) {
  const key = String(tab ?? '').trim().toLowerCase();
  return ROUTER_PLACE_TABS.has(key) && !INDEXED_PLACE_TABS.has(key);
}

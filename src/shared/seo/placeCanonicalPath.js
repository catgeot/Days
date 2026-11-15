/**
 * Sitemap + crawler index the place root and gallery/planner/wiki on their own URLs.
 * reviews, video, events, and the default gallery view at `/place/:slug` stay on the root.
 * Passing the defaulted tab (`tab || 'gallery'`) would publish the gallery URL for the root.
 */
const INDEXED_PLACE_TABS = new Set(['gallery', 'planner', 'wiki']);
const PLACE_ROOT_ALIAS_TABS = new Set(['reviews', 'video', 'events']);

/**
 * @param {string | undefined | null} slug
 * @param {string | undefined | null} tab URL param, not the defaulted visible tab
 */
export function placeCanonicalPath(slug, tab) {
  const clean = String(slug ?? '').trim();
  const tabKey = String(tab ?? '').trim().toLowerCase();
  if (clean && INDEXED_PLACE_TABS.has(tabKey)) return `/place/${clean}/${tabKey}`;
  return `/place/${clean}`;
}

/** Tabs whose crawler HTML must repeat the place root, not a tab URL. */
export function isPlaceRootAliasTab(tab) {
  return PLACE_ROOT_ALIAS_TABS.has(String(tab ?? '').trim().toLowerCase());
}

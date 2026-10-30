/** Gateo rollout flags — `VITE_GATEO_*` env, value `'1'` enables. Default off in prod.
 *  `VITE_GATEO_SITE_SEARCH` is `'1'` on production (live site search + explore festival hits ship on merge).
 *  Exception: `VITE_GATEO_LIGHTBOX_HISTORY` defaults on for the place gallery.
 *  Set `0` to disable that step only. Festival lightbox history stays on (#531).
 */

export const GATEO_ENV_FLAG_NAMES = {
  POI_COUNTY_SLUG_SEARCH: 'VITE_GATEO_POI_COUNTY_SLUG_SEARCH',
  PLACE_CROSSLINK: 'VITE_GATEO_PLACE_CROSSLINK',
  SITE_SEARCH: 'VITE_GATEO_SITE_SEARCH',
  /** Regional “all site assets” bundles under search (PR-A+). Requires SITE_SEARCH. Default off. */
  SITE_SEARCH_ALL_ASSETS: 'VITE_GATEO_SITE_SEARCH_ALL_ASSETS',
  FESTIVAL_DATE_CHIP: 'VITE_GATEO_FESTIVAL_DATE_CHIP',
  LOGBOOK_REVIEW_HUB: 'VITE_GATEO_LOGBOOK_REVIEW_HUB',
  REVIEW_DEEPLINK: 'VITE_GATEO_REVIEW_DEEPLINK',
  PHOTO_CREDIT: 'VITE_GATEO_PHOTO_CREDIT',
  LIGHTBOX_HISTORY: 'VITE_GATEO_LIGHTBOX_HISTORY',
  LOCAL_INFO_ROLLOUT: 'VITE_GATEO_LOCAL_INFO_ROLLOUT',
  FESTIVAL_ROAD: 'VITE_GATEO_FESTIVAL_ROAD',
  NEARBY_CARDS: 'VITE_GATEO_NEARBY_CARDS',
  KOGL_REELS: 'VITE_GATEO_KOGL_REELS',
  SCENIC_PLACE_LINKS: 'VITE_GATEO_SCENIC_PLACE_LINKS',
  PLACE_WORLD_EVENTS_TAB: 'VITE_GATEO_PLACE_WORLD_EVENTS_TAB',
  /** Explore Enter panel matches autocomplete groups (hub exact). Default on; `0`/`false`/`off` disables. */
  EXPLORE_SEARCH_SUBMIT_PARITY: 'VITE_GATEO_EXPLORE_SEARCH_SUBMIT_PARITY',
  /** Desktop (lg+) — move gallery #facts/#stories into left overview scroll. Default off. */
  PLACE_DESKTOP_LEFT_INFO: 'VITE_GATEO_PLACE_DESKTOP_LEFT_INFO',
  /** MOONi scoped last-chat + verified festival list replies. Default off. */
  MOONI_SCOPED_FESTIVAL: 'VITE_GATEO_MOONI_SCOPED_FESTIVAL',
};

/** @param {string} name */
export function readGateoEnvFlag(name) {
  // ESM always has import.meta; Vite supplies import.meta.env. node --test rewrites env → __VITE_ENV__.
  const raw = import.meta.env?.[name] ?? globalThis.__VITE_ENV__?.[name];
  return String(raw || '') === '1';
}

export function isGateoPoiCountySlugSearchFixEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.POI_COUNTY_SLUG_SEARCH);
}

export function isGateoPlaceCrosslinkEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.PLACE_CROSSLINK);
}

export function isGateoSiteSearchEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.SITE_SEARCH);
}

export function isGateoSiteSearchAllAssetsEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.SITE_SEARCH_ALL_ASSETS);
}

export function isGateoFestivalDateChipEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.FESTIVAL_DATE_CHIP);
}

export function isGateoLogbookReviewHubEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.LOGBOOK_REVIEW_HUB);
}

export function isGateoReviewDeeplinkEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.REVIEW_DEEPLINK);
}

export function isGateoPhotoCreditEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.PHOTO_CREDIT);
}

/** Place gallery. Unset defaults on. `0`, `false`, and `off` disable the step. */
export function isGateoLightboxHistoryEnabled() {
  const name = GATEO_ENV_FLAG_NAMES.LIGHTBOX_HISTORY;
  const raw = import.meta.env?.[name] ?? globalThis.__VITE_ENV__?.[name];
  if (raw == null || String(raw).trim() === '') return true;
  const value = String(raw).trim().toLowerCase();
  return value !== '0' && value !== 'false' && value !== 'off';
}

/** Festival passes `always` so flag `0` cannot drop the sheet's lightbox step (#531). */
export function resolveLightboxHistoryEnabled(always = false) {
  return always === true || isGateoLightboxHistoryEnabled();
}

/** Extra local-info places. Cairo stays on when this is off. */
export function isGateoLocalInfoRolloutEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.LOCAL_INFO_ROLLOUT);
}

/** Festival road draft inside festival detail. Default off. */
export function isGateoFestivalRoadEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.FESTIVAL_ROAD);
}

/** Festival nearby sights/food 2-column cards. Default off. */
export function isGateoNearbyCardsEnabled() {
  // Unset defaults on; `0`/`false`/`off` kill switch.
  const name = GATEO_ENV_FLAG_NAMES.NEARBY_CARDS;
  const raw = import.meta.env?.[name] ?? globalThis.__VITE_ENV__?.[name];
  if (raw == null || String(raw).trim() === '') return true;
  const value = String(raw).trim().toLowerCase();
  return value !== '0' && value !== 'false' && value !== 'off';
}

/** Globe home KOGL reels section. Default off. */
export function isGateoKoglReelsEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.KOGL_REELS);
}

/** Scenic modal place-card CTA, hub regional grid, SSOT scenic gallery fallback. Default off. */
export function isGateoScenicPlaceLinksEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.SCENIC_PLACE_LINKS);
}

/** PlaceCard / home summary — dedicated 「세계 행사」 tab instead of inline accordion. Default off. */
export function isGateoPlaceWorldEventsTabEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.PLACE_WORLD_EVENTS_TAB);
}

/** Hub-exact Enter + autocomplete normalize. Unset defaults on; `0`/`false`/`off` kill switch. */
export function isGateoExploreSearchSubmitParityEnabled() {
  const name = GATEO_ENV_FLAG_NAMES.EXPLORE_SEARCH_SUBMIT_PARITY;
  const raw = import.meta.env?.[name] ?? globalThis.__VITE_ENV__?.[name];
  if (raw == null || String(raw).trim() === '') return true;
  const value = String(raw).trim().toLowerCase();
  if (value === '0' || value === 'false' || value === 'off') return false;
  return true;
}

/** /place/* desktop two-column — facts/stories in left overview panel (lg+). Default off. */
export function isGateoPlaceDesktopLeftInfoEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.PLACE_DESKTOP_LEFT_INFO);
}

/** MOONi conversation scope keys + verified-festival reply polish. Default off. */
export function isGateoMooniScopedFestivalEnabled() {
  return readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.MOONI_SCOPED_FESTIVAL);
}

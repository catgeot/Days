/** Gateo rollout flags — `VITE_GATEO_*` env, value `'1'` enables. Default off in prod. */

export const GATEO_ENV_FLAG_NAMES = {
  POI_COUNTY_SLUG_SEARCH: 'VITE_GATEO_POI_COUNTY_SLUG_SEARCH',
  PLACE_CROSSLINK: 'VITE_GATEO_PLACE_CROSSLINK',
  SITE_SEARCH: 'VITE_GATEO_SITE_SEARCH',
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

/** Gateo rollout flags — `VITE_GATEO_*` env, value `'1'` enables. Default off in prod. */

export const GATEO_ENV_FLAG_NAMES = {
  POI_COUNTY_SLUG_SEARCH: 'VITE_GATEO_POI_COUNTY_SLUG_SEARCH',
  PLACE_CROSSLINK: 'VITE_GATEO_PLACE_CROSSLINK',
  SITE_SEARCH: 'VITE_GATEO_SITE_SEARCH',
};

function readGateoEnvFlag(name) {
  const raw =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.[name]
      : globalThis.__VITE_ENV__?.[name];
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

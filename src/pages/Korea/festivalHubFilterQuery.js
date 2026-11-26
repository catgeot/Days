import koreaAreaCodes from '../Home/data/koreaAreaCodes.json' with { type: 'json' };
import { FESTIVAL_TASTE_THEMES } from './festivalTasteTags.js';
import { FESTIVAL_HUB_FULL_PERIOD_TAB } from './festivalHubClearPeriod.js';
import { DEFAULT_AREA_CODE } from './koreaFestivalDefaults.js';

export const FESTIVAL_TIME_QUERY = 'time';
export const FESTIVAL_REGION_QUERY = 'region';
export const FESTIVAL_TASTE_QUERY = 'taste';

const BASE_TIME_IDS = new Set([
  'now',
  'weekend',
  'thisMonth',
  'spring',
  'summer',
  'autumn',
  'winter',
  FESTIVAL_HUB_FULL_PERIOD_TAB,
]);

const DATE_CHIP_TIME_IDS = new Set(['window30', 'date']);

const REGION_IDS = new Set([
  'all',
  ...Object.keys(koreaAreaCodes?.areas || {}),
]);

const TASTE_IDS = new Set([
  'all',
  ...FESTIVAL_TASTE_THEMES.map((theme) => theme.id),
]);

/**
 * @param {string} value
 * @param {{ dateChip?: boolean }} [opts]
 */
export function isFestivalHubTimeParam(value, opts = {}) {
  const id = String(value || '');
  if (BASE_TIME_IDS.has(id)) return true;
  if (opts.dateChip && DATE_CHIP_TIME_IDS.has(id)) return true;
  return false;
}

/** @param {string} value */
export function isFestivalHubRegionParam(value) {
  return REGION_IDS.has(String(value || ''));
}

/** @param {string} value */
export function isFestivalHubTasteParam(value) {
  return TASTE_IDS.has(String(value || ''));
}

/**
 * Missing params keep the caller's defaults (session region, default time, taste all).
 * Present but invalid params fall back to the product defaults.
 * @param {URLSearchParams} searchParams
 * @param {{ defaultTime: string, defaultArea: string, dateChip?: boolean }} defaults
 */
export function readFestivalHubFilterQuery(searchParams, defaults) {
  const defaultTime = defaults.defaultTime;
  const timeRaw = searchParams.get(FESTIVAL_TIME_QUERY);
  let timeTab = defaultTime;
  if (timeRaw != null && timeRaw !== '') {
    timeTab = isFestivalHubTimeParam(timeRaw, { dateChip: defaults.dateChip })
      ? timeRaw
      : defaultTime;
  }

  const regionRaw = searchParams.get(FESTIVAL_REGION_QUERY);
  let areaCode = defaults.defaultArea;
  let regionExplicit = false;
  if (regionRaw != null && regionRaw !== '') {
    if (isFestivalHubRegionParam(regionRaw)) {
      areaCode = regionRaw;
      regionExplicit = true;
    } else {
      areaCode = DEFAULT_AREA_CODE;
      regionExplicit = false;
    }
  }

  const tasteRaw = searchParams.get(FESTIVAL_TASTE_QUERY);
  let tasteId = 'all';
  if (tasteRaw != null && tasteRaw !== '') {
    tasteId = isFestivalHubTasteParam(tasteRaw) ? tasteRaw : 'all';
  }

  return { timeTab, areaCode, tasteId, regionExplicit };
}

/**
 * Chip taps use replace. Only keys present on `patch` are written.
 * `region: 'all'` with `touchRegion` stays in the query so a later reload
 * does not restore a session region over an explicit nationwide choice.
 * @param {URLSearchParams} searchParams
 * @param {{
 *   defaultTime: string,
 *   time?: string,
 *   region?: string,
 *   taste?: string,
 *   touchRegion?: boolean,
 *   clearFestival?: boolean,
 * }} patch
 */
export function writeFestivalHubFilterQuery(searchParams, patch) {
  const next = new URLSearchParams(searchParams);
  if (patch.clearFestival) next.delete('festival');
  if (patch.time !== undefined) {
    if (!patch.time || patch.time === patch.defaultTime) next.delete(FESTIVAL_TIME_QUERY);
    else next.set(FESTIVAL_TIME_QUERY, patch.time);
  }
  if (patch.taste !== undefined) {
    if (!patch.taste || patch.taste === 'all') next.delete(FESTIVAL_TASTE_QUERY);
    else next.set(FESTIVAL_TASTE_QUERY, patch.taste);
  }
  if (patch.region !== undefined) {
    if (patch.touchRegion) next.set(FESTIVAL_REGION_QUERY, patch.region || 'all');
    else if (!patch.region || patch.region === 'all') next.delete(FESTIVAL_REGION_QUERY);
    else next.set(FESTIVAL_REGION_QUERY, patch.region);
  }
  return next;
}

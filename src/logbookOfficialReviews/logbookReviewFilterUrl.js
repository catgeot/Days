import { LOGBOOK_REVIEW_FILTER_MAJOR } from './groupLogbookOfficialReviews.js';

export const LOGBOOK_REVIEW_FILTER_REGION_QUERY = 'region';
export const LOGBOOK_REVIEW_FILTER_CITY_QUERY = 'city';

const MAJOR_VALUES = new Set(Object.values(LOGBOOK_REVIEW_FILTER_MAJOR));

function toUrlSearchParams(search) {
  return search instanceof URLSearchParams
    ? search
    : new URLSearchParams(String(search ?? '').replace(/^\?/, ''));
}

/**
 * True when `region` is present but not a known major — needs replace-fix once.
 */
export function logbookReviewFilterUrlNeedsNormalize(search) {
  const params = toUrlSearchParams(search);
  const regionRaw = String(params.get(LOGBOOK_REVIEW_FILTER_REGION_QUERY) || '')
    .trim()
    .toLowerCase();
  return Boolean(regionRaw && !MAJOR_VALUES.has(regionRaw));
}

/**
 * @param {URLSearchParams | string | null | undefined} search
 */
export function parseLogbookReviewFilterFromSearch(search) {
  const params = toUrlSearchParams(search);
  const regionRaw = String(params.get(LOGBOOK_REVIEW_FILTER_REGION_QUERY) || '')
    .trim()
    .toLowerCase();
  const major = MAJOR_VALUES.has(regionRaw) ? regionRaw : LOGBOOK_REVIEW_FILTER_MAJOR.ALL;
  const city = String(params.get(LOGBOOK_REVIEW_FILTER_CITY_QUERY) || '')
    .trim()
    .toLowerCase();
  return { major, citySlug: city };
}

/**
 * @param {URLSearchParams} params
 * @param {'all'|'domestic'|'overseas'} major
 * @param {string} citySlug
 */
export function applyLogbookReviewFilterToSearchParams(params, major, citySlug) {
  const next = new URLSearchParams(params);
  if (major === LOGBOOK_REVIEW_FILTER_MAJOR.ALL) {
    next.delete(LOGBOOK_REVIEW_FILTER_REGION_QUERY);
    next.delete(LOGBOOK_REVIEW_FILTER_CITY_QUERY);
    return next;
  }
  next.set(LOGBOOK_REVIEW_FILTER_REGION_QUERY, major);
  const city = String(citySlug || '').trim().toLowerCase();
  if (city) next.set(LOGBOOK_REVIEW_FILTER_CITY_QUERY, city);
  else next.delete(LOGBOOK_REVIEW_FILTER_CITY_QUERY);
  return next;
}
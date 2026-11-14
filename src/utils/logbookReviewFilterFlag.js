import {
  GATEO_ENV_FLAG_NAMES,
  isGateoLogbookReviewHubEnabled,
  readGateoEnvFlag,
} from '../shared/gateoFeatureFlags.js';

export const LOGBOOK_REVIEW_FILTER_QUERY_PARAM = 'logbook_filter';
export const LOGBOOK_REVIEW_HUB_PREVIEW_QUERY_PARAM = 'logbook_review_hub';
export const LOGBOOK_REVIEW_FILTER_STORAGE_KEY = 'gateo_logbook_review_filter';

function readTruthyQueryParam(name) {
  if (typeof window === 'undefined') return false;
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

function readTruthyLocalStorage(key) {
  if (typeof window === 'undefined') return false;
  try {
    const value = localStorage.getItem(key);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

/** Filter chips (default OFF). `?logbook_filter=1` or preview localStorage enables. */
export function isGateoLogbookReviewFilterEnabled() {
  if (readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.LOGBOOK_REVIEW_FILTER)) return true;
  if (readTruthyQueryParam(LOGBOOK_REVIEW_FILTER_QUERY_PARAM)) return true;
  return readTruthyLocalStorage(LOGBOOK_REVIEW_FILTER_STORAGE_KEY);
}

/** Hub must be on for filter UI; preview may use `?logbook_review_hub=1` when env hub is OFF. */
export function isLogbookOfficialReviewHubActive() {
  if (isGateoLogbookReviewHubEnabled()) return true;
  return readTruthyQueryParam(LOGBOOK_REVIEW_HUB_PREVIEW_QUERY_PARAM);
}

/** Editorial review detail hero + 2-line hub cards (prod: hub + filter env both ON). */
export function isLogbookEditorialReviewDetailLayoutActive() {
  return isLogbookOfficialReviewHubActive() && isGateoLogbookReviewFilterEnabled();
}

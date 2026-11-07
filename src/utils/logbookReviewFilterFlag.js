import {
  GATEO_ENV_FLAG_NAMES,
  isGateoLogbookReviewHubEnabled,
  readGateoEnvFlag,
} from '../shared/gateoFeatureFlags.js';

export const LOGBOOK_REVIEW_FILTER_QUERY_PARAM = 'logbook_filter';
export const LOGBOOK_REVIEW_HUB_PREVIEW_QUERY_PARAM = 'logbook_review_hub';

function readTruthyQueryParam(name) {
  if (typeof window === 'undefined') return false;
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

/** Filter chips (default OFF). `?logbook_filter=1` enables for that page load only. */
export function isGateoLogbookReviewFilterEnabled() {
  if (readGateoEnvFlag(GATEO_ENV_FLAG_NAMES.LOGBOOK_REVIEW_FILTER)) return true;
  return readTruthyQueryParam(LOGBOOK_REVIEW_FILTER_QUERY_PARAM);
}

/** Hub must be on for filter UI; preview may use `?logbook_review_hub=1` when env hub is OFF. */
export function isLogbookOfficialReviewHubActive() {
  if (isGateoLogbookReviewHubEnabled()) return true;
  return readTruthyQueryParam(LOGBOOK_REVIEW_HUB_PREVIEW_QUERY_PARAM);
}

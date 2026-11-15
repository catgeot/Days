import {
  isGateoLogbookReviewFilterEnabled,
  isLogbookOfficialReviewHubActive,
} from '../utils/logbookReviewFilterFlag.js';

const HUB_DETAIL_LAYOUT_SESSION = 'gateo:logbook-review-detail-layout';

/** Hub → review navigation: keep detail hero when filter was active on /blog but URL dropped query params. */
export function markLogbookEditorialReviewDetailLayoutFromHub() {
  if (typeof window === 'undefined') return;
  if (!isLogbookOfficialReviewHubActive() || !isGateoLogbookReviewFilterEnabled()) return;
  try {
    sessionStorage.setItem(HUB_DETAIL_LAYOUT_SESSION, '1');
  } catch {
    /* private mode */
  }
}

export function isLogbookEditorialReviewDetailLayoutFromHubSession() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(HUB_DETAIL_LAYOUT_SESSION) === '1';
  } catch {
    return false;
  }
}

/** Matches LogBook card grid + detail hero rollout (hub + filter). */
export function isLogbookEditorialReviewDetailLayoutActive() {
  if (isLogbookOfficialReviewHubActive() && isGateoLogbookReviewFilterEnabled()) return true;
  return isLogbookEditorialReviewDetailLayoutFromHubSession();
}
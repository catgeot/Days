import { buildSpotLookup, resolveTravelSpotFromPlaceId } from '../utils/travelSpotResolve.js';
import { TRAVEL_SPOTS } from '../pages/Home/data/travelSpots.js';
import { logbookPlaceKey } from '../utils/logbookReadingMeta.js';
import {
  LOGBOOK_REVIEW_FILTER_MAJOR,
  isLogbookReviewPlaceDomestic,
} from './groupLogbookOfficialReviews.js';

let cachedSpotLookup = null;
function spotLookup() {
  if (!cachedSpotLookup) cachedSpotLookup = buildSpotLookup();
  return cachedSpotLookup;
}

/**
 * Map /blog?location=… place chip to official-review hub city slug + major bucket.
 * @param {string | null | undefined} locationFilter
 */
export function resolveLogbookBlogLocationReviewFilter(locationFilter) {
  const key = logbookPlaceKey(locationFilter);
  if (!key) {
    return { citySlug: '', major: LOGBOOK_REVIEW_FILTER_MAJOR.ALL };
  }
  const hit = resolveTravelSpotFromPlaceId(spotLookup(), TRAVEL_SPOTS, key);
  const slug = String(hit?.spot?.slug || '').trim().toLowerCase();
  if (!slug) {
    return { citySlug: '', major: LOGBOOK_REVIEW_FILTER_MAJOR.ALL };
  }
  const major = isLogbookReviewPlaceDomestic(slug)
    ? LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC
    : LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS;
  return { citySlug: slug, major };
}
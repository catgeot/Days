/**
 * Pre-#511 usePlaceGallery gate (main/prod): Hangul display name enabled TourAPI.
 */
import {
  isDomesticKoreaLocation,
  resolveTourApiPlace,
} from '../../src/utils/tourApiMatch.js';

const HANGUL_RE = /[\uAC00-\uD7A3]/;

/**
 * @param {Array<object|null|undefined>} locations
 * @param {import('../../src/utils/tourApiMatch.js').TourApiPlaceMapping | null} resolvedTourMapping
 * @param {string} koreanName
 */
export function shouldUseTourApiGalleryMainLegacy(locations, resolvedTourMapping, koreanName = '') {
  const locs = (Array.isArray(locations) ? locations : [locations]).filter(
    (loc) => loc && typeof loc === 'object',
  );
  const isDomesticKorea =
    locs.some(isDomesticKoreaLocation) ||
    Boolean(resolvedTourMapping?.curated) ||
    Boolean(koreanName && HANGUL_RE.test(koreanName));
  return isDomesticKorea;
}

export function buildGalleryGateContext(spot) {
  const name = String(spot.name || '').trim();
  const mapping = resolveTourApiPlace(spot);
  const locations = [spot];
  return { locations, mapping, koreanName: name };
}

import { koreaTourContentPlaceParam } from '../../Home/lib/formatUrlName.js';

/**
 * place_reviews.place_slug for a TourAPI festival contentId.
 * SSOT: same as domestic /place/tour-{id} (formatUrlName.koreaTourContentPlaceParam).
 */
export function festivalReviewPlaceSlug(contentId) {
  return koreaTourContentPlaceParam(contentId);
}

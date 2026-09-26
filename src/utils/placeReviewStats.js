import { isUserReviewForStats } from './placeReviewEditorial.js';

/**
 * @param {Array<{ rating?: number, is_editorial?: boolean }>|null|undefined} reviews
 */
export function computePlaceReviewStats(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const travelerReviews = list.filter(isUserReviewForStats);
  const editorialReviews = list.filter((r) => r?.is_editorial);
  const travelerCount = travelerReviews.length;
  const editorialCount = editorialReviews.length;

  let averageRating = null;
  if (travelerCount > 0) {
    const sum = travelerReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    averageRating = Math.round((sum / travelerCount) * 10) / 10;
  }

  return {
    travelerCount,
    editorialCount,
    averageRating,
    averageRatingDisplay: averageRating != null ? averageRating.toFixed(1) : null,
    /** @deprecated use travelerCount — kept for gradual migration */
    totalReviews: travelerCount,
  };
}

/**
 * @param {{ travelerCount: number, averageRating: number|null }} stats
 */
export function buildTravelerAggregateRatingSchema(stats) {
  if (!stats || stats.travelerCount < 1 || stats.averageRating == null) {
    return null;
  }
  return {
    '@type': 'AggregateRating',
    ratingValue: stats.averageRating,
    reviewCount: stats.travelerCount,
    bestRating: 5,
    worstRating: 1,
  };
}

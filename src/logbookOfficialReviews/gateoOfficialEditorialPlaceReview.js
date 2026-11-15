/** Official GATEO reviewer place_reviews (hub index + detail hero). */
export function isGateoOfficialEditorialPlaceReview(review) {
  if (!review || typeof review !== 'object') return false;
  const flag = review.is_editorial;
  if (flag === true || flag === 1) return true;
  if (typeof flag === 'string') {
    const norm = flag.trim().toLowerCase();
    return norm === 'true' || norm === '1' || norm === 'yes';
  }
  return false;
}
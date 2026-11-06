/**
 * GlobeStayStrip 카드 성급 — Edge `fetch-mrt-stays` StayItem.starRating (`it.starRating` → Number) 만 사용.
 */

/**
 * @param {unknown} starRating
 * @param {(key: string, opts?: object) => string} t
 */
export function formatMrtStayStarRatingLabel(starRating, t) {
  const n = Number(starRating);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 5) return '';
  return t('home.stayStrip.hotelStars', { count: n });
}

/**
 * @param {object | null | undefined} item
 * @param {(key: string, opts?: object) => string} t
 * @returns {{ starLine: string }}
 */
export function mrtStayCardMetaLines(item, t) {
  return { starLine: formatMrtStayStarRatingLabel(item?.starRating, t) };
}

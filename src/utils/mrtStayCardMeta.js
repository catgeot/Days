/**
 * MRT 숙소 카드 부가 정보 — Edge `fetch-mrt-stays` items 필드만 사용(없으면 생략).
 */

function stayCategoryLabel(item) {
  const raw = String(
    item?.categoryLabel ||
      item?.categoryName ||
      item?.category ||
      item?.propertyType ||
      item?.type ||
      item?.grade ||
      '',
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw || raw.length > 24) return '';
  return raw;
}

function stayAddressLabel(item) {
  const raw = String(item?.address || item?.addressName || item?.regionName || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw || raw.length > 80) return '';
  return raw;
}

/**
 * @param {unknown} starRating
 * @param {(key: string, opts?: object) => string} t
 */
export function formatMrtStayStarRatingLabel(starRating, t) {
  const n = Number(starRating);
  if (!Number.isFinite(n) || n <= 0 || n > 6) return '';
  const count = Math.round(n);
  if (count < 1) return '';
  return t('home.stayStrip.hotelStars', { count });
}

/**
 * @param {object | null | undefined} item
 * @returns {{ starLine: string, detailLine: string }}
 */
export function mrtStayCardMetaLines(item, t) {
  const starLine = formatMrtStayStarRatingLabel(item?.starRating, t);
  const detailParts = [];
  const category = stayCategoryLabel(item);
  const address = stayAddressLabel(item);
  if (category) detailParts.push(category);
  if (address) detailParts.push(address);
  return {
    starLine,
    detailLine: detailParts.join(' · '),
  };
}

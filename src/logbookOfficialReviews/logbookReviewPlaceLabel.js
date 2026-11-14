/** Hub chips/cards — place_name often includes venue after middle dot. */
export function shortenLogbookReviewPlaceName(placeName) {
  const name = String(placeName || '').trim();
  if (!name) return '';
  const dot = name.indexOf('·');
  if (dot > 0) return name.slice(0, dot).trim();
  return name;
}
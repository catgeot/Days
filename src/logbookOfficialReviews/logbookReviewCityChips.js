export const LOGBOOK_REVIEW_CITY_CHIP_VISIBLE_MAX = 8;

/**
 * @param {Array<{ slug: string }>} cities sorted by count desc
 * @param {string} [selectedSlug]
 */
export function buildLogbookReviewCityChipLayout(cities, selectedSlug) {
  const list = Array.isArray(cities) ? cities : [];
  const selected = String(selectedSlug || '')
    .trim()
    .toLowerCase();
  let primary = list.slice(0, LOGBOOK_REVIEW_CITY_CHIP_VISIBLE_MAX);
  if (selected) {
    const selectedChip = list.find((c) => c.slug === selected);
    if (selectedChip && !primary.some((c) => c.slug === selected)) {
      primary = [...list.slice(0, LOGBOOK_REVIEW_CITY_CHIP_VISIBLE_MAX - 1), selectedChip];
    }
  }
  const primarySlugs = new Set(primary.map((c) => c.slug));
  const overflow = list.filter((c) => !primarySlugs.has(c.slug));
  return {
    primary,
    overflow,
    overflowCount: overflow.length,
  };
}
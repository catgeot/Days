import travelSpotsList from '../pages/Home/data/travelSpots-list.json' with { type: 'json' };

const spotBySlug = new Map(
  travelSpotsList.map((spot) => [String(spot.slug || '').trim().toLowerCase(), spot]),
);

/** Hub chips/cards — place_name often includes venue after middle dot. */
export function shortenLogbookReviewPlaceName(placeName) {
  const name = String(placeName || '').trim();
  if (!name) return '';
  const dot = name.indexOf('·');
  if (dot > 0) return name.slice(0, dot).trim();
  return name;
}

/**
 * @param {{ place_slug?: string, place_name?: string }} review
 * @param {'ko' | 'en'} lang
 */
export function resolveLogbookReviewPlaceDisplayName(review, lang) {
  const placeName = String(review?.place_name || '').trim();
  const slug = String(review?.place_slug || '').trim().toLowerCase();
  if (lang === 'en') {
    const fixtureEn = String(review?.place_name_en || '').trim();
    if (fixtureEn) return fixtureEn;
  }
  const spot = slug ? spotBySlug.get(slug) : null;
  if (lang === 'en' && spot) {
    const en =
      String(spot.name_en || spot.nameEn || spot.english_name || spot.destination_en || '').trim();
    if (en) return en;
  }
  const short = shortenLogbookReviewPlaceName(placeName);
  return short || placeName || (slug && spot?.name) || slug;
}

/** City chip row */
export function resolveLogbookReviewCityChipLabel(chip, lang) {
  if (lang === 'en' && chip?.slug) {
    const spot = spotBySlug.get(String(chip.slug).trim().toLowerCase());
  const en = spot ? String(spot.name_en || spot.nameEn || '').trim() : '';
    if (en) return en;
  }
  return chip?.shortPlaceName || chip?.placeName || chip?.slug || '';
}
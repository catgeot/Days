import travelSpotsList from '../pages/Home/data/travelSpots-list.json' with { type: 'json' };

/** 0건이면 칩에서 숨김 — travelSpots-list에 국가 없을 때 폴백 */
export const LOGBOOK_REVIEW_FILTER_DOMESTIC_SLUGS = new Set([
  'jeju',
  'seoul',
  'busan',
  'incheon',
  'daegu',
  'gwangju',
  'daejeon',
  'ulsan',
  'suwon',
  'jeonju',
  'gyeongju',
  'gangneung',
  'chuncheon',
  'yeosu',
  'pohang',
  'gapyeong',
  'andong',
  'gunsan',
  'mokpo',
  'jeju-island',
  'seogwipo',
]);

const spotBySlug = new Map(
  travelSpotsList.map((spot) => [String(spot.slug || '').trim().toLowerCase(), spot]),
);

export function isLogbookReviewPlaceDomestic(placeSlug) {
  const slug = String(placeSlug || '').trim().toLowerCase();
  if (!slug) return false;
  const spot = spotBySlug.get(slug);
  if (spot) {
    const country = String(spot.country || '').trim();
    const countryEn = String(spot.country_en || '').trim().toLowerCase();
    if (country === '한국') return true;
    if (countryEn === 'south korea' || countryEn === 'republic of korea' || countryEn === 'korea') {
      return true;
    }
    if (country || countryEn) return false;
  }
  return LOGBOOK_REVIEW_FILTER_DOMESTIC_SLUGS.has(slug);
}

/**
 * @param {Array<{ place_slug?: string, place_name?: string }>} rows
 */
export function groupLogbookOfficialReviews(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let domesticCount = 0;
  let overseasCount = 0;
  const cityMap = new Map();

  for (const row of list) {
    const slug = String(row?.place_slug || '').trim().toLowerCase();
    if (!slug) continue;
    const domestic = isLogbookReviewPlaceDomestic(slug);
    if (domestic) domesticCount += 1;
    else overseasCount += 1;

    const placeName = String(row?.place_name || '').trim() || slug;
    const prev = cityMap.get(slug);
    if (prev) {
      prev.count += 1;
      if (!prev.placeName && placeName) prev.placeName = placeName;
    } else {
      cityMap.set(slug, { slug, placeName, count: 1, domestic });
    }
  }

  const cities = [...cityMap.values()]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.placeName.localeCompare(b.placeName, 'ko'));

  return {
    total: list.length,
    domesticCount,
    overseasCount,
    cities,
  };
}

export const LOGBOOK_REVIEW_FILTER_MAJOR = {
  ALL: 'all',
  DOMESTIC: 'domestic',
  OVERSEAS: 'overseas',
};

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {'all'|'domestic'|'overseas'} major
 * @param {string|null|undefined} citySlug
 */
export function filterLogbookOfficialReviewRows(rows, major, citySlug) {
  const list = Array.isArray(rows) ? rows : [];
  const slugFilter = String(citySlug || '').trim().toLowerCase();

  return list.filter((row) => {
    const slug = String(row?.place_slug || '').trim().toLowerCase();
    if (!slug) return false;
    const domestic = isLogbookReviewPlaceDomestic(slug);
    if (major === LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC && !domestic) return false;
    if (major === LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS && domestic) return false;
    if (slugFilter && slug !== slugFilter) return false;
    return true;
  });
}

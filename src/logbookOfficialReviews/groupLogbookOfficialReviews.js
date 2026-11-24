import travelSpotsList from '../pages/Home/data/travelSpots-list.json' with { type: 'json' };
import { shortenLogbookReviewPlaceName } from './logbookReviewPlaceLabel.js';

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
  'hwaseong-fortress',
  'donggureung-royal-tombs',
  'gochang-tidal-flat',
  'suncheon-bay-wetland',
]);

const spotBySlug = new Map(
  travelSpotsList.map((spot) => [String(spot.slug || '').trim().toLowerCase(), spot]),
);

const LOGBOOK_DOMESTIC_FESTIVAL_SLUG_RE = /^(?:festival-|korea-festival-)\d+$/i;

export function isLogbookReviewPlaceDomestic(placeSlug) {
  const slug = String(placeSlug || '').trim().toLowerCase();
  if (!slug) return false;
  if (/^tour-\d+$/.test(slug)) return true;
  if (LOGBOOK_DOMESTIC_FESTIVAL_SLUG_RE.test(slug)) return true;
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

const RECENT_REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_REVIEW_CHIP_MAX = 3;

function reviewRowTimestampMs(row) {
  const raw = row?.created_at || row?.published_at || row?.date || '';
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : null;
}

function compareCitiesByCount(a, b) {
  return (
    b.count - a.count ||
    (a.shortPlaceName || a.placeName).localeCompare(b.shortPlaceName || b.placeName, 'ko')
  );
}

/**
 * @param {Array<{ place_slug?: string, place_name?: string, created_at?: string }>} rows
 * @param {Date | string | number} [now]
 */
export function groupLogbookOfficialReviews(rows, now = new Date()) {
  const list = Array.isArray(rows) ? rows : [];
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const recentSince = (Number.isFinite(nowMs) ? nowMs : Date.now()) - RECENT_REVIEW_WINDOW_MS;
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
    const shortPlaceName = shortenLogbookReviewPlaceName(placeName) || placeName;
    const rowTime = reviewRowTimestampMs(row);
    const prev = cityMap.get(slug);
    if (prev) {
      prev.count += 1;
      if (!prev.placeName && placeName) prev.placeName = placeName;
      if (!prev.shortPlaceName && shortPlaceName) prev.shortPlaceName = shortPlaceName;
      if (rowTime != null && (prev.newestAt == null || rowTime > prev.newestAt)) {
        prev.newestAt = rowTime;
      }
    } else {
      cityMap.set(slug, {
        slug,
        placeName,
        shortPlaceName,
        count: 1,
        domestic,
        newestAt: rowTime,
      });
    }
  }

  const cities = [...cityMap.values()].filter((c) => c.count > 0);
  const recent = cities
    .filter((c) => c.newestAt != null && c.newestAt >= recentSince)
    .sort((a, b) => b.newestAt - a.newestAt || compareCitiesByCount(a, b))
    .slice(0, RECENT_REVIEW_CHIP_MAX);
  const recentSlugs = new Set(recent.map((c) => c.slug));
  const rest = cities.filter((c) => !recentSlugs.has(c.slug)).sort(compareCitiesByCount);
  const orderedCities = [...recent, ...rest];

  return {
    total: list.length,
    domesticCount,
    overseasCount,
    cities: orderedCities,
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

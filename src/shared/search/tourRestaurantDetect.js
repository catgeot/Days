import { RESTAURANT_CONTENT_TYPE_ID } from '../../utils/fetchTourApiAttractionDetail.js';
import {
  isDomesticKoreaLocation,
  isDomesticKoreaLocationForTourApi,
} from '../../utils/tourApiMatch.js';

export const EXPLORE_BADGE_RESTAURANT = '식당';
export const EXPLORE_KIND_RESTAURANT = 'restaurant';

const RESTAURANT_CAT1 = 'A05';

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * TourAPI · 검색 제안 · 장소 핀 — 음식점(39 / cat1 A05) 판별.
 * @param {object | null | undefined} item
 */
export function isExploreRestaurantItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.exploreRestaurant === true || item.kind === EXPLORE_KIND_RESTAURANT) return true;
  if (String(item.badge || '').trim() === EXPLORE_BADGE_RESTAURANT) return true;

  const type = String(
    item.contentTypeId ?? item.content_type_id ?? item.contenttypeid ?? '',
  ).trim();
  if (type === RESTAURANT_CONTENT_TYPE_ID) return true;

  const cat1 = String(item.cat1 ?? '').trim().toUpperCase();
  if (cat1 === RESTAURANT_CAT1 || cat1.startsWith(`${RESTAURANT_CAT1}`)) return true;

  const cat3 = String(item.cat3 ?? '').trim().toUpperCase();
  if (cat3.startsWith('A0502')) return true;

  return false;
}

/**
 * @param {object | null | undefined} item
 * @param {string} [locale]
 */
export function restaurantMapSearchRegionLabel(item, locale = 'ko') {
  if (!item) return '';
  const parent = String(item.parentCity || item.areaLabel || '').trim();
  if (parent) return parent;
  const locality = String(item.locality || '').trim();
  if (locality) {
    return locality.split(/\s+/)[0] || locality;
  }
  const addr = String(item.addr1 || '').trim();
  if (addr) {
    const tokens = addr.split(/\s+/).filter(Boolean);
    const sigungu = tokens.find((tok) => /(?:시|군|구)$/u.test(tok));
    if (sigungu) return sigungu.replace(/(특별자치시|광역시|특별시|자치시)$/u, '').trim() || sigungu;
    if (tokens.length >= 2) return tokens[1];
  }
  const city = String(item.city || '').trim();
  if (city) return city;
  if (String(locale || '').startsWith('en')) {
    return String(item.country_en || item.country || '').trim();
  }
  return String(item.country || '').trim();
}

/**
 * @param {object | null | undefined} item
 */
export function isDomesticRestaurantMapTarget(item) {
  if (!item) return true;
  if (item.domesticRestaurantMap === false) return false;
  if (item.domesticRestaurantMap === true) return true;
  if (isDomesticKoreaLocation(item) || isDomesticKoreaLocationForTourApi(item)) return true;
  const addr = String(item?.addr1 || '').trim();
  if (/대한민국|한국|특별시|광역시|특별자치/.test(addr)) return true;
  if (String(item?.source || '').toLowerCase() === 'tourapi') return true;
  const countryKey = compactKey(item?.country);
  if (countryKey === '대한민국' || countryKey === '한국' || countryKey === 'southkorea') return true;
  return false;
}

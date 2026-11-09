import {
  isDomesticRestaurantMapTarget,
  restaurantMapSearchRegionLabel,
} from './tourRestaurantDetect.js';

/**
 * 음식점 외부 지도 검색 URL (국내 네이버 · 해외 Google).
 * @param {{
 *   name?: string,
 *   region?: string,
 *   city?: string,
 *   country?: string,
 *   domestic?: boolean,
 *   item?: object | null,
 *   locale?: string,
 * }} opts
 * @returns {string}
 */
export function buildRestaurantMapSearchUrl(opts = {}) {
  const name = String(opts.name || opts.item?.name || '').trim();
  if (!name) return '';

  const locale = opts.locale || 'ko';
  const domestic =
    typeof opts.domestic === 'boolean'
      ? opts.domestic
      : isDomesticRestaurantMapTarget(opts.item || opts);

  const region =
    String(opts.region || opts.city || '').trim() ||
    restaurantMapSearchRegionLabel(opts.item, locale);

  const query = [name, region].filter(Boolean).join(' ').trim();
  if (!query) return '';

  if (domestic) {
    return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

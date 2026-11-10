import { isDomesticRestaurantMapTarget } from './tourRestaurantDetect.js';

/** @typedef {'naver' | 'google'} RestaurantMapProviderId */

/**
 * @param {string} href
 * @returns {RestaurantMapProviderId | null}
 */
export function detectRestaurantMapProviderFromHref(href) {
  const u = String(href || '').trim().toLowerCase();
  if (!u) return null;
  if (u.includes('map.naver.com')) return 'naver';
  if (u.includes('google.com/maps')) return 'google';
  return null;
}

/**
 * @param {object | null | undefined} item
 * @param {string} [href]
 * @returns {RestaurantMapProviderId}
 */
export function resolveRestaurantMapProvider(item, href = '') {
  const fromHref = detectRestaurantMapProviderFromHref(href);
  if (fromHref) return fromHref;
  return isDomesticRestaurantMapTarget(item) ? 'naver' : 'google';
}

/**
 * i18n provider display name (탐색 식당 카드 CTA·aria).
 * @param {(key: string, opts?: object) => string} t
 * @param {RestaurantMapProviderId} provider
 */
export function restaurantMapProviderLabel(t, provider) {
  return provider === 'naver'
    ? t('home.explore.restaurantMapProviderNaver', { defaultValue: '네이버 지도' })
    : t('home.explore.restaurantMapProviderGoogle', { defaultValue: 'Google 지도' });
}

/**
 * @param {(key: string, opts?: object) => string} t
 * @param {{ name?: string, href?: string, item?: object | null }} opts
 */
export function buildRestaurantMapOutboundCueCopy(t, opts = {}) {
  const href = String(opts.href || '').trim();
  const provider = resolveRestaurantMapProvider(opts.item, href);
  const providerLabel = restaurantMapProviderLabel(t, provider);
  const name = String(opts.name || opts.item?.name || '').trim();
  const cta = t('home.explore.restaurantMapReviewsCta', { defaultValue: '지도·리뷰 보기 ↗' });
  const aria = t('home.explore.restaurantMapReviewsAria', {
    name,
    provider: providerLabel,
    defaultValue: '{{name}} — 새 탭에서 {{provider}} 열기',
  });
  return { cta, aria, provider, providerLabel };
}

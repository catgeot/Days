import { resolveGygCurrency, resolveGygLocale } from './gygPartnerLocale.js';

export const GYG_PARTNER_ID = 'LRKVVU4';
export const GYG_DEFAULT_CMP = 'gateo_planer';

/** @deprecated ko default — use {@link resolveGygCurrency} */
export const GYG_CURRENCY = 'KRW';
/** Manual Activities — 스케치·홈 모달 등 넓은 표면 */
export const GYG_ACTIVITIES_ITEM_COUNT = 12;
/** 플래너 map_poi — 짧은 리스트 + 제휴 홈 링크로 이동 */
export const GYG_PLANNER_ACTIVITIES_ITEM_COUNT = 3;

function gygSiteOrigin(localeCode) {
  return localeCode === 'en-US'
    ? 'https://www.getyourguide.com/en-us/'
    : 'https://www.getyourguide.com/ko-kr/';
}

function buildGygAffiliateParams(options = {}) {
  const localeCode = resolveGygLocale(options.locale);
  const currency = options.currency ?? resolveGygCurrency(options.locale);
  const params = new URLSearchParams({
    partner_id: options.partnerId ?? GYG_PARTNER_ID,
    utm_medium: 'online_publisher',
    cmp: options.cmp || GYG_DEFAULT_CMP,
    currency,
    locale_code: localeCode,
  });
  return { localeCode, currency, params };
}

/**
 * GetYourGuide 제휴 홈 — locale path + locale_code·currency 동기.
 * @param {{ cmp?: string, currency?: string, locale?: string, partnerId?: string }} [options]
 */
export function getGygHomeUrl(options = {}) {
  const { localeCode, params } = buildGygAffiliateParams(options);
  return `${gygSiteOrigin(localeCode)}?${params.toString()}`;
}

/**
 * GetYourGuide 검색(`/s/`) — 위젯 카드·검색 딥링크용.
 * @param {string} query
 * @param {{ cmp?: string, currency?: string, locale?: string, partnerId?: string }} [options]
 */
export function buildGygSearchUrl(query, options = {}) {
  const q = String(query ?? '').trim();
  if (!q) return getGygHomeUrl(options);
  const { params } = buildGygAffiliateParams(options);
  params.set('q', q);
  return `https://www.getyourguide.com/s/?${params.toString()}`;
}

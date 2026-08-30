import { normalizeAppLocale } from '../i18n/constants.js';

/** Trip.com KR partners/ad · /flights/ query `locale` (위젯 UI — Trip ad 템플릿에 따름) */
export function resolveTripcomPartnerLocale(value) {
  const locale = normalizeAppLocale(
    typeof value === 'string' ? value.slice(0, 2) : value,
  );
  return locale === 'en' ? 'en-US' : 'ko-KR';
}

/** Trip.com `curr` — en-US+KRW면 packages 등 IBU 페이지가 한글로 뜨는 회귀 방지 (GYG en=USD와 동일) */
export function resolveTripcomCurrency(partnerLocale) {
  return partnerLocale === 'en-US' ? 'USD' : 'KRW';
}

/**
 * Trip.com 호스트 — KR 제휴(Alliance/SID)는 동일.
 * - flights/partners/ad: kr + locale=en-US (iframe QA)
 * - packages·hotels EN: www (kr 호스트·쿠키는 한국 IBU 고정)
 *
 * @param {'ko-KR' | 'en-US'} partnerLocale
 * @param {{ surface?: 'default' | 'packages' | 'hotels' }} [options]
 */
export function resolveTripcomSiteOrigin(partnerLocale, options = {}) {
  const { surface = 'default' } = options;
  if (partnerLocale === 'en-US' && (surface === 'packages' || surface === 'hotels')) {
    return 'https://www.trip.com';
  }
  return 'https://kr.trip.com';
}

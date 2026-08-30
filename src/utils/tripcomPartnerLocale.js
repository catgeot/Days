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

/** KR 제휴(Alliance/SID) — 호스트는 kr 고정. EN UI는 `locale=en-US`(partners/ad QA와 동일). www 전환 시 기존 kr 쿠키와 충돌해 홈 경유 지연이 날 수 있음 */
export function resolveTripcomSiteOrigin(_partnerLocale) {
  return 'https://kr.trip.com';
}

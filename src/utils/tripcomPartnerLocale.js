import { normalizeAppLocale } from '../i18n/constants.js';

/** Trip.com KR partners/ad · /flights/ query `locale` (위젯 UI — Trip ad 템플릿에 따름) */
export function resolveTripcomPartnerLocale(value) {
  const locale = normalizeAppLocale(
    typeof value === 'string' ? value.slice(0, 2) : value,
  );
  return locale === 'en' ? 'en-US' : 'ko-KR';
}

/** app locale en → 글로벌 호스트(영문 UI) · ko → kr 서브도메인 */
export function resolveTripcomSiteOrigin(partnerLocale) {
  return partnerLocale === 'en-US' ? 'https://www.trip.com' : 'https://kr.trip.com';
}

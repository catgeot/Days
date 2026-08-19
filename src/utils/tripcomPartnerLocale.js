import { normalizeAppLocale } from '../i18n/constants.js';

/** Trip.com KR partners/ad · /flights/ query `locale` (위젯 UI — Trip ad 템플릿에 따름) */
export function resolveTripcomPartnerLocale(value) {
  const locale = normalizeAppLocale(
    typeof value === 'string' ? value.slice(0, 2) : value,
  );
  return locale === 'en' ? 'en-US' : 'ko-KR';
}

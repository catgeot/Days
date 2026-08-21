import { normalizeAppLocale } from '../i18n/constants.js';

/** GYG widget `data-gyg-locale-code` — app locale ko/en → ko-KR / en-US */
export function resolveGygLocale(value) {
  const locale = normalizeAppLocale(
    typeof value === 'string' ? value.slice(0, 2) : value,
  );
  return locale === 'en' ? 'en-US' : 'ko-KR';
}

/** GYG widget·딥링크 통화 — en=USD · ko=KRW */
export function resolveGygCurrency(value) {
  const locale = normalizeAppLocale(
    typeof value === 'string' ? value.slice(0, 2) : value,
  );
  return locale === 'en' ? 'USD' : 'KRW';
}

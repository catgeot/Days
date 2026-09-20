import { DEFAULT_LOCALE, isAppLocale } from './constants.js';

/**
 * navigator.language(s) 기반 locale 추론 (#23).
 * - `ko*` 포함 → ko (재외 한국인·한국어 UI 우선)
 * - 그 외(en·ja·zh 등) → en
 *
 * @param {string[] | null | undefined} languages
 * @returns {import('./constants.js').AppLocale}
 */
export function inferLocaleFromBrowserLanguages(languages) {
  const list = Array.isArray(languages)
    ? languages
    : typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? [...navigator.languages]
        : [navigator.language]
      : [];

  const normalized = list.map((lang) => String(lang ?? '').toLowerCase());
  if (normalized.some((lang) => lang.startsWith('ko'))) return 'ko';
  if (normalized.length === 0) return DEFAULT_LOCALE;
  return 'en';
}

/**
 * 부팅 locale — URL → 저장값 → 브라우저 추론 → 기본 ko.
 * LocaleProvider / resolveBootLocale 연동용 (#23, 다음 세션).
 *
 * @param {{ urlLang?: string | null, storedLocale?: string | null, languages?: string[] }} [options]
 * @returns {import('./constants.js').AppLocale}
 */
export function resolveInitialLocale(options = {}) {
  const urlLang = options.urlLang ?? null;
  if (isAppLocale(urlLang)) return urlLang;

  const stored = options.storedLocale ?? null;
  if (isAppLocale(stored)) return stored;

  return inferLocaleFromBrowserLanguages(options.languages);
}

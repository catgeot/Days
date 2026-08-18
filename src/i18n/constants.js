export const LOCALE_STORAGE_KEY = 'gateo.locale';

/** @typedef {'ko' | 'en'} AppLocale */

/** @type {readonly AppLocale[]} */
export const SUPPORTED_LOCALES = ['ko', 'en'];

export const DEFAULT_LOCALE = 'ko';

/**
 * @param {string | null | undefined} value
 * @returns {value is AppLocale}
 */
export function isAppLocale(value) {
  return value === 'ko' || value === 'en';
}

/**
 * @param {string | null | undefined} value
 * @returns {AppLocale}
 */
export function normalizeAppLocale(value) {
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

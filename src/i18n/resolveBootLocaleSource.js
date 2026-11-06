import { isAppLocale } from './constants.js';

/**
 * @param {{ urlLang?: string | null, storedLocale?: string | null }} input
 * @returns {'url' | 'storage' | 'browser'}
 */
export function resolveBootLocaleSource({ urlLang = null, storedLocale = null } = {}) {
  if (isAppLocale(urlLang)) return 'url';
  if (isAppLocale(storedLocale)) return 'storage';
  return 'browser';
}

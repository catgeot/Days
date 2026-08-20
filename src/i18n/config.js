import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ko from './locales/ko.json' with { type: 'json' };
import en from './locales/en.json' with { type: 'json' };
import { resolveInitialLocale } from './browserLocaleHint.js';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeAppLocale,
} from './constants.js';

export const I18N_NS = 'common';

const resources = {
  ko: { [I18N_NS]: ko },
  en: { [I18N_NS]: en },
};

function resolveBootLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return resolveInitialLocale({ urlLang, storedLocale: stored });
  } catch {
    // private mode / blocked storage
  }
  return DEFAULT_LOCALE;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: resolveBootLocale(),
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: I18N_NS,
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    react: { useSuspense: false },
    initAsync: false,
  });
}

/**
 * @param {import('./constants').AppLocale} [locale]
 */
export function ensureI18n(locale = DEFAULT_LOCALE) {
  const lng = normalizeAppLocale(locale);
  if (i18n.language !== lng) {
    void i18n.changeLanguage(lng);
  }
  return i18n;
}

export { i18n };

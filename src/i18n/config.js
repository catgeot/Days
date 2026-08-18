import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ko from './locales/ko.json';
import en from './locales/en.json';
import { DEFAULT_LOCALE, normalizeAppLocale } from './constants';

export const I18N_NS = 'common';

const resources = {
  ko: { [I18N_NS]: ko },
  en: { [I18N_NS]: en },
};

let initPromise = null;

/**
 * @param {import('./constants').AppLocale} [locale]
 */
export function ensureI18n(locale = DEFAULT_LOCALE) {
  const lng = normalizeAppLocale(locale);

  if (i18n.isInitialized) {
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }
    return Promise.resolve(i18n);
  }

  if (!initPromise) {
    initPromise = i18n
      .use(initReactI18next)
      .init({
        resources,
        lng,
        fallbackLng: DEFAULT_LOCALE,
        defaultNS: I18N_NS,
        interpolation: { escapeValue: false },
        returnEmptyString: false,
      })
      .then(() => i18n);
  }

  return initPromise;
}

export { i18n };

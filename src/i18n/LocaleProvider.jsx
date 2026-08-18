import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isAppLocale,
  normalizeAppLocale,
} from './constants';
import { ensureI18n, i18n } from './config';

function readStoredLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function persistLocale(locale) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // quota / private mode
  }
}

function syncDocumentLang(locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

function resolveLocaleFromUrl(searchParams) {
  const urlLang = searchParams.get('lang');
  return isAppLocale(urlLang) ? urlLang : null;
}

export function LocaleProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locale, setLocaleState] = useState(() => {
    const initial = resolveLocaleFromUrl(searchParams) ?? readStoredLocale();
    ensureI18n(initial);
    syncDocumentLang(initial);
    return initial;
  });

  useEffect(() => {
    ensureI18n(locale);
    syncDocumentLang(locale);
  }, [locale]);

  useEffect(() => {
    const urlLocale = resolveLocaleFromUrl(searchParams);
    if (urlLocale && urlLocale !== locale) {
      setLocaleState(urlLocale);
      persistLocale(urlLocale);
      void i18n.changeLanguage(urlLocale);
      syncDocumentLang(urlLocale);
    }
  }, [searchParams, locale]);

  const setLocale = useCallback(
    (nextLocale) => {
      const normalized = normalizeAppLocale(nextLocale);
      setLocaleState(normalized);
      persistLocale(normalized);
      void i18n.changeLanguage(normalized);
      syncDocumentLang(normalized);

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (normalized === 'en') {
            next.set('lang', 'en');
          } else {
            next.delete('lang');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ko' : 'en');
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      isEnglish: locale === 'en',
    }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

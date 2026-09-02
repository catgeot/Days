import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { resolveInitialLocale } from './browserLocaleHint';
import {
  LOCALE_STORAGE_KEY,
  isAppLocale,
  normalizeAppLocale,
} from './constants';
import { ensureI18n, i18n } from './config';

const LocaleContext = createContext(null);

function readStoredLocaleOrNull() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(stored) ? stored : null;
  } catch {
    return null;
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

function applyLocaleSideEffects(locale) {
  persistLocale(locale);
  ensureI18n(locale);
  syncDocumentLang(locale);
}

function resolveLocaleFromUrl(searchParams) {
  const urlLang = searchParams.get('lang');
  return isAppLocale(urlLang) ? urlLang : null;
}

function resolveBootLocaleFromSearchParams(searchParams) {
  return resolveInitialLocale({
    urlLang: resolveLocaleFromUrl(searchParams),
    storedLocale: readStoredLocaleOrNull(),
  });
}

export function LocaleProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locale, setLocaleState] = useState(() => {
    const initial = resolveBootLocaleFromSearchParams(searchParams);
    ensureI18n(initial);
    syncDocumentLang(initial);
    return initial;
  });
  const bootSyncDone = useRef(false);
  const localeRef = useRef(locale);
  const userLocaleIntentRef = useRef(null);

  localeRef.current = locale;

  useEffect(() => {
    ensureI18n(locale);
    syncDocumentLang(locale);
  }, [locale]);

  useEffect(() => {
    if (bootSyncDone.current) return;
    bootSyncDone.current = true;

    const urlLang = resolveLocaleFromUrl(searchParams);
    const stored = readStoredLocaleOrNull();
    if (urlLang || stored) return;

    const inferred = resolveInitialLocale({ urlLang: null, storedLocale: null });
    if (inferred !== 'en') return;

    userLocaleIntentRef.current = 'en';
    applyLocaleSideEffects('en');
    setLocaleState('en');
    startTransition(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('lang', 'en');
          return next;
        },
        { replace: true },
      );
    });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const urlLocale = resolveLocaleFromUrl(searchParams);
    if (!urlLocale) return;

    if (userLocaleIntentRef.current === urlLocale) {
      userLocaleIntentRef.current = null;
      return;
    }

    setLocaleState((current) => {
      if (current === urlLocale) return current;
      applyLocaleSideEffects(urlLocale);
      return urlLocale;
    });
  }, [searchParams]);

  const setLocale = useCallback(
    (nextLocale) => {
      const normalized = normalizeAppLocale(nextLocale);
      if (normalized === localeRef.current) return;

      userLocaleIntentRef.current = normalized;
      applyLocaleSideEffects(normalized);
      setLocaleState(normalized);

      startTransition(() => {
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
      });
    },
    [setSearchParams],
  );

  const toggleLocale = useCallback(() => {
    const next = localeRef.current === 'en' ? 'ko' : 'en';
    setLocale(next);
  }, [setLocale]);

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

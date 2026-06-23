import {
  getFlightCinemaOriginOption,
  suggestFlightOriginFromBrowserTimezone,
} from './flightCinemaOriginOptions.js';

const STORAGE_KEY = 'gateo.flightOriginIata';

/**
 * @returns {string | null}
 */
export function getStoredFlightOriginIata() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const code = String(raw ?? '').trim().toUpperCase();
    return code.length === 3 ? code : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} iata
 */
export function persistFlightOriginIata(iata) {
  if (typeof window === 'undefined') return;
  const code = String(iata ?? '').trim().toUpperCase();
  if (code.length !== 3) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // quota / private mode
  }
}

function prefersKoreanLocale() {
  if (typeof navigator === 'undefined') return true;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((lang) => String(lang ?? '').toLowerCase().startsWith('ko'));
}

/**
 * last-used → browser timezone → ko locale ICN · 그 외 timezone 매칭 또는 ICN fallback.
 * @returns {string}
 */
export function resolveDefaultFlightOriginIata() {
  const stored = getStoredFlightOriginIata();
  if (stored && getFlightCinemaOriginOption(stored)) return stored;

  const tzSuggestion = suggestFlightOriginFromBrowserTimezone();
  if (tzSuggestion?.iata) return tzSuggestion.iata;

  if (prefersKoreanLocale()) return 'ICN';
  return 'ICN';
}

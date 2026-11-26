import {
  getFlightCinemaOriginOption,
  suggestFlightOriginFromBrowserTimezone,
} from './flightCinemaOriginOptions.js';
import { isKoreaDomesticDestIata, KOREA_AIRPORT_IATAS } from '../../../utils/koreaAirportIatas.js';
import { resolveCinemaDestIata } from '../../../utils/rentalAirportMatch.js';
import { isDomesticKoreaLocationForTourApi } from '../../../utils/tourApiMatch.js';
import { resolveFlightOriginIataFromCoords } from './flightOriginFromCoords.js';
import { resolveKnownUserOriginCoords } from './knownUserOriginCoords.js';

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
 * 국내 도착(제주·김해 등)인데 출발이 인천이면 국내선 공항 김포로 바꾼다.
 * `domesticPlace` — 서산·태안처럼 도착 공항이 인천으로 잡히는 국내 장소.
 * @param {string} originIata
 * @param {string | null | undefined} destIata
 * @param {{ domesticPlace?: boolean }} [opts]
 * @returns {string}
 */
export function preferDomesticFlightOriginIata(originIata, destIata, opts = {}) {
  const origin = String(originIata ?? '').trim().toUpperCase();
  if (origin !== 'ICN') return origin;
  if (isKoreaDomesticDestIata(destIata) || opts.domesticPlace === true) return 'GMP';
  return origin;
}

function resolveBaseDefaultFlightOriginIata() {
  const stored = getStoredFlightOriginIata();
  if (stored && getFlightCinemaOriginOption(stored)) return stored;

  const tzSuggestion = suggestFlightOriginFromBrowserTimezone();
  if (tzSuggestion?.iata) return tzSuggestion.iata;

  if (prefersKoreanLocale()) return 'ICN';
  return 'ICN';
}

/**
 * last-used → browser timezone → ko locale ICN · 그 외 timezone 매칭 또는 ICN fallback.
 * `destIata`가 국내 공항이면 ICN → GMP (국내선).
 * @param {{ destIata?: string | null, domesticPlace?: boolean }} [options]
 * @returns {string}
 */
export function resolveDefaultFlightOriginIata(options = {}) {
  return preferDomesticFlightOriginIata(resolveBaseDefaultFlightOriginIata(), options.destIata, {
    domesticPlace: options.domesticPlace,
  });
}

/**
 * 장소카드·MOONi 출발지 기본값 — 장소의 도착 공항으로 국내선 여부를 판단한다.
 * 알고 있는 사용자 좌표가 있고 저장된 출발이 없거나 인천(기본값)이면 그 좌표의 공항을 쓴다.
 * 인천이 아닌 저장값은 사용자가 고른 출발이라 유지한다.
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ userLat?: number, userLng?: number }} [options]
 * @returns {string}
 */
export function resolveDefaultFlightOriginIataForLocation(location, options = {}) {
  let destIata = null;
  if (location) {
    try {
      destIata = resolveCinemaDestIata(location);
    } catch {
      destIata = null;
    }
  }
  const domesticPlace =
    KOREA_AIRPORT_IATAS.has(String(destIata ?? '').trim().toUpperCase()) &&
    isDomesticKoreaLocationForTourApi(location);
  const coords = resolveKnownUserOriginCoords(options);
  const stored = getStoredFlightOriginIata();
  if (coords && (!stored || stored === 'ICN')) {
    const fromCoords = resolveFlightOriginIataFromCoords(coords.lat, coords.lng);
    if (fromCoords) {
      return preferDomesticFlightOriginIata(fromCoords, destIata, { domesticPlace });
    }
  }
  return resolveDefaultFlightOriginIata({ destIata, domesticPlace });
}

/**
 * Trip.com `dAirportCode` — 명시 override → last-used(localStorage) → browser tz → ICN.
 * @param {string | null | undefined} [override]
 * @returns {string}
 */
export function resolveFlightDepartureIataForTrip(override) {
  const explicit = String(override ?? '').trim().toUpperCase();
  if (explicit.length === 3) return explicit;
  return resolveDefaultFlightOriginIata();
}

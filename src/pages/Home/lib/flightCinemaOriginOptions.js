import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import { normalizeAppLocale } from '../../../i18n/constants';

function capitalizeLatinLabel(value) {
  const t = String(value ?? '').trim();
  if (!t) return t;
  if (t.length <= 3) return t.toUpperCase();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * 출발지 UI·MOONi 발화용 locale 표시명 — en은 라틴 alias 우선.
 * @param {string} iata
 * @param {string} [locale]
 */
export function getFlightOriginDisplayLabel(iata, locale = 'ko') {
  const code = String(iata ?? '').trim().toUpperCase();
  if (code.length !== 3) return code;
  const hub = hubByIata.get(code);
  if (!hub) return code;
  if (normalizeAppLocale(locale) === 'en') {
    const latin = (hub.aliases || []).find(
      (a) =>
        /^[a-zA-Z]/.test(a) &&
        a.length >= 3 &&
        a.toLowerCase() !== code.toLowerCase(),
    );
    if (latin) return capitalizeLatinLabel(latin);
    return code;
  }
  const ko = hub.aliases?.find((alias) => /[가-힣]/.test(alias));
  return ko || hub.officialKo || code;
}

/** 칩·히스토리에 저장된 한글 출발지 라벨 → locale 표시 */
export function localizeDepartureLabel(label, locale = 'ko') {
  const raw = String(label ?? '').trim();
  if (!raw || normalizeAppLocale(locale) !== 'en') return raw;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    if (
      hub.officialKo === raw ||
      (hub.aliases || []).some((a) => a === raw)
    ) {
      return getFlightOriginDisplayLabel(hub.iata, 'en');
    }
  }
  return raw;
}

/** 써머리·MOONi §2.12 정렬 — 한국·빈번 허브 (Bar 1행) */
export const FLIGHT_CINEMA_ORIGIN_PRIMARY_IATAS = ['ICN', 'GMP', 'PUS', 'CJU'];

/** Bar「더보기」— ICN 기본 + 해외 거주·출장 빈도 허브 */
export const FLIGHT_CINEMA_ORIGIN_PICKER_IATAS = [
  'ICN',
  'GMP',
  'PUS',
  'CJU',
  'NRT',
  'HND',
  'KIX',
  'TPE',
  'HKG',
  'BKK',
  'SIN',
  'KUL',
  'MNL',
  'DPS',
  'SYD',
  'AKL',
  'DXB',
  'LHR',
  'CDG',
  'FRA',
  'LAX',
  'JFK',
  'HNL',
];

/** 브라우저 IANA timezone → 출발 공항 제안 (Phase 4) */
const BROWSER_TZ_ORIGIN_IATA = {
  'Asia/Seoul': 'ICN',
  'Asia/Busan': 'PUS',
  'Asia/Jeju': 'CJU',
  'Asia/Tokyo': 'NRT',
  'Asia/Singapore': 'SIN',
  'Asia/Bangkok': 'BKK',
  'Asia/Manila': 'MNL',
  'Asia/Kuala_Lumpur': 'KUL',
  'Asia/Hong_Kong': 'HKG',
  'Asia/Taipei': 'TPE',
  'Asia/Jakarta': 'DPS',
  'Australia/Sydney': 'SYD',
  'Pacific/Auckland': 'AKL',
  'Europe/London': 'LHR',
  'Europe/Paris': 'CDG',
  'Europe/Berlin': 'FRA',
  'America/Los_Angeles': 'LAX',
  'America/New_York': 'JFK',
  'Pacific/Honolulu': 'HNL',
  'Asia/Dubai': 'DXB',
};

const hubByIata = new Map(RENTAL_AIRPORT_HUBS.map((hub) => [hub.iata, hub]));

/**
 * @param {string} iata
 * @returns {{ iata: string, label: string, officialKo?: string } | null}
 */
export function getFlightCinemaOriginOption(iata) {
  const code = String(iata ?? '').trim().toUpperCase();
  if (code.length !== 3) return null;
  const hub = hubByIata.get(code);
  if (!hub) return { iata: code, label: code };
  const ko = hub.aliases?.find((alias) => /[가-힣]/.test(alias));
  return {
    iata: code,
    label: ko || code,
    officialKo: hub.officialKo,
  };
}

/** @returns {{ iata: string, label: string, officialKo?: string }[]} */
export function listFlightCinemaOriginPrimaryOptions() {
  return FLIGHT_CINEMA_ORIGIN_PRIMARY_IATAS.map((iata) => getFlightCinemaOriginOption(iata)).filter(Boolean);
}

/** @returns {{ iata: string, label: string, officialKo?: string }[]} */
export function listFlightCinemaOriginPickerOptions() {
  return FLIGHT_CINEMA_ORIGIN_PICKER_IATAS.map((iata) => getFlightCinemaOriginOption(iata)).filter(Boolean);
}

/** Bar「더보기」— primary 제외 해외 허브 */
export function listFlightCinemaOriginExtendedOptions() {
  const primary = new Set(FLIGHT_CINEMA_ORIGIN_PRIMARY_IATAS);
  return FLIGHT_CINEMA_ORIGIN_PICKER_IATAS.filter((iata) => !primary.has(iata))
    .map((iata) => getFlightCinemaOriginOption(iata))
    .filter(Boolean);
}

/**
 * 브라우저 timezone → 출발 공항 IATA 제안 (미매칭·ICN이면 null).
 * @returns {{ iata: string, label: string, timeZone: string } | null}
 */
export function suggestFlightOriginFromBrowserTimezone() {
  if (typeof Intl === 'undefined') return null;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timeZone) return null;

  const iata = BROWSER_TZ_ORIGIN_IATA[timeZone];
  if (!iata || iata === 'ICN') return null;

  const option = getFlightCinemaOriginOption(iata);
  if (!option) return null;

  return { ...option, timeZone };
}

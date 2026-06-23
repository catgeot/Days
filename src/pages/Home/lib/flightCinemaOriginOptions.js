import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';

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

import { parseEventYmd } from '../shared/tripWindow.js';

/**
 * PlaceCard 기본 경로 — 라우트 SSOT (`/place/:slug`).
 * @param {string | null | undefined} slug
 */
export function buildPlacePath(slug) {
  if (!slug) return null;
  const key = String(slug).trim().toLowerCase();
  if (!key) return null;
  return `/place/${key}`;
}

/**
 * PlaceCard 플래너 탭 경로 — 라우트 SSOT (`/place/:slug/planner`, query `?tab=` 아님).
 * @param {string | null | undefined} slug
 */
export function buildPlacePlannerPath(slug) {
  const path = buildPlacePath(slug);
  if (!path) return null;
  return `${path}/planner`;
}

/** 항공 시네마 Bar 「여행 플랜」→ 플래너 진입 query */
export const FLIGHT_CINEMA_PLANNER_FROM = 'flight-cinema';

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {{ cinemaOriginIata: string | null } | null}
 */
export function parseFlightCinemaPlannerEntry(search) {
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(typeof search === 'string' ? search : '');
  if (params.get('from') !== FLIGHT_CINEMA_PLANNER_FROM) return null;
  const cinemaOrigin = String(params.get('cinemaOrigin') ?? '').trim().toUpperCase();
  return {
    cinemaOriginIata: cinemaOrigin.length === 3 ? cinemaOrigin : null,
  };
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {URLSearchParams}
 */
export function clearFlightCinemaPlannerEntryParams(searchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete('from');
  next.delete('cinemaOrigin');
  return next;
}

/**
 * 항공 시네마 Bar → 플래너 (출발지 안내 query 포함).
 * @param {string | null | undefined} slug
 * @param {{ originIata?: string | null }} [options]
 */
export function buildPlacePlannerPathFromFlightCinema(slug, options = {}) {
  const path = buildPlacePlannerPath(slug);
  if (!path) return null;
  const params = new URLSearchParams({ from: FLIGHT_CINEMA_PLANNER_FROM });
  const origin = String(options.originIata ?? '').trim().toUpperCase();
  if (origin.length === 3 && origin !== 'ICN') {
    params.set('cinemaOrigin', origin);
  }
  return `${path}?${params.toString()}`;
}

/** 축제·행사 → 플래너 TripWindow query 키 */
export const EVENT_PLANNER_QUERY_KEY = 'fromEvent';

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {{ eventId: string, checkIn: string, checkOut: string } | null}
 */
export function parseEventPlannerEntry(search) {
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(typeof search === 'string' ? search : '');
  const eventId = String(params.get(EVENT_PLANNER_QUERY_KEY) ?? '').trim();
  if (!eventId) return null;
  const checkIn = parseEventYmd(params.get('checkIn'));
  const checkOut = parseEventYmd(params.get('checkOut'));
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  return { eventId, checkIn, checkOut };
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {URLSearchParams}
 */
export function clearEventPlannerEntryParams(searchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(EVENT_PLANNER_QUERY_KEY);
  next.delete('checkIn');
  next.delete('checkOut');
  return next;
}

/**
 * 축제·행사 TripWindow → 플래너 딥링크.
 * @param {string | null | undefined} slug
 * @param {{ checkIn: string, checkOut: string, eventId: string }} options
 */
function buildEventTripWindowSearchParams(options = {}) {
  const checkIn = parseEventYmd(options.checkIn);
  const checkOut = parseEventYmd(options.checkOut);
  const eventId = String(options.eventId ?? '').trim();
  if (!checkIn || !checkOut || !eventId || checkOut <= checkIn) return null;
  return new URLSearchParams({
    checkIn,
    checkOut,
    [EVENT_PLANNER_QUERY_KEY]: eventId,
  });
}

/**
 * 축제·행사 TripWindow → PlaceCard 상세(기본 탭) 딥링크.
 * @param {string | null | undefined} slug
 * @param {{ checkIn: string, checkOut: string, eventId: string }} options
 */
export function buildPlaceDetailPathFromEvent(slug, options = {}) {
  const path = buildPlacePath(slug);
  const params = buildEventTripWindowSearchParams(options);
  if (!path || !params) return path;
  return `${path}?${params.toString()}`;
}

/**
 * 축제·행사 TripWindow → 플래너 딥링크.
 * @param {string | null | undefined} slug
 * @param {{ checkIn: string, checkOut: string, eventId: string }} options
 */
export function buildPlacePlannerPathFromEvent(slug, options = {}) {
  const path = buildPlacePlannerPath(slug);
  const params = buildEventTripWindowSearchParams(options);
  if (!path || !params) return null;
  return `${path}?${params.toString()}`;
}

/** 저장 메시지·레거시 resolver의 `?tab=planner` 정규화 (hash 유지) */
export function normalizePlacePlannerPath(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const hashIdx = trimmed.indexOf('#');
  const pathPart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
  const hashPart = hashIdx >= 0 ? trimmed.slice(hashIdx) : '';
  const legacy = pathPart.match(/^(\/place\/[^/?#]+)\?tab=planner\/?$/);
  const normalizedPath = legacy ? `${legacy[1]}/planner` : pathPart;
  return `${normalizedPath}${hashPart}`;
}

/**
 * 제휴 여행사 방문 기록 — 이 기기 localStorage.
 * 로그인 없이 재접속해도 「어디서 예약했는지」를 찾을 수 있게 한다.
 */

import { TRAVEL_AGENCIES, getTravelAgencyById } from '../data/travelAgencies.js';
import { buildGygSearchUrl, getGygHomeUrl } from './gygAffiliateLinks.js';

export const TRAVEL_AGENCY_VISITS_KEY = 'gateo:travel-agencies:v1:visits';
export const TRAVEL_AGENCY_VISITS_EVENT = 'gateo:travel-agency-visits';
export const MAX_TRAVEL_AGENCY_VISITS = 12;

const KIND_FROM_PATH = [
  [/accommodation|\/hotels?|\/hotel\b|숙소/, 'stay'],
  [/\/pkc\b|package/, 'package'],
  [/experiences|activit|\/tours?\b|\/tna\b|getyourguide/, 'tour'],
  [/\/flights?\b|\/flight\b/, 'flight'],
  [/car-rental|\/rental/, 'rental'],
  [/esim|airalo|holafly/, 'esim'],
  [/ferr(y|ies)/, 'ferry'],
  [/airport-transfer|pickup|픽업/, 'transfer'],
  [/tiqets|ticket/, 'tickets'],
  [/bounce|luggage|짐/, 'luggage'],
  [/bike|scooter|스쿠터/, 'scooter'],
];

/**
 * @param {string} rawHref
 * @returns {URL | null}
 */
export function parseHttpUrl(rawHref) {
  if (!rawHref || typeof rawHref !== 'string') return null;
  try {
    const url = new URL(rawHref, 'https://www.gateo.kr');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * @param {string} hostname
 * @returns {string}
 */
function normalizeHost(hostname) {
  return String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
}

/**
 * @param {string} rawHref
 * @returns {import('../data/travelAgencies.js').TravelAgency | null}
 */
export function matchTravelAgencyFromUrl(rawHref) {
  const url = parseHttpUrl(rawHref);
  if (!url) return null;
  const host = normalizeHost(url.hostname);
  const href = url.href.toLowerCase();
  for (const agency of TRAVEL_AGENCIES) {
    if (agency.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return agency;
    }
    if (agency.hrefIncludes?.some((s) => href.includes(String(s).toLowerCase()))) {
      return agency;
    }
  }
  return null;
}

/**
 * @param {string} rawHref
 * @returns {string}
 */
export function inferTravelAgencyKind(rawHref) {
  const url = parseHttpUrl(rawHref);
  if (!url) return 'browse';
  const hay = `${url.hostname} ${url.pathname} ${url.search}`.toLowerCase();
  for (const [re, kind] of KIND_FROM_PATH) {
    if (re.test(hay)) return kind;
  }
  return 'browse';
}

/**
 * 위젯 frame URL은 재방문에 부적합 (GYG activities.frame 등).
 * @param {string} rawHref
 * @returns {boolean}
 */
export function isTravelAgencyWidgetHref(rawHref) {
  const url = parseHttpUrl(rawHref);
  if (!url) return false;
  const host = normalizeHost(url.hostname);
  if (host.startsWith('widget.')) return true;
  if (/\.frame$/i.test(url.pathname)) return true;
  return false;
}

/**
 * iframe/data-gyg-* 임베드에서 여행사 식별.
 * @param {{ src?: string, embedHref?: string, query?: string }} [input]
 * @returns {{ agency: import('../data/travelAgencies.js').TravelAgency, rawHref: string, isWidget: boolean, query: string } | null}
 */
export function describeTravelAgencyEmbed(input = {}) {
  const src = String(input.src || '').trim();
  const embedHref = String(input.embedHref || '').trim();
  const fromSrc = matchTravelAgencyFromUrl(src);
  const agency = fromSrc || matchTravelAgencyFromUrl(embedHref);
  if (!agency) return null;
  const rawHref = fromSrc ? src : embedHref;
  const query = String(input.query || inferPlaceLabelFromHref(rawHref) || '').trim().slice(0, 80);
  return {
    agency,
    rawHref,
    isWidget: isTravelAgencyWidgetHref(src) || isTravelAgencyWidgetHref(embedHref),
    query,
  };
}

/**
 * GYG 위젯 등 iframe 클릭 — frame URL 대신 제휴 홈/검색을 저장.
 * @param {{ src?: string, embedHref?: string, query?: string }} input
 * @returns {object[]}
 */
export function recordTravelAgencyEmbedVisit(input) {
  const desc = describeTravelAgencyEmbed(input);
  if (!desc) return loadTravelAgencyVisits();
  let href = desc.rawHref;
  if (desc.isWidget && desc.agency.id === 'getyourguide') {
    href = desc.query ? buildGygSearchUrl(desc.query) : getGygHomeUrl();
  }
  return recordTravelAgencyVisit({
    href,
    placeLabel: desc.query,
    kind: desc.agency.kinds[0] || inferTravelAgencyKind(href),
  });
}

/**
 * @param {string} rawHref
 * @returns {string}
 */
export function inferPlaceLabelFromHref(rawHref) {
  const url = parseHttpUrl(rawHref);
  if (!url) return '';
  const q = url.searchParams.get('q') || url.searchParams.get('query');
  if (!q) return '';
  try {
    return decodeURIComponent(q).replace(/\s+/g, ' ').trim().slice(0, 80);
  } catch {
    return String(q).trim().slice(0, 80);
  }
}

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

/**
 * @returns {object[]}
 */
export function loadTravelAgencyVisits() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(TRAVEL_AGENCY_VISITS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeVisit)
      .filter(Boolean)
      .slice(0, MAX_TRAVEL_AGENCY_VISITS);
  } catch {
    return [];
  }
}

/**
 * @param {unknown} raw
 * @returns {object | null}
 */
function normalizeVisit(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const agencyId = String(raw.agencyId || '').trim();
  if (!getTravelAgencyById(agencyId)) return null;
  const href = String(raw.href || '').trim();
  if (!parseHttpUrl(href) || !matchTravelAgencyFromUrl(href)) return null;
  const visitedAt = Number(raw.visitedAt);
  return {
    agencyId,
    href,
    kind: String(raw.kind || inferTravelAgencyKind(href) || 'browse'),
    placeLabel: String(raw.placeLabel || '').trim().slice(0, 80),
    visitedAt: Number.isFinite(visitedAt) && visitedAt > 0 ? visitedAt : Date.now(),
  };
}

function persistVisits(list) {
  if (!canUseStorage()) return list;
  localStorage.setItem(TRAVEL_AGENCY_VISITS_KEY, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRAVEL_AGENCY_VISITS_EVENT));
  }
  return list;
}

/**
 * @param {{ href: string, placeLabel?: string, kind?: string }} input
 * @returns {object[]}
 */
export function recordTravelAgencyVisit(input) {
  const href = String(input?.href || '').trim();
  const agency = matchTravelAgencyFromUrl(href);
  if (!agency) return loadTravelAgencyVisits();

  const nextItem = {
    agencyId: agency.id,
    href,
    kind: String(input?.kind || inferTravelAgencyKind(href) || 'browse'),
    placeLabel: String(input?.placeLabel || inferPlaceLabelFromHref(href) || '').trim().slice(0, 80),
    visitedAt: Date.now(),
  };

  const prev = loadTravelAgencyVisits().filter((item) => item.agencyId !== agency.id);
  return persistVisits([nextItem, ...prev].slice(0, MAX_TRAVEL_AGENCY_VISITS));
}

/**
 * @param {string} agencyId
 * @returns {object[]}
 */
export function removeTravelAgencyVisit(agencyId) {
  const id = String(agencyId || '').trim();
  return persistVisits(loadTravelAgencyVisits().filter((item) => item.agencyId !== id));
}

/** @returns {object[]} */
export function clearTravelAgencyVisits() {
  return persistVisits([]);
}

/**
 * 열기 전 가드 — 저장된 href가 해당 여행사 http(s)인지.
 * @param {string} href
 * @param {string} [agencyId]
 * @returns {string}
 */
export function sanitizeTravelAgencyHref(href, agencyId) {
  const matched = matchTravelAgencyFromUrl(href);
  if (!matched) return '';
  if (agencyId && matched.id !== agencyId) return '';
  const url = parseHttpUrl(href);
  return url ? url.href : '';
}

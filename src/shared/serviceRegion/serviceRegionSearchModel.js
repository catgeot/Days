/**
 * Service-modal region catalog. Read-only recent keys.
 * Choseong comes from hangulSearch + explore matchers — not useSearchEngine.
 */
import { TRAVEL_SPOTS } from '../../pages/Home/data/travelSpots.js';
import {
  RECENT_SEARCH_KEY,
  safeLoadRecentList,
  safeLoadRecentVisited,
} from '../../pages/Home/lib/exploreRecentHistory.js';
import {
  exploreTextIncludes,
  matchChoseongCatalog,
} from '../../pages/Home/lib/exploreChoseongMatch.js';
import { exploreSuggestionNameMatchRank } from '../../pages/Home/lib/normalizeSearchSuggestions.js';
import {
  buildVisibleMonthlyPickCards,
  resolveExploreCurrentMonthPickKey,
} from '../../pages/Home/lib/exploreMonthlyPicks.js';
import { resolveTravelSpotFromSearchQuery } from '../../utils/travelSpotResolve.js';
import { buildGygActivitiesSearchQuery } from '../../components/PlaceCard/tabs/planner/locationRules.js';
import { canShowMrtTnaStrip, resolveMrtTnaQuery } from '../../utils/mrtTnaQuery.js';
import { buildGygPlannerCmp, getGygHomeUrl, getMrtSearchUrl } from '../../utils/affiliate.js';
import { GYG_PARTNER_ID } from '../../utils/gygAffiliateLinks.js';
import { loadTravelAgencyVisits, recordTravelAgencyVisit } from '../../utils/travelAgencyVisits.js';
import { isChoseongQuery } from '../../utils/hangulSearch.js';

export const RECENT_REGION_LIMIT = 3;
export const RECOMMENDED_REGION_LIMIT = 3;
export const SERVICE_REGION_RESULT_LIMIT = 8;

const SEARCH_METHODS = new Set(['typed', 'recent', 'recommended']);
const SEARCH_RESULTS = new Set(['ok', 'no_partner']);

let regionCatalog = null;
let regionBySlug = null;

function ensureCatalog() {
  if (regionCatalog && regionBySlug) return;
  const list = [];
  const bySlug = new Map();
  for (const spot of TRAVEL_SPOTS || []) {
    const region = spotToServiceRegion(spot);
    if (!region) continue;
    const key = region.slug.toLowerCase();
    if (bySlug.has(key)) continue;
    bySlug.set(key, region);
    list.push(region);
  }
  regionCatalog = list;
  regionBySlug = bySlug;
}

export function resetKnownServiceRegionCacheForTests() {
  regionCatalog = null;
  regionBySlug = null;
}

/**
 * @param {object | null | undefined} spot
 * @returns {object | null}
 */
export function spotToServiceRegion(spot) {
  if (!spot || typeof spot !== 'object') return null;
  const slug = String(spot.slug || '').trim();
  const name = String(spot.name || '').trim();
  if (!slug || !name) return null;
  return {
    slug,
    name,
    name_ko: name,
    name_en: typeof spot.name_en === 'string' ? spot.name_en : '',
    country: typeof spot.country === 'string' ? spot.country : '',
    country_en: typeof spot.country_en === 'string' ? spot.country_en : '',
    lat: spot.lat,
    lng: spot.lng,
  };
}

export function listKnownServiceRegions() {
  ensureCatalog();
  return regionCatalog;
}

export function regionIdentity(region) {
  const slug = String(region?.slug || '').trim().toLowerCase();
  if (slug) return `slug:${slug}`;
  const name = String(region?.name || region?.placeLabel || '').trim().toLowerCase();
  return name ? `name:${name}` : '';
}

/**
 * @param {unknown} input
 * @returns {object | null}
 */
export function resolveKnownServiceRegion(input) {
  ensureCatalog();
  if (input == null) return null;
  if (typeof input === 'object') {
    const slug = String(input.slug || '').trim().toLowerCase();
    if (slug && regionBySlug.has(slug)) return regionBySlug.get(slug);
    const label = input.name || input.placeLabel || input.name_en || '';
    if (!label) return null;
    return resolveKnownServiceRegion(label);
  }
  const text = String(input).trim();
  if (!text) return null;
  const direct = regionBySlug.get(text.toLowerCase());
  if (direct) return direct;
  const spot = resolveTravelSpotFromSearchQuery(text);
  if (!spot?.slug) return null;
  return regionBySlug.get(String(spot.slug).trim().toLowerCase()) || spotToServiceRegion(spot);
}

/**
 * @param {object | null | undefined} location
 */
export function isTourRegionSupported(location) {
  if (!location || typeof location !== 'object') return false;
  if (canShowMrtTnaStrip(location)) return true;
  return Boolean(buildGygActivitiesSearchQuery(location));
}

/**
 * Widget target for a confirmed location. Unsupported stays `none`.
 * @param {object | null | undefined} location
 */
export function resolveTourWidgetTarget(location) {
  if (canShowMrtTnaStrip(location)) {
    const query = resolveMrtTnaQuery(location);
    return {
      kind: 'mrt',
      query: String(query?.keyword || ''),
      cmp: null,
      partnerId: null,
    };
  }
  const query = buildGygActivitiesSearchQuery(location);
  if (!query) {
    return { kind: 'none', query: null, cmp: null, partnerId: null };
  }
  return {
    kind: 'gyg',
    query,
    cmp: buildGygPlannerCmp(location),
    partnerId: GYG_PARTNER_ID,
  };
}

export function createTourRegionState(originalLocation) {
  return {
    original: originalLocation || null,
    active: null,
    notice: null,
    activityKeyword: '',
  };
}

export function tourRegionLocation(state) {
  return state?.active || state?.original || null;
}

export function isTourRegionChanged(state) {
  if (!state?.active) return false;
  return regionIdentity(state.active) !== regionIdentity(state.original);
}

/**
 * 지원 지역을 확정하면 기존 여행사 방문 키에 placeLabel만 남겨요.
 * 위젯 클릭과 같은 제휴 URL을 쓰고, 새 저장 키는 만들지 않아요.
 * @param {object | null | undefined} region
 * @param {string} [locale]
 */
export function recordConfirmedTourRegionVisit(region, locale = 'ko') {
  const target = resolveTourWidgetTarget(region);
  const query = String(target?.query || '').trim();
  if (!query) return loadTravelAgencyVisits();
  if (target.kind === 'gyg') {
    return recordTravelAgencyVisit({
      href: getGygHomeUrl({
        cmp: target.cmp,
        partnerId: target.partnerId,
        locale,
      }),
      placeLabel: query,
      kind: 'tour',
    });
  }
  if (target.kind === 'mrt') {
    return recordTravelAgencyVisit({
      href: getMrtSearchUrl(query),
      placeLabel: query,
      kind: 'tour',
    });
  }
  return loadTravelAgencyVisits();
}

export function confirmTourRegion(state, region) {
  if (!state || !region) return state;
  if (!isTourRegionSupported(region)) {
    return { ...state, notice: region, activityKeyword: '' };
  }
  return { ...state, active: region, notice: null, activityKeyword: '' };
}

/**
 * @param {object | null | undefined} state
 * @param {{ region?: object | null, activityKeyword?: string }} payload
 */
export function confirmTourSearch(state, payload = {}) {
  if (!state) return state;
  const region = payload?.region || null;
  const keyword = String(payload?.activityKeyword || '').trim();
  if (region) {
    if (!isTourRegionSupported(region)) {
      return { ...state, notice: region, activityKeyword: '' };
    }
    return { ...state, active: region, notice: null, activityKeyword: keyword };
  }
  if (!keyword) {
    return { ...state, activityKeyword: '' };
  }
  const base = tourRegionLocation(state);
  if (!base || !isTourRegionSupported(base)) return state;
  return { ...state, notice: null, activityKeyword: keyword };
}

export function resetTourRegion(state) {
  if (!state) return state;
  return { ...state, active: null, notice: null, activityKeyword: '' };
}

/**
 * @param {{ visited?: unknown[], agencyVisits?: unknown[], searches?: unknown[] }} sources
 * @param {number} [limit]
 */
export function collectRecentServiceRegions(sources = {}, limit = RECENT_REGION_LIMIT) {
  const cap = Number.isFinite(limit) ? limit : RECENT_REGION_LIMIT;
  const out = [];
  const seen = new Set();
  const push = (raw) => {
    if (out.length >= cap) return;
    const region = resolveKnownServiceRegion(raw);
    if (!region) return;
    const key = regionIdentity(region);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(region);
  };
  for (const item of sources.visited || []) push(item);
  for (const item of sources.agencyVisits || []) {
    if (item && typeof item === 'object') push(item.placeLabel || item);
    else push(item);
  }
  for (const item of sources.searches || []) push(item);
  return out;
}

/** Read-only. Does not write the three existing keys. */
export function loadRecentServiceRegions(limit = RECENT_REGION_LIMIT) {
  let visited = [];
  let searches = [];
  let agencyVisits = [];
  try {
    visited = safeLoadRecentVisited();
  } catch {
    visited = [];
  }
  try {
    searches = safeLoadRecentList(RECENT_SEARCH_KEY);
  } catch {
    searches = [];
  }
  try {
    agencyVisits = loadTravelAgencyVisits();
  } catch {
    agencyVisits = [];
  }
  return collectRecentServiceRegions({ visited, agencyVisits, searches }, limit);
}

/**
 * This month's destinations, up to 3, skipping recent duplicates.
 * @param {{ now?: Date, limit?: number, exclude?: object[] }} [opts]
 */
export function listRecommendedServiceRegions(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const limit = Number.isFinite(opts.limit) ? opts.limit : RECOMMENDED_REGION_LIMIT;
  const monthKey = resolveExploreCurrentMonthPickKey(now);
  const cards = buildVisibleMonthlyPickCards(monthKey);
  const skip = new Set((opts.exclude || []).map(regionIdentity).filter(Boolean));
  const out = [];
  for (const card of cards) {
    const region = resolveKnownServiceRegion(card?.spot) || spotToServiceRegion(card?.spot);
    if (!region) continue;
    const key = regionIdentity(region);
    if (skip.has(key)) continue;
    out.push(region);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * @param {unknown} query
 * @param {object[]} [regions]
 */
export function filterServiceRegions(query, regions = listKnownServiceRegions()) {
  const raw = typeof query === 'string' ? query.trim() : '';
  if (!raw) return [];
  if (isChoseongQuery(raw)) {
    const records = (regions || []).map((region) => ({
      ...region,
      id: region.slug || region.name,
    }));
    return matchChoseongCatalog(records, raw).slice(0, SERVICE_REGION_RESULT_LIMIT);
  }
  const ranked = [];
  for (const region of regions || []) {
    if (!region) continue;
    const rank = exploreSuggestionNameMatchRank(raw, region);
    const textHit =
      exploreTextIncludes(region.name, raw) ||
      exploreTextIncludes(region.name_en, raw) ||
      exploreTextIncludes(region.country, raw) ||
      exploreTextIncludes(region.country_en, raw) ||
      exploreTextIncludes(region.slug, raw);
    if (rank >= 9 && !textHit) continue;
    ranked.push({ region, rank: rank < 9 ? rank : 4 });
  }
  ranked.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return String(a.region.name || '').localeCompare(String(b.region.name || ''), 'ko');
  });
  return ranked.slice(0, SERVICE_REGION_RESULT_LIMIT).map((row) => row.region);
}

/**
 * Enter confirms one known region. Free text and ambiguous hits return null.
 * @param {unknown} query
 * @param {object[]} hits
 */
export function pickTypedServiceRegion(query, hits) {
  const raw = typeof query === 'string' ? query.trim() : '';
  if (!raw || !Array.isArray(hits) || hits.length === 0) return null;
  const exact = hits.filter((region) => exploreSuggestionNameMatchRank(raw, region) === 0);
  if (exact.length === 1) return exact[0];
  if (hits.length === 1) return hits[0];
  return null;
}

function resolveServiceRegionFromPhrase(phrase) {
  const raw = String(phrase || '').trim();
  if (!raw) return null;
  if (isChoseongQuery(raw)) {
    const hits = filterServiceRegions(raw);
    return hits.length === 1 ? hits[0] : hits[0] || null;
  }
  const direct = resolveKnownServiceRegion(raw);
  if (direct) {
    const rank = exploreSuggestionNameMatchRank(raw, direct);
    if (rank <= 1) return direct;
  }
  const hits = filterServiceRegions(raw);
  const picked = pickTypedServiceRegion(raw, hits);
  if (picked) return picked;
  if (hits.length === 1 && exploreSuggestionNameMatchRank(raw, hits[0]) <= 3) {
    return hits[0];
  }
  return null;
}

/**
 * @param {unknown} raw
 * @param {object | null | undefined} [activeLocation]
 * @returns {{ kind: 'empty'|'region_only'|'region_activity'|'activity_only'|'no_match', region?: object, activityKeyword?: string }}
 */
export function parseTourServiceSearchInput(raw, activeLocation = null) {
  const text = String(raw || '').trim();
  if (!text) return { kind: 'empty' };
  if (isChoseongQuery(text)) {
    return { kind: 'region_only', activityKeyword: '' };
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) {
    const region = resolveServiceRegionFromPhrase(text);
    if (region) return { kind: 'region_only', region, activityKeyword: '' };
    if (isActivityOnlyQuery(text, activeLocation)) {
      return { kind: 'activity_only', activityKeyword: text };
    }
    return { kind: 'no_match' };
  }

  let best = null;
  for (let start = 0; start < tokens.length; start += 1) {
    for (let end = tokens.length - 1; end >= start; end -= 1) {
      const phrase = tokens.slice(start, end + 1).join(' ');
      const region = resolveServiceRegionFromPhrase(phrase);
      if (!region) continue;
      const before = tokens.slice(0, start).join(' ').trim();
      const after = tokens.slice(end + 1).join(' ').trim();
      const activityKeyword = [before, after].filter(Boolean).join(' ').trim();
      const spanLen = end - start + 1;
      const score = spanLen * 100 - start;
      if (!best || score > best.score) {
        best = { region, activityKeyword, score };
      }
    }
  }

  if (best) {
    if (!best.activityKeyword) {
      return { kind: 'region_only', region: best.region, activityKeyword: '' };
    }
    return {
      kind: 'region_activity',
      region: best.region,
      activityKeyword: best.activityKeyword,
    };
  }

  if (isActivityOnlyQuery(text, activeLocation)) {
    return { kind: 'activity_only', activityKeyword: text };
  }
  return { kind: 'no_match' };
}

/**
 * @param {unknown} draft
 * @param {object[]} [regions]
 */
export function listTourSearchRegionHits(draft, regions = listKnownServiceRegions()) {
  const raw = String(draft || '').trim();
  if (!raw) return [];
  const direct = filterServiceRegions(raw, regions);
  if (direct.length) return direct;
  const parsed = parseTourServiceSearchInput(raw);
  const out = [];
  const seen = new Set();
  const push = (region) => {
    if (!region) return;
    const key = regionIdentity(region);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(region);
  };
  if (parsed.region) push(parsed.region);
  const head = tokensFirst(raw);
  if (head) {
    for (const row of filterServiceRegions(head, regions)) push(row);
  }
  return out.slice(0, SERVICE_REGION_RESULT_LIMIT);
}

function tokensFirst(raw) {
  return String(raw || '').trim().split(/\s+/).filter(Boolean)[0] || '';
}

const TOUR_KEYWORD_HINT_RE =
  /(스노클|다이빙|호핑|투어|티켓|패키지|market|tour|hop|diving|snorkel|cruise|ticket|island|kayak|rafting)/i;

function queryContainsResolvableRegion(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  if (resolveServiceRegionFromPhrase(raw)) return true;
  const tokens = raw.split(/\s+/).filter(Boolean);
  for (let start = 0; start < tokens.length; start += 1) {
    for (let end = tokens.length - 1; end >= start; end -= 1) {
      const phrase = tokens.slice(start, end + 1).join(' ');
      if (resolveServiceRegionFromPhrase(phrase)) return true;
    }
  }
  return false;
}

function isActivityOnlyQuery(text, activeLocation) {
  if (!activeLocation || !isTourRegionSupported(activeLocation)) return false;
  const raw = String(text || '').trim();
  if (!raw || isChoseongQuery(raw)) return false;
  if (queryContainsResolvableRegion(raw)) return false;
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) return true;
  const one = tokens[0] || '';
  if (/^[a-zA-Z][a-zA-Z\s-]{0,}$/.test(one) && one.length >= 4) return true;
  return TOUR_KEYWORD_HINT_RE.test(one);
}

/**
 * @param {unknown} draft
 * @param {object[]} hits
 * @param {object | null | undefined} activeLocation
 */
export function resolveTourSearchCommit(draft, hits, activeLocation = null) {
  const raw = String(draft || '').trim();
  if (!raw) return null;

  const parsed = parseTourServiceSearchInput(raw, activeLocation);
  const picked = pickTypedServiceRegion(raw, hits);
  if (picked) {
    let activityKeyword = '';
    if (
      parsed.kind === 'region_activity' &&
      regionIdentity(parsed.region) === regionIdentity(picked)
    ) {
      activityKeyword = parsed.activityKeyword || '';
    } else if (parsed.kind === 'activity_only') {
      activityKeyword = parsed.activityKeyword || '';
    }
    return { region: picked, activityKeyword, method: 'typed' };
  }

  if (parsed.kind === 'region_only' && parsed.region) {
    return { region: parsed.region, activityKeyword: '', method: 'typed' };
  }
  if (parsed.kind === 'region_activity' && parsed.region) {
    return {
      region: parsed.region,
      activityKeyword: parsed.activityKeyword || '',
      method: 'typed',
    };
  }
  if (parsed.kind === 'activity_only') {
    if (!activeLocation || !isTourRegionSupported(activeLocation)) {
      return { noMatch: true };
    }
    return {
      region: activeLocation,
      activityKeyword: parsed.activityKeyword || '',
      method: 'typed',
    };
  }
  return { noMatch: true };
}

/**
 * GYG Manual Activities q — 기본 지역 쿼리에 투어 키워드를 붙인다.
 * @param {object | null | undefined} location
 * @param {unknown} [activityKeyword]
 */
export function buildTourActivitiesWidgetQuery(location, activityKeyword = '') {
  const target = resolveTourWidgetTarget(location);
  const kw = String(activityKeyword || '').trim();
  if (!kw) return target;
  if (target.kind === 'gyg' && target.query) {
    return { ...target, query: `${target.query} ${kw}`.trim() };
  }
  if (target.kind === 'mrt' && target.query) {
    return { ...target, query: kw, activityKeyword: kw };
  }
  return target;
}

export function buildServiceModalSearchEvent({
  service = 'tour',
  from = '',
  to = '',
  method = 'typed',
  result = 'ok',
  chars = 0,
} = {}) {
  const count = Number(chars);
  return {
    name: 'service_modal_search',
    params: {
      service: String(service || 'tour'),
      from: String(from || ''),
      to: String(to || ''),
      method: SEARCH_METHODS.has(method) ? method : 'typed',
      result: SEARCH_RESULTS.has(result) ? result : 'ok',
      chars: Number.isFinite(count) && count > 0 ? Math.round(count) : 0,
    },
  };
}

export function buildServiceModalSearchOpenEvent({ service = 'tour', hasRecent = false } = {}) {
  return {
    name: 'service_modal_search_open',
    params: {
      service: String(service || 'tour'),
      has_recent: hasRecent ? 1 : 0,
    },
  };
}

export function buildServiceModalRegionResetEvent({ service = 'tour', to = '' } = {}) {
  return {
    name: 'service_modal_region_reset',
    params: {
      service: String(service || 'tour'),
      to: String(to || ''),
    },
  };
}

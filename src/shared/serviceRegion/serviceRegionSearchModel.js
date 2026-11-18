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
import { buildGygPlannerCmp } from '../../utils/affiliate.js';
import { GYG_PARTNER_ID } from '../../utils/gygAffiliateLinks.js';
import { loadTravelAgencyVisits } from '../../utils/travelAgencyVisits.js';
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
  };
}

export function tourRegionLocation(state) {
  return state?.active || state?.original || null;
}

export function isTourRegionChanged(state) {
  if (!state?.active) return false;
  return regionIdentity(state.active) !== regionIdentity(state.original);
}

export function confirmTourRegion(state, region) {
  if (!state || !region) return state;
  if (!isTourRegionSupported(region)) {
    return { ...state, notice: region };
  }
  return { ...state, active: region, notice: null };
}

export function resetTourRegion(state) {
  if (!state) return state;
  return { ...state, active: null, notice: null };
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

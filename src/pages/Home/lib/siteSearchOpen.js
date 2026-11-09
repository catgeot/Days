import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';
import { getPlaceUrlParam } from './formatUrlName.js';
import { resolveSearchResultSelect } from './exploreRecentHistory.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';
import { shouldOfferKoreaHomonymDisambiguation } from './detectHomonymLocation.js';
import {
  normalizeSearchName,
  pickEnterSuggestionMatches,
  placeNameMatchesSearchQuery,
  resolveEnterSearchCanonical,
} from './searchEnterMatch.js';
import { buildHybridSearchSuggestions, buildLocalSearchSuggestions } from './searchSuggestions.js';
import { resolveLegacyMishealPlace } from './legacyMishealPlaceSlugs.js';
import {
  resolveExploreAliasTourPlaceParam,
  resolveKoExploreSearchAlias,
} from './koreaPlaceMatchDictionary.js';
import {
  firstPassHitToUiPlace,
  resolveKoreaDestinationFirstPassSync,
} from './resolveKoreaDestinationFirstPass.js';
import { normalizeExploreSelectionPin } from './explorePlaceNav.js';

const SITE_SEARCH_HOMONYM_QUERY_RANK = [
  {
    query: '개심사',
    slug: 'gaesimsa',
    hubId: 'seosan',
    contentId: '125908',
  },
];

function compactSiteSearchQueryKey(query) {
  return String(query ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function siteSearchHomonymRankRule(query) {
  const key = compactSiteSearchQueryKey(query);
  return SITE_SEARCH_HOMONYM_QUERY_RANK.find(
    (row) => compactSiteSearchQueryKey(row.query) === key,
  );
}

function scoreSiteSearchHomonymCandidate(item, rule) {
  if (!rule || !item) return 0;
  let score = 0;
  const slug = String(item.slug || item.canonical_slug || '')
    .trim()
    .toLowerCase();
  if (slug === rule.slug) score += 24;
  if (String(item.hubId || '').trim() === rule.hubId) score += 16;
  if (String(item.contentId || '').trim() === rule.contentId) score += 12;
  if (String(item.placeSlug || '').trim().toLowerCase() === rule.slug) score += 20;
  return score;
}

/** 탐색 제안·Enter 동명 순위 (홍보 장소 SSOT) */
export function rankSiteSearchExploreCandidates(query, suggestions) {
  if (!isSiteSearchOpenEnabled() || !suggestions?.length) return suggestions;
  const rule = siteSearchHomonymRankRule(query);
  if (!rule) return suggestions;
  return [...suggestions].sort(
    (a, b) => scoreSiteSearchHomonymCandidate(b, rule) - scoreSiteSearchHomonymCandidate(a, rule),
  );
}

/**
 * Plan-2 sitewide search step 2 — county-safe open when flag ON.
 * Step 1 (POI vs 시군 slug, #466) stays on main unconditionally via resolveSearchResultSelect.
 */

export function isSiteSearchOpenEnabled() {
  return isGateoSiteSearchEnabled();
}

function visitedPlaceIdFromSpot(item) {
  const id = String(item?.id ?? '').trim();
  if (id.startsWith('visited-')) return id.slice('visited-'.length);
  return id;
}

/** 동일 한글명(흥정계곡) 중복 행 — county 허브·캠핑장보다 명소(uiPlace) 우선 */
function rankEnterExactPoiCandidate(item, query = '') {
  let score = 0;
  if (item?.poiAttraction) score += 12;
  if (item?.parentCity) score += 8;
  if (item?.uiPlace) score += 6;
  const decision = resolveSearchResultSelect(item);
  if (decision?.type === 'home') score += 4;
  const placeId = visitedPlaceIdFromSpot(item);
  if (placeId && resolveLegacyMishealPlace(placeId)) score += 16;
  if (item?.source === 'legacy-misheal') score += 16;
  const aliasCid = String(resolveKoExploreSearchAlias(query)?.contentId || '').trim();
  if (
    aliasCid &&
    item?.source === 'tourapi' &&
    String(item.contentId || '').trim() === aliasCid
  ) {
    score += 48;
  }
  score += scoreSiteSearchHomonymCandidate(item, siteSearchHomonymRankRule(query));
  return score;
}

function pickSingleEnterExactPoi(exactMatches, query = '') {
  if (!exactMatches?.length) return null;
  if (exactMatches.length === 1) return exactMatches[0];
  const ranked = [...exactMatches].sort(
    (a, b) => rankEnterExactPoiCandidate(b, query) - rankEnterExactPoiCandidate(a, query),
  );
  const topScore = rankEnterExactPoiCandidate(ranked[0], query);
  const tied = ranked.filter((item) => rankEnterExactPoiCandidate(item, query) === topScore);
  return tied[0] || ranked[0];
}

/**
 * @param {object | null | undefined} spot
 * @returns {object | null | undefined}
 */
export function applySiteSearchOpenPin(spot) {
  if (!isSiteSearchOpenEnabled() || !spot || typeof spot !== 'object') return spot;
  const decision = resolveSearchResultSelect(spot);
  return decision?.spot ?? spot;
}

/**
 * @param {object | null | undefined} spot
 * @returns {{ type: 'place', spot: object, param: string } | { type: 'home', spot: object } | null}
 */
export function resolveSiteSearchOpen(spot) {
  if (!isSiteSearchOpenEnabled()) return null;
  return resolveSearchResultSelect(spot);
}

/**
 * `/place/:param` or null when sitewide open says home/uiPlace only.
 * @param {object | null | undefined} spot
 */
export function siteSearchCatalogPlaceParam(spot) {
  if (!spot || typeof spot !== 'object') return '';
  if (!isSiteSearchOpenEnabled()) return getPlaceUrlParam(spot);
  const decision = resolveSearchResultSelect(spot);
  if (!decision) return '';
  if (decision.type === 'place') return decision.param;
  return '';
}

/**
 * Explore Enter (flag ON) — exact single POI like suggestion tap; skip multi-candidate lists.
 * @param {string} query
 * @param {object[]} suggestions
 * @returns {object | null}
 */
export function resolveSiteSearchEnterSinglePoi(query, suggestions) {
  if (!isSiteSearchOpenEnabled()) return null;
  const q = String(query || '').trim();
  if (!q) return null;
  if (resolveExploreCityHubExact(q) || shouldOfferKoreaHomonymDisambiguation(q)) return null;

  if (resolveExploreAliasTourPlaceParam(q)) {
    const sync = resolveKoreaDestinationFirstPassSync(q);
    if (sync?.contentId) {
      return normalizeExploreSelectionPin(firstPassHitToUiPlace(sync, q));
    }
  }

  const matches = pickEnterSuggestionMatches(q, suggestions);
  if (!matches.length) return null;

  const canonical = normalizeSearchName(resolveEnterSearchCanonical(q));
  const exactNameMatches = matches.filter((item) => normalizeSearchName(item.name) === canonical);
  if (exactNameMatches.length >= 1) {
    const picked = pickSingleEnterExactPoi(exactNameMatches, q);
    if (picked) return picked;
  }
  if (matches.length === 1 && placeNameMatchesSearchQuery(q, matches[0])) return matches[0];
  return null;
}

function mergeSuggestionsByName(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list || []) {
      const name = String(item?.name || '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push(item);
    }
  }
  return out;
}

/**
 * Explore Enter — 제안 로딩 race 시 hybrid를 기다린 뒤 exact single POI.
 * @param {string} query
 * @param {{ timeoutMs?: number, cachedSuggestions?: object[] }} [opts]
 * @returns {Promise<object | null>}
 */
export async function awaitSiteSearchEnterSinglePoi(query, opts = {}) {
  if (!isSiteSearchOpenEnabled()) return null;
  const timeoutMs = opts.timeoutMs ?? 1400;
  const pollMs = opts.pollMs ?? 45;
  const q = String(query || '').trim();
  if (!q) return null;

  const tryResolve = (suggestions) => resolveSiteSearchEnterSinglePoi(q, suggestions);

  let merged = mergeSuggestionsByName(
    opts.cachedSuggestions || [],
    buildLocalSearchSuggestions(q),
  );
  let hit = tryResolve(merged);
  if (hit) return hit;

  const hybridPromise = buildHybridSearchSuggestions(q).catch(() => []);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, pollMs);
    });
    merged = mergeSuggestionsByName(merged, buildLocalSearchSuggestions(q));
    hit = tryResolve(merged);
    if (hit) return hit;
  }

  merged = mergeSuggestionsByName(merged, await hybridPromise);
  return tryResolve(merged);
}

/**
 * AI-limit · catalog fallback href (flag ON uses county-safe open, still deep-links POI slugs).
 * @param {object | null | undefined} item
 * @param {string} [query]
 */
export function siteSearchFallbackLinkHref(item, query = '') {
  const q = String(query || item?.name || '').trim();
  if (!item || typeof item !== 'object') {
    return q ? `/explore?q=${encodeURIComponent(q)}` : '/explore';
  }
  if (!isSiteSearchOpenEnabled()) {
    const param = siteSearchCatalogPlaceParam(item) || getPlaceUrlParam(item);
    return param ? `/place/${param}` : `/explore?q=${encodeURIComponent(q)}`;
  }
  const decision = resolveSearchResultSelect(item);
  if (!decision) return `/explore?q=${encodeURIComponent(q)}`;
  if (decision.type === 'place') return `/place/${decision.param}`;
  const slug = getPlaceUrlParam(decision.spot);
  if (slug) return `/place/${slug}`;
  return `/explore?q=${encodeURIComponent(decision.spot?.name || q)}`;
}

/**
 * Explore Enter 검색 — 탭 선택(onSelect)과 동일한 county-safe open (flag ON만).
 * @param {object | null | undefined} spot
 * @returns {{ mode: 'legacy' | 'skip' | 'place' | 'home', pin: object, param?: string }}
 */
export function siteSearchExploreEnterCommit(spot) {
  if (!spot || typeof spot !== 'object') return { mode: 'skip', pin: spot };
  const decision = resolveSearchResultSelect(spot);
  if (decision?.type === 'place') {
    return { mode: 'place', pin: decision.spot, param: decision.param };
  }
  if (!isSiteSearchOpenEnabled()) return { mode: 'legacy', pin: spot };
  if (!decision) return { mode: 'skip', pin: spot };
  return { mode: 'home', pin: decision.spot };
}

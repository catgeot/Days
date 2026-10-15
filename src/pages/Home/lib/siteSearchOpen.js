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
import { resolveLegacyMishealPlace } from './legacyMishealPlaceSlugs.js';

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
function rankEnterExactPoiCandidate(item) {
  let score = 0;
  if (item?.poiAttraction) score += 12;
  if (item?.parentCity) score += 8;
  if (item?.uiPlace) score += 6;
  const decision = resolveSearchResultSelect(item);
  if (decision?.type === 'home') score += 4;
  const placeId = visitedPlaceIdFromSpot(item);
  if (placeId && resolveLegacyMishealPlace(placeId)) score += 16;
  if (item?.source === 'legacy-misheal') score += 16;
  return score;
}

function pickSingleEnterExactPoi(exactMatches) {
  if (!exactMatches?.length) return null;
  if (exactMatches.length === 1) return exactMatches[0];
  const ranked = [...exactMatches].sort(
    (a, b) => rankEnterExactPoiCandidate(b) - rankEnterExactPoiCandidate(a),
  );
  const topScore = rankEnterExactPoiCandidate(ranked[0]);
  const tied = ranked.filter((item) => rankEnterExactPoiCandidate(item) === topScore);
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

  const matches = pickEnterSuggestionMatches(q, suggestions);
  if (!matches.length) return null;

  const canonical = normalizeSearchName(resolveEnterSearchCanonical(q));
  const exactNameMatches = matches.filter((item) => normalizeSearchName(item.name) === canonical);
  if (exactNameMatches.length >= 1) {
    const picked = pickSingleEnterExactPoi(exactNameMatches);
    if (picked) return picked;
  }
  if (matches.length === 1 && placeNameMatchesSearchQuery(q, matches[0])) return matches[0];
  return null;
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
  if (!isSiteSearchOpenEnabled()) return { mode: 'legacy', pin: spot };
  const decision = resolveSearchResultSelect(spot);
  if (!decision) return { mode: 'skip', pin: spot };
  if (decision.type === 'place') {
    return { mode: 'place', pin: decision.spot, param: decision.param };
  }
  return { mode: 'home', pin: decision.spot };
}

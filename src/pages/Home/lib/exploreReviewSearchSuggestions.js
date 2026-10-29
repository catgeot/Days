import { normalizeFestivalQuery } from '../../Korea/festivalSearch.js';
import { fetchEditorialReviewIndex } from '../../../logbookOfficialReviews/editorialReviewIndex.js';
import {
  formatGateoReviewerBadge,
  placeReviewVisitStoryDisplayTitle,
  placeReviewVisibleInVisitStories,
} from '../../../utils/placeReviewEditorial.js';
import { buildPlaceReviewsHref } from '../../../utils/placeReviewFocus.js';
import { supabase } from '../../../shared/api/supabase.js';
import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';
import { EXPLORE_BADGE_REVIEW } from '../../../i18n/exploreUi.js';
import { getPlaceUrlParam } from './formatUrlName.js';
import { explorePlaceBlockInsertIndex } from './exploreFestivalSearchSuggestions.js';

const MAX_REVIEW_HITS = 5;

/** @type {Promise<object[]> | null} */
let reviewSearchPoolPromise = null;

export function resetExploreReviewSearchPoolForTests() {
  reviewSearchPoolPromise = null;
}

/**
 * @param {string} query
 * @returns {string[]}
 */
export function exploreReviewSearchTokens(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];
  if (/\s/.test(raw)) {
    const spaced = raw.split(/\s+/).map((part) => normalizeFestivalQuery(part)).filter(Boolean);
    if (spaced.length > 1 && spaced.every((tok) => tok.length >= 2)) {
      return spaced;
    }
  }
  const single = normalizeFestivalQuery(raw);
  return single ? [single] : [];
}

function reviewSearchFields(row) {
  const chunks = [
    row?.place_name,
    row?.persona_label,
    placeReviewVisitStoryDisplayTitle(row, 200),
  ];
  const seen = new Set();
  const out = [];
  for (const chunk of chunks) {
    const norm = normalizeFestivalQuery(chunk);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

function reviewMatchesTokens(row, tokens) {
  const fields = reviewSearchFields(row);
  return tokens.every((tok) => fields.some((field) => field.includes(tok)));
}

/**
 * @param {object[]} pool
 * @param {string} query
 */
export function filterExploreReviewSearchQuery(pool, query) {
  const tokens = exploreReviewSearchTokens(query);
  if (!tokens.length) return [];
  return (pool || []).filter(
    (row) => placeReviewVisibleInVisitStories(row) && reviewMatchesTokens(row, tokens),
  );
}

/**
 * @param {object} row
 * @param {string} [locale]
 */
export function reviewRowToExploreSuggestion(row, locale = 'ko') {
  const title = placeReviewVisitStoryDisplayTitle(row);
  const slug = String(row?.place_slug || '').trim();
  const placePath = slug ? `/place/${getPlaceUrlParam({ slug, name: row?.place_name })}` : '';
  const persona = formatGateoReviewerBadge(row?.persona_label);
  const placeLabel = String(row?.place_name || '').trim();
  const desc = [placeLabel, persona].filter(Boolean).join(' · ');

  return {
    id: `review-${row.id}`,
    kind: 'review',
    source: 'review',
    badge: EXPLORE_BADGE_REVIEW,
    name: title,
    name_en: title,
    desc,
    searchOverlayDesc: desc,
    exploreHref: buildPlaceReviewsHref(placePath, row.id),
    placeSlug: slug,
    reviewId: row.id,
    country: placeLabel,
    locale,
  };
}

/**
 * @param {object[]} pool
 * @param {string} query
 * @param {{ locale?: string, maxItems?: number }} [opts]
 */
export function buildExploreReviewSuggestionsFromPool(pool, query, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const locale = opts.locale || 'ko';
  const maxItems = opts.maxItems ?? MAX_REVIEW_HITS;
  const hits = filterExploreReviewSearchQuery(pool || [], q).slice(0, maxItems);
  return hits.map((row) => reviewRowToExploreSuggestion(row, locale));
}

async function loadExploreReviewSearchPool() {
  if (!reviewSearchPoolPromise) {
    reviewSearchPoolPromise = fetchEditorialReviewIndex(supabase, { limit: 500 }).catch(() => []);
  }
  return reviewSearchPoolPromise;
}

/**
 * @param {string} query
 * @param {{ locale?: string, pool?: object[] }} [opts]
 */
export async function buildExploreReviewSearchSuggestions(query, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const pool = opts.pool ?? (await loadExploreReviewSearchPool());
  return buildExploreReviewSuggestionsFromPool(pool, q, opts);
}

/**
 * @param {object[]} reviews
 * @param {object[]} items
 * @param {{ maxItems?: number }} [opts]
 */
export function appendExploreReviewBelowPlaceBlock(reviews, items, opts = {}) {
  if (!reviews?.length) return items || [];
  const maxItems = opts.maxItems ?? 48;
  const reviewIds = new Set(reviews.map((row) => row.id));
  const base = (items || []).filter((row) => !reviewIds.has(row.id));
  const idx = explorePlaceBlockInsertIndex(base);
  return [...base.slice(0, idx), ...reviews, ...base.slice(idx)].slice(0, maxItems);
}

/**
 * @param {string} query
 * @param {object[]} hybridItems
 * @param {{ locale?: string, maxItems?: number, pool?: object[] }} [opts]
 */
export async function mergeExploreReviewIntoHybridSuggestions(query, hybridItems, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return hybridItems || [];
  const reviews = await buildExploreReviewSearchSuggestions(query, opts);
  if (!reviews.length) return hybridItems || [];
  return appendExploreReviewBelowPlaceBlock(reviews, hybridItems, opts);
}

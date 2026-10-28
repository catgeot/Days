import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';
import { buildHybridSearchSuggestions } from './searchSuggestions.js';
import {
  appendExploreFestivalBelowPlaceBlock,
  buildExploreFestivalSuggestionsFromPool,
  mergeExploreFestivalIntoHybridSuggestions,
} from './exploreFestivalSearchSuggestions.js';
import {
  appendExploreReviewBelowPlaceBlock,
  buildExploreReviewSuggestionsFromPool,
  mergeExploreReviewIntoHybridSuggestions,
} from './exploreReviewSearchSuggestions.js';

/** Room for hub rows + festivals + reviews without truncating tail assets. */
export const EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS = 48;

/**
 * Final hybrid list for /explore site search (festivals + editorial reviews merged like autocomplete late paint).
 * @param {string} query
 * @param {{ locale?: string, hybridOpts?: object, maxItems?: number }} [opts]
 */
export async function buildExploreSiteSearchHybridSuggestions(query, opts = {}) {
  const locale = opts.locale || 'ko';
  const maxItems = opts.maxItems ?? EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS;
  let items = await buildHybridSearchSuggestions(query, opts.hybridOpts);
  if (!isGateoSiteSearchEnabled()) return items;

  if (Array.isArray(opts.festPool)) {
    const fest = buildExploreFestivalSuggestionsFromPool(opts.festPool, query, {
      locale,
      now: opts.now,
    });
    items = appendExploreFestivalBelowPlaceBlock(fest, items, { maxItems });
  } else {
    items = await mergeExploreFestivalIntoHybridSuggestions(query, items, {
      locale,
      maxItems,
    });
  }

  if (Array.isArray(opts.reviewPool)) {
    const reviews = buildExploreReviewSuggestionsFromPool(opts.reviewPool, query, {
      locale,
      maxItems,
    });
    items = appendExploreReviewBelowPlaceBlock(reviews, items, { maxItems });
  } else {
    items = await mergeExploreReviewIntoHybridSuggestions(query, items, {
      locale,
      maxItems,
    });
  }
  return items;
}

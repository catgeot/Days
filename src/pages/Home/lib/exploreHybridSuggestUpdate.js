import {
  buildHybridSearchSuggestions,
  buildLocalSearchSuggestions,
  mergeTourSuggestionsFirst,
} from './searchSuggestions.js';
import { isKoreaGetbolCollectiveSearchQuery } from './exploreKoreaGetbolCollectiveSearch.js';
import {
  applyExploreFestivalMergeStrategy,
  buildExploreFestivalSearchSuggestions,
} from './exploreFestivalSearchSuggestions.js';
import { mergeExploreReviewIntoHybridSuggestions } from './exploreReviewSearchSuggestions.js';
import { EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS } from './exploreSiteSearchHybrid.js';
import { isGateoSiteSearchEnabled, isGateoExploreSearchSubmitParityEnabled } from '../../../shared/gateoFeatureFlags.js';
import { normalizeSearchSuggestions } from './normalizeSearchSuggestions.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';

/**
 * Debounced /explore hybrid + festival paints via `onPaint` (first paint before late append).
 * @param {string} query
 * @param {number} requestId
 * @param {() => number} getCurrentRequestId
 * @param {{ locale?: string, mergeStartedAt?: number, onPaint?: (items: object[]) => void }} [opts]
 * @param {object} [deps] test overrides
 * @returns {Promise<{ stale: boolean }>}
 */
export async function runExploreHybridSuggestUpdate(
  query,
  requestId,
  getCurrentRequestId,
  opts = {},
  deps = {},
) {
  const locale = opts.locale || 'ko';
  const mergeStartedAt = opts.mergeStartedAt ?? Date.now();
  const onPaint = opts.onPaint;
  const compactQuery = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  const isCurrent = () => {
    if (getCurrentRequestId() !== requestId) return false;
    if (typeof opts.getCurrentQuery !== 'function') return true;
    return compactQuery(opts.getCurrentQuery()) === compactQuery(query);
  };

  if (isKoreaGetbolCollectiveSearchQuery(query)) {
    const buildHybridForGetbol = deps.buildHybrid ?? ((q) => buildHybridSearchSuggestions(q, deps.hybridOpts));
    const painted = await buildHybridForGetbol(query);
    if (isCurrent()) {
      onPaint?.(painted);
    }
    return { stale: !isCurrent() };
  }
  const isEnabled = deps.isSiteSearchEnabled ?? isGateoSiteSearchEnabled;
  const isParityEnabled = deps.isSubmitParityEnabled ?? isGateoExploreSearchSubmitParityEnabled;
  const parityOn = isParityEnabled();
  const publish = (paintItems) => {
    if (!isCurrent()) return false;
    const painted = parityOn
      ? normalizeSearchSuggestions(query, paintItems, {
          hub: resolveExploreCityHubExact(query),
          locale,
        })
      : paintItems;
    onPaint?.(painted);
    return true;
  };
  const buildHybrid =
    deps.buildHybrid ??
    ((q) =>
      buildHybridSearchSuggestions(q, {
        onTourReady: (tourItems) => {
          publish(mergeTourSuggestionsFirst(tourItems, buildLocalSearchSuggestions(q)));
        },
      }));
  const buildFest =
    deps.buildFest ??
    ((q, loc) => buildExploreFestivalSearchSuggestions(q, { locale: loc }).catch(() => []));
  const applyMerge = deps.applyMerge ?? applyExploreFestivalMergeStrategy;
  const mergeReview = deps.mergeReview ?? mergeExploreReviewIntoHybridSuggestions;

  if (!isParityEnabled()) {
    const tryPaintMain = publish;

    const festPromise = isEnabled() ? buildFest(query, locale) : null;
    const items = await buildHybrid(query);
    if (!isCurrent()) {
      return { stale: true };
    }

    if (festPromise) {
      const { items: firstPaint, late } = await applyMerge(query, items, {
        locale,
        startedAt: mergeStartedAt,
        festPromise,
      });
      if (!isCurrent()) {
        return { stale: true };
      }
      tryPaintMain(firstPaint);
      if (late) {
        const merged = await late();
        if (!isCurrent()) {
          return { stale: true };
        }
        tryPaintMain(merged);
      }
      return { stale: false };
    }

    tryPaintMain(items);
    return { stale: false };
  }

  const tryPaint = publish;

  const mergeOpts = { locale, maxItems: EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS };

  const paintMerged = async (baseItems) => {
    const withReviews = isEnabled()
      ? await mergeReview(query, baseItems, mergeOpts)
      : baseItems;
    tryPaint(withReviews);
  };

  const festPromise = isEnabled() ? buildFest(query, locale) : null;
  const items = await buildHybrid(query);
  if (!isCurrent()) {
    return { stale: true };
  }

  if (festPromise) {
    const { items: firstPaint, late } = await applyMerge(query, items, {
      locale,
      startedAt: mergeStartedAt,
      festPromise,
      maxItems: EXPLORE_SITE_SEARCH_HYBRID_MAX_ITEMS,
    });
    if (!isCurrent()) {
      return { stale: true };
    }
    await paintMerged(firstPaint);
    if (late) {
      const merged = await late();
      if (!isCurrent()) {
        return { stale: true };
      }
      await paintMerged(merged);
    }
    return { stale: false };
  }

  if (isEnabled()) {
    await paintMerged(items);
  } else {
    tryPaint(items);
  }
  return { stale: false };
}

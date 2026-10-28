import { buildHybridSearchSuggestions } from './searchSuggestions.js';
import {
  applyExploreFestivalMergeStrategy,
  buildExploreFestivalSearchSuggestions,
} from './exploreFestivalSearchSuggestions.js';
import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';
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
  const isEnabled = deps.isSiteSearchEnabled ?? isGateoSiteSearchEnabled;
  const buildHybrid = deps.buildHybrid ?? ((q) => buildHybridSearchSuggestions(q));
  const buildFest =
    deps.buildFest ??
    ((q, loc) => buildExploreFestivalSearchSuggestions(q, { locale: loc }).catch(() => []));
  const applyMerge = deps.applyMerge ?? applyExploreFestivalMergeStrategy;

  const tryPaint = (paintItems) => {
    if (getCurrentRequestId() !== requestId) return false;
    onPaint?.(
      normalizeSearchSuggestions(query, paintItems, {
        hub: resolveExploreCityHubExact(query),
        locale,
      }),
    );
    return true;
  };

  const festPromise = isEnabled() ? buildFest(query, locale) : null;
  const items = await buildHybrid(query);
  if (getCurrentRequestId() !== requestId) {
    return { stale: true };
  }

  if (festPromise) {
    const { items: firstPaint, late } = await applyMerge(query, items, {
      locale,
      startedAt: mergeStartedAt,
      festPromise,
    });
    if (getCurrentRequestId() !== requestId) {
      return { stale: true };
    }
    tryPaint(firstPaint);
    if (late) {
      const merged = await late();
      if (getCurrentRequestId() !== requestId) {
        return { stale: true };
      }
      tryPaint(merged);
    }
    return { stale: false };
  }

  tryPaint(items);
  return { stale: false };
}

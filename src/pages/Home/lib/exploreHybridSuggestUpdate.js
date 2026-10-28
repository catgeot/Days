import { buildHybridSearchSuggestions } from './searchSuggestions.js';
import {
  applyExploreFestivalMergeStrategy,
  buildExploreFestivalSearchSuggestions,
} from './exploreFestivalSearchSuggestions.js';
import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';

/**
 * Debounced /explore hybrid + festival paints (requestId guard after merge wait).
 * @param {string} query
 * @param {number} requestId
 * @param {() => number} getCurrentRequestId
 * @param {{ locale?: string, mergeStartedAt?: number }} [opts]
 * @param {object} [deps] test overrides
 * @returns {Promise<{ stale: boolean, paints: object[][] }>}
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
  const isEnabled = deps.isSiteSearchEnabled ?? isGateoSiteSearchEnabled;
  const buildHybrid = deps.buildHybrid ?? ((q) => buildHybridSearchSuggestions(q));
  const buildFest =
    deps.buildFest ??
    ((q, loc) => buildExploreFestivalSearchSuggestions(q, { locale: loc }).catch(() => []));
  const applyMerge = deps.applyMerge ?? applyExploreFestivalMergeStrategy;

  const festPromise = isEnabled() ? buildFest(query, locale) : null;
  const items = await buildHybrid(query);
  if (getCurrentRequestId() !== requestId) {
    return { stale: true, paints: [] };
  }

  if (festPromise) {
    const { items: firstPaint, late } = await applyMerge(query, items, {
      locale,
      startedAt: mergeStartedAt,
      festPromise,
    });
    if (getCurrentRequestId() !== requestId) {
      return { stale: true, paints: [] };
    }
    /** @type {object[][]} */
    const paints = [firstPaint];
    if (late) {
      const merged = await late();
      if (getCurrentRequestId() !== requestId) {
        return { stale: true, paints: [] };
      }
      paints.push(merged);
    }
    return { stale: false, paints };
  }

  return { stale: false, paints: [items] };
}

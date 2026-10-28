import { makeDisambiguationResult } from './cityAttractionHubs.js';
import { buildHybridSearchSuggestions } from './searchSuggestions.js';
import {
  appendExploreFestivalBelowPlaceBlock,
  buildExploreFestivalSearchSuggestions,
} from './exploreFestivalSearchSuggestions.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';
import { normalizeSearchSuggestions } from './normalizeSearchSuggestions.js';
import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';

/**
 * Enter panel model aligned with autocomplete (hub exact + submit parity flag).
 * @param {string} query
 * @param {{ hub?: object, locale?: string }} [opts]
 */
export async function buildExploreSubmitParityDisambiguation(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q) return null;

  const hub = opts.hub || resolveExploreCityHubExact(q);
  if (!hub) return null;

  let items = await buildHybridSearchSuggestions(q);
  if (isGateoSiteSearchEnabled()) {
    const fest = await buildExploreFestivalSearchSuggestions(q, {
      locale: opts.locale || 'ko',
    }).catch(() => []);
    items = appendExploreFestivalBelowPlaceBlock(fest, items);
  }

  const normalized = normalizeSearchSuggestions(q, items, { hub, locale: opts.locale || 'ko' });
  if (!normalized.length) return null;

  const title = `'${hub.name}' → 도시·명소·여행지`;
  const result = makeDisambiguationResult(q, normalized, { title });
  return {
    ...result,
    submitParity: true,
    showMooni: true,
  };
}

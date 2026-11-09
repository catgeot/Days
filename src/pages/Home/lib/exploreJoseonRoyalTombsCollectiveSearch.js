import { normalizeExploreSelectionPin } from './explorePlaceNav.js';
import { resolveSearchResultSelect } from './exploreRecentHistory.js';
import { buildJoseonRoyalTombsCollectiveSuggestions, isJoseonRoyalTombsCollectiveQuery } from './joseonRoyalTombsSearch.js';

export { isJoseonRoyalTombsCollectiveQuery };

function opensOnPlaceRoute(item) {
  if (!item) return false;
  const pin = normalizeExploreSelectionPin(item);
  return resolveSearchResultSelect(pin)?.type === 'place';
}

/**
 * @param {string} query
 * @returns {object[]}
 */
export function buildJoseonRoyalTombsCollectiveSearchSuggestions(query) {
  const items = buildJoseonRoyalTombsCollectiveSuggestions(query);
  return items.filter((item) => opensOnPlaceRoute(item));
}

/**
 * 탐색창 hub exact — 정착지 공식명(마산·진해 등)은 hub alias보다 정착지 SSOT 우선.
 */
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { resolveSettlement } from './mapboxSettlementPlaces.js';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

export function hubQueryIsPrimaryName(query, hub) {
  if (!hub) return false;
  const key = normalizeKey(query);
  if (!key) return false;
  return [hub.name, hub.name_en, hub.hubId].some((k) => normalizeKey(k) === key);
}

/**
 * @param {string} query
 * @returns {object | null}
 */
export function resolveExploreCityHubExact(query) {
  const hub = resolveCityAttractionHub(query);
  if (!hub) return null;
  const settlement = resolveSettlement(query);
  if (
    settlement &&
    normalizeKey(settlement.row.hubId) === normalizeKey(hub.hubId) &&
    !hubQueryIsPrimaryName(query, hub)
  ) {
    return null;
  }
  return hub;
}

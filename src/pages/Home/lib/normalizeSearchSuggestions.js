/**
 * Shared explore search suggestion ordering + hub alias merge (autocomplete + Enter parity).
 */
import { resolveCityAttractionHub } from './cityAttractionHubs.js';

export const SEARCH_SUGGESTION_GROUP_ORDER = [
  'mooni',
  'festival',
  'event',
  'destination',
  'city',
  'attraction',
  'collection',
  'review',
];

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

export function suggestionDedupeKey(item) {
  if (item?.id) return String(item.id);
  const name = normalizeKey(item?.name);
  const hub = normalizeKey(item?.hubId || item?.slug);
  return name && hub ? `${hub}:${name}` : name || hub;
}

/**
 * @param {object} item
 * @returns {typeof SEARCH_SUGGESTION_GROUP_ORDER[number]}
 */
export function resolveSearchSuggestionGroup(item) {
  if (item?.kind === 'festival' || item?.source === 'korea-festival') return 'festival';
  if (item?.kind === 'event') return 'event';
  if (item?.kind === 'review' || item?.source === 'review') return 'review';
  if (item?.kind === 'collection') return 'collection';
  if (item?.kind === 'spot' || item?.badge === '여행지') return 'destination';
  if (item?.kind === 'city' || item?.badge === '도시') return 'city';
  if (item?.kind === 'attraction' || item?.badge === '명소') return 'attraction';
  if (item?.kind === 'settlement' || item?.badge === '지역') return 'city';
  return 'attraction';
}

/**
 * @param {object} item
 * @returns {string}
 */
export function resolveCanonicalHubId(item) {
  const hubId = normalizeKey(item?.hubId);
  if (hubId) return hubId;
  const slug = normalizeKey(item?.slug);
  if (slug && resolveCityAttractionHub(slug)) return slug;
  return slug || '';
}

function groupSortIndex(group) {
  const idx = SEARCH_SUGGESTION_GROUP_ORDER.indexOf(group);
  return idx >= 0 ? idx : SEARCH_SUGGESTION_GROUP_ORDER.length;
}

/**
 * Merge SSOT destination row (빈) with hub city row (비엔나) into one city card.
 * @param {object[]} items
 * @returns {object[]}
 */
export function mergeHubAliasSuggestions(items) {
  const list = (items || []).map((item) => ({ ...item }));
  const groups = new Map();
  for (const item of list) {
    const hubId = resolveCanonicalHubId(item);
    if (!hubId) continue;
    if (!groups.has(hubId)) groups.set(hubId, []);
    groups.get(hubId).push(item);
  }

  const dropKeys = new Set();
  const patchByKey = new Map();

  for (const [hubId, bucket] of groups) {
    const cityRow = bucket.find((row) => resolveSearchSuggestionGroup(row) === 'city');
    const destRow = bucket.find(
      (row) =>
        resolveSearchSuggestionGroup(row) === 'destination' &&
        (normalizeKey(row.slug) === hubId || normalizeKey(row.hubId) === hubId),
    );
    if (!cityRow || !destRow) continue;

    const aliasParts = [
      String(destRow.name_en || cityRow.name_en || '').trim(),
      String(destRow.name || '').trim(),
    ].filter(Boolean);
    const aliasLine = [...new Set(aliasParts)].join(' · ');
    if (aliasLine) {
      patchByKey.set(suggestionDedupeKey(cityRow), {
        searchOverlayDesc: aliasLine,
        mergedDestinationId: destRow.id,
      });
    }
    dropKeys.add(suggestionDedupeKey(destRow));
  }

  return list
    .filter((item) => !dropKeys.has(suggestionDedupeKey(item)))
    .map((item) => {
      const patch = patchByKey.get(suggestionDedupeKey(item));
      return patch ? { ...item, ...patch } : item;
    });
}

/**
 * @param {string} query
 * @param {object[]} rawItems
 * @param {{ mergeAliases?: boolean }} [opts]
 * @returns {object[]}
 */
export function normalizeSearchSuggestions(query, rawItems, opts = {}) {
  const mergeAliases = opts.mergeAliases !== false;
  let items = mergeAliases ? mergeHubAliasSuggestions(rawItems) : [...(rawItems || [])];

  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    if (!item?.name) continue;
    const key = suggestionDedupeKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...item,
      suggestionGroup: resolveSearchSuggestionGroup(item),
    });
  }

  deduped.sort((a, b) => {
    const ga = groupSortIndex(a.suggestionGroup);
    const gb = groupSortIndex(b.suggestionGroup);
    if (ga !== gb) return ga - gb;
    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  });

  void query;
  return deduped;
}

/**
 * Shared explore search suggestion ordering + hub alias merge (autocomplete + Enter parity).
 */
import { resolveCityAttractionHub, hubToSuggestion } from './cityAttractionHubs.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';
import {
  exploreFestivalSearchFields,
  exploreFestivalSearchTokens,
} from './exploreFestivalSearchSuggestions.js';
import { normalizeFestivalQuery } from '../../Korea/festivalSearch.js';

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

function buildMergedHubAliasSubtitle(cityRow, destRow) {
  const cityName = String(cityRow?.name || '').trim();
  const destAlias = String(destRow?.name || '').trim();
  if (destAlias && normalizeKey(destAlias) !== normalizeKey(cityName)) {
    return destAlias;
  }
  const cityEn = String(cityRow?.name_en || '').trim();
  return cityEn || '';
}

function festivalSearchFieldsIncludingName(item, locale) {
  const fields = exploreFestivalSearchFields(item, locale);
  for (const chunk of [item?.name, item?.title, item?.titleEn]) {
    const norm = normalizeFestivalQuery(chunk);
    if (norm && !fields.includes(norm)) fields.push(norm);
  }
  return fields;
}

function festivalMatchesQueryStrongly(query, festivalItem, locale) {
  const tokens = exploreFestivalSearchTokens(query);
  if (!tokens.length) return false;
  const fields = festivalSearchFieldsIncludingName(festivalItem, locale);
  return tokens.every((tok) => {
    if (tok.length >= 2) return fields.some((field) => field.includes(tok));
    return fields.some((field) => field === tok);
  });
}

/**
 * Single-token festival hit where query only appears inside a longer title token (e.g. «빈» in «빈티지»).
 * @param {string} query
 * @param {object} festivalItem
 * @param {string} [locale]
 */
export function isWeakFestivalSubstringMatch(query, festivalItem, locale = 'ko') {
  if (festivalMatchesQueryStrongly(query, festivalItem, locale)) return false;
  const tokens = exploreFestivalSearchTokens(query);
  if (tokens.length !== 1) return false;
  const tok = tokens[0];
  if (tok.length >= 2) return false;
  const fields = festivalSearchFieldsIncludingName(festivalItem, locale);
  return fields.some((field) => field.includes(tok) && field.length > tok.length);
}

function isPrimaryHubCityRow(item, hubId) {
  if (!hubId || !item) return false;
  const id = String(item.id || '');
  if (id === `hub-${hubId}`) return true;
  return (
    normalizeKey(item.hubId) === hubId &&
    resolveSearchSuggestionGroup(item) === 'city' &&
    id.startsWith('hub-')
  );
}

/**
 * Hub-exact query: primary city first, hub attractions next, drop weak substring festivals, then rest.
 * @param {object[]} items
 * @param {object} hub
 */
export function reorderHubExactSuggestions(items, hub) {
  const hubId = normalizeKey(hub?.hubId);
  if (!hubId) return items;

  const primary = [];
  const hubAttractions = [];
  const festivals = [];
  const rest = [];

  for (const item of items) {
    const group = resolveSearchSuggestionGroup(item);
    const itemHub = normalizeKey(item.hubId);
    if (isPrimaryHubCityRow(item, hubId)) {
      primary.push(item);
    } else if (itemHub === hubId && group === 'attraction') {
      hubAttractions.push(item);
    } else if (group === 'festival') {
      festivals.push(item);
    } else {
      rest.push(item);
    }
  }

  return [...primary, ...hubAttractions, ...festivals, ...rest];
}

function ensurePrimaryHubCityRow(items, hub) {
  const hubId = normalizeKey(hub?.hubId);
  if (!hubId) return items || [];
  const list = [...(items || [])];
  if (list.some((row) => isPrimaryHubCityRow(row, hubId))) return list;
  const ssotHub = resolveCityAttractionHub(hubId) || hub;
  if (!ssotHub?.hubId) return list;
  return [hubToSuggestion(ssotHub), ...list];
}

/**
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
    const cityRow = bucket.find((row) => isPrimaryHubCityRow(row, hubId));
    const destRow = bucket.find(
      (row) =>
        resolveSearchSuggestionGroup(row) === 'destination' &&
        (normalizeKey(row.slug) === hubId || normalizeKey(row.hubId) === hubId),
    );
    if (!cityRow || !destRow) continue;

    const aliasLine = buildMergedHubAliasSubtitle(cityRow, destRow);
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
 * @param {{ mergeAliases?: boolean, hub?: object | null, locale?: string }} [opts]
 * @returns {object[]}
 */
export function normalizeSearchSuggestions(query, rawItems, opts = {}) {
  const mergeAliases = opts.mergeAliases !== false;
  const locale = opts.locale || 'ko';
  const hub = opts.hub === undefined ? resolveExploreCityHubExact(query) : opts.hub;
  let items = [...(rawItems || [])];
  if (mergeAliases && hub?.hubId) {
    items = ensurePrimaryHubCityRow(items, hub);
  }
  items = mergeAliases ? mergeHubAliasSuggestions(items) : items;

  if (hub?.hubId) {
    items = items.filter((item) => {
      if (resolveSearchSuggestionGroup(item) !== 'festival') return true;
      return !isWeakFestivalSubstringMatch(query, item, locale);
    });
  }

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
      _suggestOrder: deduped.length,
    });
  }

  if (!hub?.hubId) {
    deduped.sort((a, b) => {
      const ga = groupSortIndex(a.suggestionGroup);
      const gb = groupSortIndex(b.suggestionGroup);
      if (ga !== gb) return ga - gb;
      return (a._suggestOrder ?? 0) - (b._suggestOrder ?? 0);
    });
    return deduped.map(({ _suggestOrder, ...item }) => item);
  }

  return reorderHubExactSuggestions(
    deduped.map(({ _suggestOrder, ...item }) => item),
    hub,
  );
}

/**
 * Disambiguation cards keep hub marketing desc; autocomplete popover may show alias overlay.
 * @param {object} item
 * @param {{ isPopover?: boolean }} [opts]
 */
export function resolveExploreSearchCardDesc(item, opts = {}) {
  const overlay = String(item?.searchOverlayDesc || '').trim();
  const desc = String(item?.desc || '').trim();
  if (overlay && item?.mergedDestinationId && !opts.isPopover) {
    return desc;
  }
  return overlay || desc;
}

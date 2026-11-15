/**
 * Explore choseong suggestions. Catalog choseong strings are built once per list.
 * Empty needles match nothing (`includes('')` is true for every name).
 * name_en is read only as a string — null/undefined must not reach toLowerCase (a1c43118).
 */
import { hangulChoseong, isChoseongQuery } from '../../../utils/hangulSearch.js';
import { isGateoExploreChoseongEnabled } from '../../../shared/gateoFeatureFlags.js';
import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { citiesData } from '../data/citiesData.js';
import {
  attractionToSuggestion,
  hubToSuggestion,
  listCityAttractionHubs,
} from './cityAttractionHubs.js';
import { isHiddenHubScenicAttraction } from './koreaScenicSpotVisibility.js';
import { cityToSuggestion } from './citiesSearch.js';
import {
  listMapboxSettlementRows,
  settlementToSuggestion,
} from './mapboxSettlementPlaces.js';

const TIER_SPOT = 0;
const TIER_HUB = 1;
const TIER_CITY = 2;
const TIER_ATTRACTION = 3;
const TIER_SETTLEMENT = 4;

let placeIndex = null;
let placeIndexBuilds = 0;

function nameKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * Folded substring. Empty needle matches nothing. Non-strings never call toLowerCase.
 * @param {unknown} haystack
 * @param {unknown} needle
 */
export function exploreTextIncludes(haystack, needle) {
  if (typeof needle !== 'string' && typeof needle !== 'number') return false;
  const n = String(needle).trim();
  if (!n) return false;
  if (typeof haystack !== 'string') return false;
  return haystack.toLowerCase().includes(n.toLowerCase());
}

/** @param {unknown} value */
export function isExploreChoseongQuery(value) {
  if (!isGateoExploreChoseongEnabled()) return false;
  return isChoseongQuery(value);
}

function compareChoseong(a, b, query) {
  const aExact = a.choseong.length === query.length ? 0 : 1;
  const bExact = b.choseong.length === query.length ? 0 : 1;
  if (aExact !== bExact) return aExact - bExact;
  if (a.tier !== b.tier) return a.tier - b.tier;
  if (a.choseong.length !== b.choseong.length) return a.choseong.length - b.choseong.length;
  if (a.nameLength !== b.nameLength) return a.nameLength - b.nameLength;
  if (a.popularity !== b.popularity) return b.popularity - a.popularity;
  return String(a.label || '').localeCompare(String(b.label || ''), 'ko');
}

/**
 * @param {Array<{ id: string, choseong: string, tier: number, popularity: number, nameLength: number, label: string, item: object }>} rows
 * @param {string} query
 * @param {number} [limit]
 */
export function filterChoseongRows(rows, query, limit = 24) {
  const q = String(query ?? '').replace(/\s+/g, '');
  const cap = Number.isFinite(limit) ? limit : 24;
  if (!isChoseongQuery(q) || cap <= 0) return [];
  const matched = [];
  for (const row of rows || []) {
    if (!row?.choseong || !row.choseong.startsWith(q)) continue;
    matched.push(row);
  }
  matched.sort((a, b) => compareChoseong(a, b, q));
  const hits = [];
  const seen = new Set();
  for (const row of matched) {
    if (!row.item || seen.has(row.id)) continue;
    seen.add(row.id);
    hits.push(row.item);
    if (hits.length >= cap) break;
  }
  return hits;
}

function pushChoseongName(rows, seenCs, spec) {
  const label = typeof spec.label === 'string' ? spec.label.trim() : '';
  if (!label) return;
  const choseong = hangulChoseong(label);
  if (!choseong || seenCs.has(choseong)) return;
  seenCs.add(choseong);
  rows.push({
    id: spec.id,
    choseong,
    tier: spec.tier,
    popularity: Number(spec.popularity) || 0,
    nameLength: label.length,
    label,
    item: spec.item,
  });
}

function buildPlaceChoseongIndex() {
  const rows = [];
  for (const spot of TRAVEL_SPOTS || []) {
    if (!spot || typeof spot !== 'object') continue;
    const item = {
      ...spot,
      id: `spot-${spot.slug || spot.id}`,
      kind: 'spot',
      badge: '여행지',
      name: spot.name,
      name_en: typeof spot.name_en === 'string' && spot.name_en.trim() ? spot.name_en : spot.name,
      country: spot.country || 'Explore',
      country_en: spot.country_en || 'Explore',
      lat: spot.lat,
      lng: spot.lng,
      slug: spot.slug,
      source: 'ssot',
    };
    if (!item.name) continue;
    const seenCs = new Set();
    pushChoseongName(rows, seenCs, {
      id: item.id,
      tier: TIER_SPOT,
      popularity: spot.popularity,
      label: spot.name,
      item,
    });
  }

  const cityPriorityByName = new Map();
  for (const city of citiesData || []) {
    if (!city || typeof city.name !== 'string') continue;
    const key = nameKey(city.name);
    if (!key) continue;
    cityPriorityByName.set(key, Number(city.priority) || 0);
  }

  for (const hub of listCityAttractionHubs()) {
    if (!hub?.hubId || typeof hub.name !== 'string') continue;
    const hubItem = hubToSuggestion(hub);
    const hubSeen = new Set();
    const catalogPriority = cityPriorityByName.get(nameKey(hub.name)) || 0;
    pushChoseongName(rows, hubSeen, {
      id: hubItem.id,
      tier: TIER_HUB,
      popularity: catalogPriority,
      label: hub.name,
      item: hubItem,
    });
    for (const attraction of hub.attractions || []) {
      if (!attraction || typeof attraction.name !== 'string') continue;
      if (isHiddenHubScenicAttraction(hub.hubId, attraction.name)) continue;
      const item = attractionToSuggestion(hub, attraction);
      if (!item?.name) continue;
      const seenCs = new Set();
      pushChoseongName(rows, seenCs, {
        id: item.id,
        tier: TIER_ATTRACTION,
        popularity: 0,
        label: attraction.name,
        item,
      });
    }
  }

  for (const city of citiesData || []) {
    if (!city || typeof city.name !== 'string') continue;
    const item = cityToSuggestion(city);
    if (!item?.name) continue;
    const seenCs = new Set();
    pushChoseongName(rows, seenCs, {
      id: item.id,
      tier: TIER_CITY,
      popularity: city.priority || 0,
      label: city.name,
      item,
    });
  }

  for (const row of listMapboxSettlementRows()) {
    for (const settlement of row?.settlements || []) {
      if (!settlement || typeof settlement.name !== 'string') continue;
      const item = settlementToSuggestion(row, settlement);
      if (!item?.name) continue;
      const seenCs = new Set();
      pushChoseongName(rows, seenCs, {
        id: item.id,
        tier: TIER_SETTLEMENT,
        popularity: 0,
        label: settlement.name,
        item,
      });
    }
  }

  return rows;
}

export function explorePlaceChoseongIndex() {
  if (placeIndex) return placeIndex;
  placeIndexBuilds += 1;
  placeIndex = buildPlaceChoseongIndex();
  return placeIndex;
}

export function exploreChoseongIndexBuildCount() {
  return placeIndexBuilds;
}

export function resetExploreChoseongIndexForTests() {
  placeIndex = null;
  placeIndexBuilds = 0;
}

/**
 * Small catalogs (unit regressions). Does not touch the memoized place index.
 * @param {object[]} records
 * @param {unknown} query
 */
export function matchChoseongCatalog(records, query) {
  const rows = [];
  for (const record of records || []) {
    if (!record || typeof record !== 'object') continue;
    const id = String(record.id || record.name || '');
    if (!id) continue;
    const seenCs = new Set();
    const labels = [record.name];
    if (typeof record.name_en === 'string') labels.push(record.name_en);
    for (const label of labels) {
      pushChoseongName(rows, seenCs, {
        id,
        tier: 0,
        popularity: 0,
        label,
        item: record,
      });
    }
  }
  return filterChoseongRows(rows, query, records?.length || 0);
}

/**
 * @param {unknown} query
 * @param {{ limit?: number }} [opts]
 */
export function matchExploreChoseongSuggestions(query, opts = {}) {
  if (!isExploreChoseongQuery(query)) return [];
  const hits = filterChoseongRows(explorePlaceChoseongIndex(), query, opts.limit ?? 24);
  return hits.map((item) => ({ ...item, matchKind: 'choseong' }));
}

/**
 * Syllable/english hits stay in front. Choseong hits append, same name is not repeated.
 * @param {object[]} existing
 * @param {object[]} choseongHits
 */
export function appendChoseongSuggestions(existing, choseongHits) {
  const out = [...(existing || [])];
  const seen = new Set();
  for (const item of out) {
    const key = nameKey(item?.name);
    if (key) seen.add(key);
  }
  for (const item of choseongHits || []) {
    const key = nameKey(item?.name);
    if (!item?.name || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * 허브 근처 Mapbox 정착지(place/city/locality) SSOT.
 * POI·명소는 cityAttractionHubs — 이 파일에 넣지 않음.
 */
import settlementsJson from '../data/mapboxSettlementPlaces.json' with { type: 'json' };
import {
  listCityAttractionHubs,
  placeSlugVariants,
  placeUrlSlug,
} from './cityAttractionHubs.js';

const FEATURE_TYPES = new Set(['place', 'city', 'locality']);
const HUB_EXACT_SETTLEMENT_LIMIT = 3;

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const ROWS = Array.isArray(settlementsJson) ? settlementsJson : [];

/** @type {Map<string, object>} hubId → row */
const rowByHubId = new Map();
/** @type {Map<string, { row: object, settlement: object }>} */
const settlementByKey = new Map();
/** @type {Map<string, { row: object, settlement: object }>} /place/:slug */
const settlementByPlaceSlug = new Map();

for (const row of ROWS) {
  if (!row?.hubId) continue;
  rowByHubId.set(row.hubId, row);
  for (const settlement of row.settlements || []) {
    const keys = [settlement.name, settlement.name_en, settlement.placeId, ...(settlement.aliases || [])];
    for (const k of keys) {
      const nk = normalizeKey(k);
      if (nk && !settlementByKey.has(nk)) {
        settlementByKey.set(nk, { row, settlement });
      }
    }
    for (const sk of placeSlugVariants(
      settlement.name_en,
      settlement.name,
      ...(settlement.aliases || []),
    )) {
      if (sk && !settlementByPlaceSlug.has(sk)) {
        settlementByPlaceSlug.set(sk, { row, settlement });
      }
    }
  }
}

const hubMetaById = new Map(listCityAttractionHubs().map((h) => [h.hubId, h]));

export function listMapboxSettlementRows() {
  return ROWS;
}

export function getSettlementsForHub(hubId) {
  return rowByHubId.get(hubId)?.settlements || [];
}

/**
 * 정착지 exact (공식명·alias·placeId).
 * @param {string} query
 */
export function resolveSettlement(query) {
  const key = normalizeKey(query);
  if (!key) return null;
  return settlementByKey.get(key) || null;
}

/**
 * hub exact 시 제안용 — 최대 3개.
 * @param {string} hubId
 * @param {{ limit?: number }} [opts]
 */
export function settlementsForHubSuggestions(hubId, { limit = HUB_EXACT_SETTLEMENT_LIMIT } = {}) {
  return getSettlementsForHub(hubId).slice(0, limit);
}

/**
 * 타이핑 prefix — 정착지명 시작.
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 */
export function matchSettlementsPrefix(query, { limit = 6 } = {}) {
  const key = normalizeKey(query);
  if (!key || key.length < 1) return [];

  const out = [];
  const seen = new Set();
  for (const row of ROWS) {
    for (const settlement of row.settlements || []) {
      const keys = [settlement.name, settlement.name_en, ...(settlement.aliases || [])];
      if (!keys.some((k) => normalizeKey(k).startsWith(key))) continue;
      const id = settlement.placeId || normalizeKey(settlement.name);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ row, settlement });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function settlementToSuggestion(row, settlement) {
  const hub = hubMetaById.get(row.hubId);
  const parentCity = hub?.name || row.hubId;
  return {
    id: `settlement-${settlement.placeId || normalizeKey(settlement.name)}`,
    kind: 'settlement',
    badge: '지역',
    name: settlement.name,
    name_en: settlement.name_en || settlement.name,
    country: hub?.country || 'Explore',
    country_en: hub?.country_en || 'Explore',
    lat: settlement.lat,
    lng: settlement.lng,
    slug: placeUrlSlug(settlement.name_en, settlement.name),
    hubId: row.hubId,
    placeId: settlement.placeId,
    mapboxId: settlement.mapboxId || null,
    featureType: settlement.featureType,
    source: 'settlement',
    uiPlace: true,
    parentCity,
    desc: `${parentCity} · 지역`,
  };
}

export function settlementToPlacePin(row, settlement) {
  const hub = hubMetaById.get(row.hubId);
  return {
    id: `settlement-${settlement.placeId || normalizeKey(settlement.name)}`,
    slug: placeUrlSlug(settlement.name_en, settlement.name),
    name: settlement.name,
    name_en: settlement.name_en || settlement.name,
    name_ko: settlement.name,
    country: hub?.country || 'Explore',
    country_en: hub?.country_en || 'Explore',
    lat: settlement.lat,
    lng: settlement.lng,
    type: 'temp-base',
    uiPlace: true,
    hubId: row.hubId,
    parentCity: hub?.name || row.hubId,
    mapboxId: settlement.mapboxId || null,
    desc: `${hub?.name || row.hubId} 인근 · ${settlement.name}`,
  };
}

/**
 * /place/:slug 새로고침 hydrate — 정착지 SSOT.
 * @param {string} slug
 * @returns {object|null}
 */
export function resolveSettlementPlaceFromSlug(slug) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return null;
  const hit = settlementByPlaceSlug.get(normalized);
  if (!hit) return null;
  return settlementToPlacePin(hit.row, hit.settlement);
}

export { FEATURE_TYPES, HUB_EXACT_SETTLEMENT_LIMIT };

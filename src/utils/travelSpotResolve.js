import { TRAVEL_SPOTS } from '../pages/Home/data/travelSpots.js';
import {
  TRAVEL_SPOT_PLACE_ID_ALIASES,
  TRAVEL_SPOT_PLACE_ID_BLOCKLIST,
} from '../../scripts/data/travel-spot-place-id-aliases.mjs';

const STRIP_SUFFIX_RE = /\s*(제도|국립공원|국립\s*공원|호수|섬|기지|시|군|주)\s*$/gi;
const STRIP_INFIX_RE = /\s*(제도|국립공원|국립\s*공원)\s*/gi;

export function normalizePlaceKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function placeIdVariants(placeId) {
  const raw = String(placeId ?? '').trim();
  if (!raw) return [];

  const out = new Set();
  const add = (v) => {
    if (v == null || v === '') return;
    out.add(String(v).trim());
    out.add(normalizePlaceKey(v));
    out.add(String(v).trim().toLowerCase());
  };

  add(raw);
  add(raw.replace(/\s+/g, ''));
  add(raw.replace(/-/g, ' '));
  add(raw.replace(/-/g, ''));

  const strippedSuffix = raw.replace(STRIP_SUFFIX_RE, '').trim();
  if (strippedSuffix) add(strippedSuffix);

  const strippedInfix = raw.replace(STRIP_INFIX_RE, ' ').replace(/\s+/g, ' ').trim();
  if (strippedInfix) add(strippedInfix);

  return [...out];
}

function isBlocklistedPlaceId(placeId) {
  return TRAVEL_SPOT_PLACE_ID_BLOCKLIST.has(normalizePlaceKey(placeId));
}

let cachedLookup = null;

export function buildSpotLookup(spots = TRAVEL_SPOTS) {
  const lookup = new Map();
  const bySlug = new Map(spots.map((s) => [s.slug, s]));

  const add = (key, spot) => {
    if (key == null || key === '' || !spot) return;
    for (const v of placeIdVariants(key)) {
      const k = normalizePlaceKey(v) || String(v).trim();
      if (k && !lookup.has(k)) lookup.set(k, spot);
    }
  };

  for (const spot of spots) {
    add(spot.id, spot);
    add(spot.slug, spot);
    add(spot.name, spot);
    add(spot.name_en, spot);
    for (const kw of spot.keywords || []) add(kw, spot);
  }

  for (const [placeId, slug] of Object.entries(TRAVEL_SPOT_PLACE_ID_ALIASES)) {
    const spot = bySlug.get(slug);
    if (!spot) continue;
    for (const v of placeIdVariants(placeId)) add(v, spot);
    add(placeId, spot);
  }

  return lookup;
}

function getSpotLookup() {
  if (!cachedLookup) cachedLookup = buildSpotLookup(TRAVEL_SPOTS);
  return cachedLookup;
}

function resolveFuzzy(spots, placeId) {
  const core = normalizePlaceKey(
    String(placeId).replace(STRIP_SUFFIX_RE, '').replace(STRIP_INFIX_RE, '')
  );
  if (core.length < 2) return null;

  const candidates = spots.filter((s) => {
    const sn = normalizePlaceKey(s.name);
    const sen = normalizePlaceKey(s.name_en);
    const matchKo = sn.length >= 2 && (sn === core || sn.includes(core) || core.includes(sn));
    const matchEn = sen.length >= 2 && (sen === core || sen.includes(core) || core.includes(sen));
    return matchKo || matchEn;
  });

  if (candidates.length === 1) return { spot: candidates[0], matchKind: 'fuzzy' };
  return null;
}

export function resolveTravelSpotFromPlaceId(lookup, spots, placeId) {
  const raw = String(placeId ?? '').trim();
  if (!raw) return null;
  if (isBlocklistedPlaceId(raw)) return null;

  for (const v of placeIdVariants(raw)) {
    const hit = lookup.get(normalizePlaceKey(v)) || lookup.get(v.toLowerCase());
    if (hit) {
      const aliasHit = Object.entries(TRAVEL_SPOT_PLACE_ID_ALIASES).some(([alias, slug]) => {
        if (slug !== hit.slug) return false;
        return placeIdVariants(alias).some((a) => normalizePlaceKey(a) === normalizePlaceKey(v));
      });
      return { spot: hit, matchKind: aliasHit ? 'alias' : 'lookup' };
    }
  }

  return resolveFuzzy(spots, raw);
}

/** 좌표 근접 매칭 — loc-/search- URL 새로고침·지오코딩 핀 복구용 */
export function resolveTravelSpotFromCoords(lat, lng, spots = TRAVEL_SPOTS, epsilon = 0.02) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return (
    spots.find(
      (s) =>
        Number.isFinite(s.lat) &&
        Number.isFinite(s.lng) &&
        Math.abs(s.lat - lat) < epsilon &&
        Math.abs(s.lng - lng) < epsilon
    ) ?? null
  );
}

export function resolveTravelSpotFromLocation(location) {
  if (location == null) return null;
  if (typeof location === 'string') {
    return resolveTravelSpotFromPlaceId(getSpotLookup(), TRAVEL_SPOTS, location);
  }

  const keys = [
    location.canonical_slug,
    location.place_id,
    location.placeId,
    location.name,
    location.name_en,
    location.slug,
  ];

  for (const key of keys) {
    if (!key) continue;
    const hit = resolveTravelSpotFromPlaceId(getSpotLookup(), TRAVEL_SPOTS, key);
    if (hit) return hit;
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);
  const byCoords = resolveTravelSpotFromCoords(lat, lng);
  if (byCoords) return { spot: byCoords, matchKind: 'coords' };

  return null;
}

/** 검색·핀·지오코딩 location을 SSOT travelSpots 행으로 병합 */
export function mergeCanonicalTravelSpot(location) {
  if (!location || typeof location !== 'object') return location;

  const resolved = resolveTravelSpotFromLocation(location);
  if (!resolved?.spot) return location;

  const { spot } = resolved;
  return {
    ...location,
    id: spot.id ?? location.id,
    canonical_slug: spot.slug,
    slug: spot.slug,
    name: spot.name,
    name_en: spot.name_en ?? location.name_en,
    name_ko: spot.name_ko ?? spot.name,
    country: spot.country ?? location.country,
    country_en: spot.country_en ?? location.country_en,
    category: spot.category ?? spot.primaryCategory ?? location.category,
    desc: location.desc || spot.desc,
    keywords: spot.keywords ?? location.keywords,
    lat: spot.lat ?? location.lat,
    lng: spot.lng ?? location.lng,
    tier: spot.tier ?? location.tier,
    continent: spot.continent ?? location.continent,
  };
}

/** 플래너·캐시용 안정 키 — canonical_slug 우선 */
export function getPlaceStableKey(location) {
  if (location == null) return '';
  if (typeof location === 'string') return location.trim();
  const canonical = location.canonical_slug ?? location.slug;
  if (canonical) return String(canonical).trim().toLowerCase();
  return String(location.name ?? location.place_id ?? '').trim();
}

/** place_stats·place_wiki RPC/upsert용 — Option A: SSOT 한글명 우선, 없으면 stable key */
export function getPlaceStatsId(location) {
  if (location == null) return '';
  if (typeof location === 'string') return location.trim();
  const name = String(location.name ?? '').trim();
  if (name) return name;
  return getPlaceStableKey(location);
}

/** DB place_id 조회 후보 — stable key + 표시명 + slug (레거시 한글 행 호환) */
export function buildPlaceDbIdCandidates(location) {
  if (location == null) return [];
  if (typeof location === 'string') {
    const s = location.trim();
    return s ? [s] : [];
  }
  const out = new Set();
  const statsId = getPlaceStatsId(location);
  const stable = getPlaceStableKey(location);
  if (statsId) out.add(statsId);
  if (stable) out.add(stable);
  if (location.slug) out.add(String(location.slug).trim().toLowerCase());
  if (location.name_en) out.add(String(location.name_en).trim());
  return [...out].filter(Boolean);
}

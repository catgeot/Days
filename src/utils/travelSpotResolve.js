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

/** porto ⊂ portovecchio 같은 접두 부분 일치 오매칭 방지 */
function isAmbiguousPrefixFuzzyMatch(core, normalizedName) {
  if (!core || !normalizedName || core === normalizedName) return false;
  const longer = core.length >= normalizedName.length ? core : normalizedName;
  const shorter = core.length >= normalizedName.length ? normalizedName : core;
  if (shorter.length < 2 || !longer.startsWith(shorter)) return false;
  const next = longer[shorter.length];
  return Boolean(next && /[a-z0-9]/i.test(next));
}

/** nice ⊂ venice, 니스 ⊂ 베니스 — 짧은 잔여 접두와 함께하는 suffix contains 오매칭 방지 */
function isSpuriousSuffixContainsMatch(core, normalizedName) {
  if (!core || !normalizedName || core === normalizedName) return false;
  if (!normalizedName.includes(core)) return false;
  const idx = normalizedName.indexOf(core);
  if (idx === 0) return false;
  if (idx + core.length !== normalizedName.length) return false;
  const prefix = normalizedName.slice(0, idx);
  return prefix.length > 0 && prefix.length <= 2 && !/[-\s]/.test(prefix);
}

/** SSOT 직접 이름·slug·키워드 일치 — 상위 slug 별칭보다 우선 */
function findDirectSpotMatch(spots, placeId) {
  const core = normalizePlaceKey(
    String(placeId).replace(STRIP_SUFFIX_RE, '').replace(STRIP_INFIX_RE, '')
  );
  if (core.length < 2) return null;

  const candidates = spots.filter((s) => {
    const sn = normalizePlaceKey(s.name);
    const sen = normalizePlaceKey(s.name_en);
    const slug = normalizePlaceKey(s.slug);
    if (sn === core || sen === core || slug === core) return true;
    return (s.keywords || []).some((k) => normalizePlaceKey(k) === core);
  });

  return candidates.length === 1 ? candidates[0] : null;
}

function resolveFuzzy(spots, placeId) {
  const core = normalizePlaceKey(
    String(placeId).replace(STRIP_SUFFIX_RE, '').replace(STRIP_INFIX_RE, '')
  );
  if (core.length < 2) return null;

  const candidates = spots.filter((s) => {
    const sn = normalizePlaceKey(s.name);
    const sen = normalizePlaceKey(s.name_en);
    const exactKo = sn.length >= 2 && sn === core;
    const exactEn = sen.length >= 2 && sen === core;
    if (exactKo || exactEn) return true;

    const fuzzyKo =
      sn.length >= 2 &&
      (sn === core ||
        (sn.includes(core) && !isSpuriousSuffixContainsMatch(core, sn)) ||
        core.includes(sn));
    const fuzzyEn =
      sen.length >= 2 &&
      (sen === core ||
        (sen.includes(core) && !isSpuriousSuffixContainsMatch(core, sen)) ||
        core.includes(sen));
    if (fuzzyKo && isAmbiguousPrefixFuzzyMatch(core, sn)) return false;
    if (fuzzyEn && isAmbiguousPrefixFuzzyMatch(core, sen)) return false;
    return fuzzyKo || fuzzyEn;
  });

  if (candidates.length === 1) return { spot: candidates[0], matchKind: 'fuzzy' };
  return null;
}

export function resolveTravelSpotFromPlaceId(lookup, spots, placeId) {
  const raw = String(placeId ?? '').trim();
  if (!raw) return null;
  if (isBlocklistedPlaceId(raw)) return null;

  const direct = findDirectSpotMatch(spots, raw);
  if (direct) return { spot: direct, matchKind: 'lookup' };

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

function slugifyNameEn(nameEn) {
  return String(nameEn ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function spotSlug(spot) {
  if (!spot) return '';
  return spot.slug || slugifyNameEn(spot.name_en) || slugifyNameEn(spot.name) || String(spot.id ?? '');
}

function maxCoordKmForTier(tier) {
  const t = Number(tier) || 3;
  if (t <= 1) return 12;
  if (t === 2) return 22;
  return 45;
}

/** uiPlace Mapbox 라벨 — 갤러리·항공 arc formal slug (Tahaa↔bora-bora ~33km) */
export const UI_PLACE_GALLERY_REGION_MAX_KM = 50;

/** @param {typeof TRAVEL_SPOTS} [spots] */
export function resolveTravelSpotForUiPlaceRegion(lat, lng, spots = TRAVEL_SPOTS) {
  return resolveTravelSpotFromCoords(lat, lng, spots, UI_PLACE_GALLERY_REGION_MAX_KM);
}

/** "Yap (Ruul)" → ['Yap', 'Yap (Ruul)', 'Ruul'] — SSOT 본명(괄호 앞) 우선 */
export function extractSearchNameCandidates(query) {
  const trimmed = String(query ?? '').trim();
  if (!trimmed) return [];
  const paren = trimmed.match(/^(.+?)\s*[（(]([^)）]+)[)）]\s*$/);
  if (paren) {
    return [paren[1].trim(), trimmed, paren[2].trim()].filter(Boolean);
  }
  return [trimmed];
}

/** 검색어 → travelSpots SSOT (별칭·괄호 보조지명·fuzzy 포함) */
export function resolveTravelSpotFromSearchQuery(query) {
  const lookup = getSpotLookup();
  for (const candidate of extractSearchNameCandidates(query)) {
    const hit = resolveTravelSpotFromPlaceId(lookup, TRAVEL_SPOTS, candidate);
    if (hit?.spot) return hit.spot;
  }
  return null;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 좌표 근접 매칭 — loc-/search- URL·지오코딩 핀을 SSOT travelSpots/cities 행으로 연결 */
export function resolveTravelSpotFromCoords(lat, lng, spots = TRAVEL_SPOTS, maxKm = null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let best = null;
  let bestDist = Infinity;

  for (const s of spots) {
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;
    const d = distanceKm(lat, lng, s.lat, s.lng);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }

  if (!best) return null;
  const allowed = maxKm ?? maxCoordKmForTier(best.tier);
  return bestDist <= allowed ? best : null;
}

export function resolveTravelSpotFromLocation(location) {
  if (location == null) return null;
  if (typeof location === 'string') {
    return resolveTravelSpotFromPlaceId(getSpotLookup(), TRAVEL_SPOTS, location);
  }

  if (location.originalQuery) {
    const fromQuery = resolveTravelSpotFromSearchQuery(location.originalQuery);
    if (fromQuery) return { spot: fromQuery, matchKind: 'searchQuery' };
  }

  if (location.id != null && /^\d+$/.test(String(location.id))) {
    const byId = TRAVEL_SPOTS.find((s) => String(s.id) === String(location.id));
    if (byId) return { spot: byId, matchKind: 'id' };
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

  const { spot, matchKind } = resolved;
  // Mapbox·지오코딩 uiPlace — 이름·별칭·originalQuery는 SSOT 병합, 좌표-only 스냅은 유지 차단
  if (location.uiPlace && matchKind === 'coords') return location;

  const canonicalSlug = spotSlug(spot);
  const merged = {
    ...location,
    id: spot.id ?? location.id,
    canonical_slug: canonicalSlug,
    slug: canonicalSlug,
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

  if (location.uiPlace) delete merged.uiPlace;

  return merged;
}

/** 검색·지구본·URL 진입이 동일 SSOT 여행지인지 — slug/canonical_slug 기준 */
export function isSameCanonicalPlace(a, b) {
  if (a == null || b == null) return false;
  const keyA = getPlaceStableKey(mergeCanonicalTravelSpot(a));
  const keyB = getPlaceStableKey(mergeCanonicalTravelSpot(b));
  return Boolean(keyA && keyB && keyA === keyB);
}

/** 플래너·캐시용 안정 키 — canonical_slug 우선 (숫자 id·숫자 slug는 SSOT slug로 치환) */
export function getPlaceStableKey(location) {
  if (location == null) return '';
  if (typeof location === 'string') return location.trim();

  const merged = typeof location === 'object' ? mergeCanonicalTravelSpot(location) : location;
  let canonical = merged.canonical_slug ?? merged.slug;
  if (canonical && /^\d+$/.test(String(canonical).trim())) {
    const spot = TRAVEL_SPOTS.find((s) => String(s.id) === String(canonical).trim());
    if (spot) canonical = spotSlug(spot);
  }
  if (canonical && !/^\d+$/.test(String(canonical).trim())) {
    return String(canonical).trim().toLowerCase();
  }
  if (merged.id != null && /^\d+$/.test(String(merged.id))) {
    const spot = TRAVEL_SPOTS.find((s) => String(s.id) === String(merged.id));
    if (spot?.slug) return spotSlug(spot).toLowerCase();
  }
  return String(merged.name ?? merged.place_id ?? '').trim();
}

/** place_stats·place_wiki·place_videos·RPC용 — slug-first; 레거시 한글 행은 buildPlaceDbIdCandidates 폴백 */
export function getPlaceStatsId(location) {
  if (location == null) return '';
  if (typeof location === 'string') return location.trim();
  const stable = getPlaceStableKey(location);
  if (stable) return stable;
  return String(location.name ?? location.place_id ?? '').trim();
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
  const name = String(location.name ?? '').trim();
  if (statsId) out.add(statsId);
  if (stable && stable !== statsId) out.add(stable);
  if (name && name !== statsId) out.add(name);
  if (location.slug) out.add(String(location.slug).trim().toLowerCase());
  if (location.name_en) out.add(String(location.name_en).trim());
  if (location.canonical_slug) out.add(String(location.canonical_slug).trim().toLowerCase());
  const resolved = resolveTravelSpotFromLocation(location);
  if (resolved?.spot?.id != null) out.add(String(resolved.spot.id));
  if (location.id != null && /^\d+$/.test(String(location.id))) out.add(String(location.id));
  return [...out].filter(Boolean);
}

import { TRAVEL_SPOTS } from '../pages/Home/data/travelSpots.js';
import {
  TRAVEL_SPOT_PLACE_ID_ALIASES,
  TRAVEL_SPOT_PLACE_ID_BLOCKLIST,
} from '../../scripts/data/travel-spot-place-id-aliases.mjs';

const STRIP_SUFFIX_RE = /\s*(제도|국립공원|국립\s*공원|호수|섬|기지|시|군|주)\s*$/gi;
const STRIP_INFIX_RE = /\s*(제도|국립공원|국립\s*공원)\s*/gi;
/** 제주도→제주 등 — 공식명 히트일 때만 적용 (오 strip 방지) */
const STRIP_DO_SUFFIX_RE = /\s*도\s*$/u;

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
let cachedOfficialLookup = null;

/**
 * @param {typeof TRAVEL_SPOTS} [spots]
 * @param {{ includeKeywords?: boolean }} [opts] — Smart Search는 false (성산일출봉→제주 키워드 스냅 방지)
 */
export function buildSpotLookup(spots = TRAVEL_SPOTS, { includeKeywords = true } = {}) {
  const lookup = new Map();
  const bySlug = new Map(spots.map((s) => [s.slug, s]));

  // force=false: 이미 있으면 유지. force=true: 공식명·명시 별칭이 관문 keywords를 덮음
  const add = (key, spot, { force = false } = {}) => {
    if (key == null || key === '' || !spot) return;
    for (const v of placeIdVariants(key)) {
      const k = normalizePlaceKey(v) || String(v).trim();
      if (!k) continue;
      if (!force && lookup.has(k)) continue;
      lookup.set(k, spot);
    }
  };

  // 1) keywords (약) — 관문 도시의 목적지 키워드가 공식명보다 앞서면 안 됨
  if (includeKeywords) {
    for (const spot of spots) {
      for (const kw of spot.keywords || []) add(kw, spot);
    }
  }

  // 2) id·slug·공식 표시명
  for (const spot of spots) {
    add(spot.id, spot, { force: true });
    add(spot.slug, spot, { force: true });
    add(spot.name, spot, { force: true });
    add(spot.name_en, spot, { force: true });
  }

  // 3) 명시 별칭 — 최우선
  for (const [placeId, slug] of Object.entries(TRAVEL_SPOT_PLACE_ID_ALIASES)) {
    const spot = bySlug.get(slug);
    if (!spot) continue;
    for (const v of placeIdVariants(placeId)) add(v, spot, { force: true });
    add(placeId, spot, { force: true });
  }

  return lookup;
}

function getSpotLookup() {
  if (!cachedLookup) cachedLookup = buildSpotLookup(TRAVEL_SPOTS);
  return cachedLookup;
}

function getOfficialSpotLookup() {
  if (!cachedOfficialLookup) {
    cachedOfficialLookup = buildSpotLookup(TRAVEL_SPOTS, { includeKeywords: false });
  }
  return cachedOfficialLookup;
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

/** 공식 name / name_en / slug 정확 일치만 (keywords·fuzzy 제외) */
function findOfficialDirectSpotMatch(spots, placeId) {
  const core = normalizePlaceKey(
    String(placeId).replace(STRIP_SUFFIX_RE, '').replace(STRIP_INFIX_RE, '')
  );
  if (core.length < 2) return null;

  const candidates = spots.filter((s) => {
    const sn = normalizePlaceKey(s.name);
    const sen = normalizePlaceKey(s.name_en);
    const slug = normalizePlaceKey(s.slug);
    return sn === core || sen === core || slug === core;
  });

  return candidates.length === 1 ? candidates[0] : null;
}

function lookupOfficialSpot(lookup, placeId) {
  const raw = String(placeId ?? '').trim();
  if (!raw) return null;
  for (const v of placeIdVariants(raw)) {
    const hit = lookup.get(normalizePlaceKey(v)) || lookup.get(v.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

/**
 * Smart Search → SSOT.
 * 공식명·slug·별칭(+접미사 strip)만. keyword·fuzzy containment 금지
 * (제주 신라호텔→제주, 성산일출봉→제주 keywords 스냅 방지 → Mapbox uiPlace).
 */
export function resolveTravelSpotFromSearchQuery(query) {
  const lookup = getOfficialSpotLookup();

  const tryOfficial = (candidate) => {
    if (!candidate || isBlocklistedPlaceId(candidate)) return null;
    const direct = findOfficialDirectSpotMatch(TRAVEL_SPOTS, candidate);
    if (direct) return direct;
    const fromLookup = lookupOfficialSpot(lookup, candidate);
    if (fromLookup) return fromLookup;

    // 제주도 → 제주: trailing 「도」는 공식 히트일 때만
    const doStripped = String(candidate).trim().replace(STRIP_DO_SUFFIX_RE, '').trim();
    if (doStripped && doStripped !== String(candidate).trim() && doStripped.length >= 2) {
      const directDo = findOfficialDirectSpotMatch(TRAVEL_SPOTS, doStripped);
      if (directDo) return directDo;
      const lookupDo = lookupOfficialSpot(lookup, doStripped);
      if (lookupDo) return lookupDo;
    }
    return null;
  };

  for (const candidate of extractSearchNameCandidates(query)) {
    const hit = tryOfficial(candidate);
    if (hit) return hit;
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

  // slug를 name보다 먼저 — GeoJSON 히트·부분 이름 fuzzy 오매칭 방지
  const keys = [
    location.canonical_slug,
    location.slug,
    location.place_id,
    location.placeId,
    location.name_en,
    location.name,
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

/** 장소카드 UI fallback(Global) / 지오코딩 기본값(Explore) 등 — 실국가명 아님 */
export function isPlaceholderCountry(country) {
  const c = String(country ?? '').trim().toLowerCase();
  return !c || c === 'explore' || c === 'global' || c === 'searching' || c === 'searching...';
}

function preferConcreteCountry(primary, fallback) {
  if (!isPlaceholderCountry(primary)) return primary;
  if (!isPlaceholderCountry(fallback)) return fallback;
  return primary || fallback || '';
}

/**
 * saved_trips.curation_data에만 남은 국가·slug를 상위 필드로 승격.
 * (마커 GeoJSON·재클릭 시 country 공백 → Explore/Global 재발 방지)
 */
export function liftCurationCountryFields(location) {
  if (!location || typeof location !== 'object') return location;
  const meta = location.curation_data;
  if (!meta || typeof meta !== 'object') return location;

  return {
    ...location,
    country: preferConcreteCountry(location.country, meta.country),
    country_en: preferConcreteCountry(location.country_en, meta.country_en),
    slug: location.slug || meta.slug || location.slug,
    name_en: location.name_en || meta.locationEn || location.name_en,
    galleryRegionSpot: location.galleryRegionSpot || meta.galleryRegionSpot,
  };
}

/**
 * 구버전 세션 캐시·임시 핀에 남은 Explore/Global/빈 국가명을 SSOT로 복구.
 * 표시명·좌표는 유지하고 country·galleryRegionSpot만 보강할 수 있음.
 */
export function healPlaceholderCountry(location, spots = TRAVEL_SPOTS) {
  if (!location || typeof location !== 'object') return location;

  const lifted = liftCurationCountryFields(location);
  const merged = mergeCanonicalTravelSpot(lifted);
  if (!isPlaceholderCountry(merged.country) && !isPlaceholderCountry(merged.country_en)) {
    return merged;
  }

  const lat = Number(merged.lat);
  const lng = Number(merged.lng);
  const nearby = resolveTravelSpotFromCoords(lat, lng, spots);
  if (!nearby?.country && !nearby?.country_en) return merged;

  return {
    ...merged,
    country: preferConcreteCountry(merged.country, nearby.country),
    country_en: preferConcreteCountry(merged.country_en, nearby.country_en),
    galleryRegionSpot: merged.galleryRegionSpot || {
      slug: nearby.slug,
      name: nearby.name,
      name_en: nearby.name_en,
    },
  };
}

/** uiPlace soft-merge — 표시명·좌표·uiPlace 유지, placeholder 국가만 보강 */
function softMergeUiPlaceCountry(location, spot) {
  const needsCountry =
    isPlaceholderCountry(location.country) || isPlaceholderCountry(location.country_en);
  if (!needsCountry) return location;
  return {
    ...location,
    country: preferConcreteCountry(location.country, spot.country),
    country_en: preferConcreteCountry(location.country_en, spot.country_en),
    galleryRegionSpot: location.galleryRegionSpot || {
      slug: spot.slug,
      name: spot.name,
      name_en: spot.name_en,
    },
  };
}

/** 검색·핀·지오코딩 location을 SSOT travelSpots 행으로 병합 */
export function mergeCanonicalTravelSpot(location) {
  if (!location || typeof location !== 'object') return location;

  // Free-explore uiPlace — 표시명·좌표·uiPlace 유지.
  // name_en=서귀포시·keywords=성산일출봉 등으로 SSOT 풀머지하면 서귀포/제주 카드로 바뀜 → 금지.
  if (location.uiPlace) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    const nearby = resolveTravelSpotFromCoords(lat, lng, TRAVEL_SPOTS, UI_PLACE_GALLERY_REGION_MAX_KM);
    if (!nearby) return location;
    return softMergeUiPlaceCountry(location, nearby);
  }

  const resolved = resolveTravelSpotFromLocation(location);
  if (!resolved?.spot) return location;

  const { spot } = resolved;

  const canonicalSlug = spotSlug(spot);
  const merged = {
    ...location,
    id: spot.id ?? location.id,
    canonical_slug: canonicalSlug,
    slug: canonicalSlug,
    name: spot.name,
    name_en: spot.name_en ?? location.name_en,
    name_ko: spot.name_ko ?? spot.name,
    country: preferConcreteCountry(spot.country, location.country),
    country_en: preferConcreteCountry(spot.country_en, location.country_en),
    category: spot.category ?? spot.primaryCategory ?? location.category,
    // 큐레이션 연결 desc·curationSummary는 location 우선 (고정 SSOT가 덮어쓰지 않음)
    desc: location.desc || spot.desc,
    curationSummary: location.curationSummary || location.curation_summary,
    keywords: spot.keywords ?? location.keywords,
    lat: spot.lat ?? location.lat,
    lng: spot.lng ?? location.lng,
    tier: spot.tier ?? location.tier,
    continent: spot.continent ?? location.continent,
  };

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
  // uiPlace soft-merge 등으로 location.slug가 비어도 SSOT slug는 반드시 후보에 포함
  // (place_wiki 등은 slug 행에 매거진이 있는데 한글/숫자 id만 조회하면 빈 탭이 됨)
  const resolved = resolveTravelSpotFromLocation(location);
  if (resolved?.spot) {
    const spot = resolved.spot;
    const resolvedSlug = spotSlug(spot);
    if (resolvedSlug) out.add(String(resolvedSlug).trim().toLowerCase());
    if (spot.name) out.add(String(spot.name).trim());
    if (spot.name_en) out.add(String(spot.name_en).trim());
    if (spot.id != null) out.add(String(spot.id));
  }
  if (location.id != null && /^\d+$/.test(String(location.id))) out.add(String(location.id));
  return [...out].filter(Boolean);
}

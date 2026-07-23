/**
 * 도시 허브 → 명소 큐레이션 SSOT.
 * Mapbox Search Box 보강 전에 품질 앵커로 사용.
 */
import hubsJson from '../data/cityAttractionHubs.json' with { type: 'json' };

const KIND_LABELS = {
  beach: '해변',
  market: '시장',
  temple: '사찰',
  shrine: '신사',
  viewpoint: '전망',
  landmark: '명소',
  museum: '박물관',
  neighborhood: '동네',
  park: '공원',
};

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

/** getPlaceUrlParam / formatUrlName과 동일 kebab — travelSpots 의존 없이 로컬 유지 */
const toUrlSlug = (nameEn) => {
  if (!nameEn) return '';
  return String(nameEn)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/** /place/:slug 용 — kebab(URL) + compact(레거시 normalizeKey) 모두 수용 */
export function placeSlugVariants(...names) {
  const out = new Set();
  for (const name of names) {
    if (!name) continue;
    const kebab = toUrlSlug(name);
    const compact = normalizeKey(name);
    if (kebab) out.add(kebab);
    if (compact) out.add(compact);
  }
  return out;
}

/** 명소·정착지 핀 slug — getPlaceUrlParam과 동일한 kebab 형식 */
export function placeUrlSlug(nameEn, name) {
  return toUrlSlug(nameEn || name) || normalizeKey(nameEn || name) || '';
}

const HUBS = Array.isArray(hubsJson) ? hubsJson : [];

/** @type {Map<string, object>} */
const hubByKey = new Map();
/** @type {Map<string, { hub: object, attraction: object }>} */
const attractionByKey = new Map();
/** @type {Map<string, object>} /place/:slug → hub pin */
const hubByPlaceSlug = new Map();
/** @type {Map<string, { hub: object, attraction: object }>} /place/:slug → attraction */
const attractionByPlaceSlug = new Map();

for (const hub of HUBS) {
  const keys = [hub.name, hub.name_en, hub.hubId, ...(hub.aliases || [])];
  for (const k of keys) {
    const nk = normalizeKey(k);
    if (nk) hubByKey.set(nk, hub);
  }
  const hubSlugKeys = placeSlugVariants(hub.name_en, hub.name, hub.hubId, ...(hub.aliases || []));
  if (hub.hubId) hubSlugKeys.add(String(hub.hubId).toLowerCase());
  for (const sk of hubSlugKeys) {
    if (sk && !hubByPlaceSlug.has(sk)) hubByPlaceSlug.set(sk, hub);
  }
  for (const attraction of hub.attractions || []) {
    for (const k of [attraction.name, attraction.name_en]) {
      const nk = normalizeKey(k);
      if (nk && !attractionByKey.has(nk)) {
        attractionByKey.set(nk, { hub, attraction });
      }
    }
    for (const sk of placeSlugVariants(attraction.name_en, attraction.name)) {
      if (sk && !attractionByPlaceSlug.has(sk)) {
        attractionByPlaceSlug.set(sk, { hub, attraction });
      }
    }
  }
}

export function getKindLabel(kind) {
  return KIND_LABELS[kind] || '명소';
}

export function listCityAttractionHubs() {
  return HUBS;
}

/**
 * 공식명·alias exact 매칭만 (부분 포함 스냅 금지).
 * @param {string} query
 */
export function resolveCityAttractionHub(query) {
  const key = normalizeKey(query);
  if (!key) return null;
  return hubByKey.get(key) || null;
}

/**
 * 명소 exact 매칭 (낙산사, 에펠탑 등).
 * @param {string} query
 */
export function resolveHubAttraction(query) {
  const key = normalizeKey(query);
  if (!key) return null;
  return attractionByKey.get(key) || null;
}

/**
 * 타이핑 prefix — hub name/alias 또는 명소명 시작.
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 */
export function matchCityAttractionHubsPrefix(query, { limit = 8 } = {}) {
  const key = normalizeKey(query);
  if (!key || key.length < 1) return { hubs: [], attractions: [] };

  const hubHits = [];
  const seenHub = new Set();
  for (const hub of HUBS) {
    const keys = [hub.name, hub.name_en, hub.hubId, ...(hub.aliases || [])];
    const hit = keys.some((k) => normalizeKey(k).startsWith(key));
    if (hit && !seenHub.has(hub.hubId)) {
      seenHub.add(hub.hubId);
      hubHits.push(hub);
    }
  }

  const attractionHits = [];
  for (const hub of HUBS) {
    for (const attraction of hub.attractions || []) {
      const names = [attraction.name, attraction.name_en].filter(Boolean);
      if (names.some((n) => normalizeKey(n).startsWith(key) || normalizeKey(n).includes(key))) {
        attractionHits.push({ hub, attraction });
      }
    }
  }

  return { hubs: hubHits.slice(0, limit), attractions: attractionHits.slice(0, limit) };
}

export function hubToSuggestion(hub) {
  return {
    id: `hub-${hub.hubId}`,
    kind: 'city',
    badge: '도시',
    name: hub.name,
    name_en: hub.name_en || hub.name,
    country: hub.country || 'Explore',
    country_en: hub.country_en || 'Explore',
    lat: hub.lat,
    lng: hub.lng,
    slug: hub.hubId,
    hubId: hub.hubId,
    source: 'hub',
    uiPlace: true,
    desc: `${hub.name}의 명소·명물을 둘러보세요.`,
  };
}

export function attractionToSuggestion(hub, attraction) {
  const kindLabel = getKindLabel(attraction.kind);
  return {
    id: `hub-attr-${hub.hubId}-${normalizeKey(attraction.name)}`,
    kind: 'attraction',
    badge: kindLabel,
    name: attraction.name,
    name_en: attraction.name_en || attraction.name,
    country: hub.country || 'Explore',
    country_en: hub.country_en || 'Explore',
    lat: attraction.lat ?? hub.lat,
    lng: attraction.lng ?? hub.lng,
    slug: placeUrlSlug(attraction.name_en, attraction.name),
    hubId: hub.hubId,
    attractionKind: attraction.kind,
    source: 'hub',
    uiPlace: true,
    parentCity: hub.name,
    desc: `${hub.name} · ${kindLabel}`,
  };
}

export function hubToPlacePin(hub) {
  return {
    id: `hub-${hub.hubId}`,
    slug: hub.hubId,
    name: hub.name,
    name_en: hub.name_en || hub.name,
    name_ko: hub.name,
    country: hub.country || 'Explore',
    country_en: hub.country_en || 'Explore',
    lat: hub.lat,
    lng: hub.lng,
    type: 'temp-base',
    uiPlace: true,
    hubId: hub.hubId,
    desc: `${hub.name} (${hub.country || 'Explore'}) 지역을 탐색합니다.`,
  };
}

export function attractionToPlacePin(hub, attraction) {
  const kindLabel = getKindLabel(attraction.kind);
  return {
    id: `hub-attr-${hub.hubId}-${normalizeKey(attraction.name)}`,
    slug: placeUrlSlug(attraction.name_en, attraction.name),
    name: attraction.name,
    name_en: attraction.name_en || attraction.name,
    name_ko: attraction.name,
    country: hub.country || 'Explore',
    country_en: hub.country_en || 'Explore',
    lat: attraction.lat ?? hub.lat,
    lng: attraction.lng ?? hub.lng,
    type: 'temp-base',
    uiPlace: true,
    hubId: hub.hubId,
    parentCity: hub.name,
    desc: `${hub.name}의 ${kindLabel} · ${attraction.name}`,
  };
}

/**
 * /place/:slug 새로고침 hydrate — TRAVEL_SPOTS/cities 미등록 hub·명소.
 * @param {string} slug
 * @returns {object|null} place pin
 */
export function resolveHubPlaceFromSlug(slug) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return null;

  const attractionHit = attractionByPlaceSlug.get(normalized);
  if (attractionHit) {
    return attractionToPlacePin(attractionHit.hub, attractionHit.attraction);
  }

  const hub = hubByPlaceSlug.get(normalized);
  if (hub) return hubToPlacePin(hub);

  return null;
}

/**
 * Enter 시 도시 허브 선택 카드용 후보 (도시 + 명소).
 * @param {object} hub
 * @param {object[]} [extraAttractions] — Mapbox 보강분
 */
export function buildHubDisambiguationCandidates(hub, extraAttractions = []) {
  const candidates = [hubToSuggestion(hub)];
  const seen = new Set([normalizeKey(hub.name)]);

  for (const attraction of hub.attractions || []) {
    const k = normalizeKey(attraction.name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    candidates.push(attractionToSuggestion(hub, attraction));
  }

  for (const extra of extraAttractions) {
    const k = normalizeKey(extra.name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    candidates.push({
      ...extra,
      kind: extra.kind || 'attraction',
      badge: extra.badge || getKindLabel(extra.attractionKind || extra.kind) || '명소',
      hubId: hub.hubId,
      parentCity: hub.name,
      source: extra.source || 'mapbox',
      uiPlace: true,
    });
  }

  return candidates;
}

export function isSearchDisambiguation(result) {
  return Boolean(result && result.__disambiguation === true && Array.isArray(result.candidates));
}

export function makeDisambiguationResult(query, candidates, { title } = {}) {
  return {
    __disambiguation: true,
    query: String(query || '').trim(),
    title: title || `'${query}' 검색 결과 — 원하는 장소를 선택하세요`,
    candidates: candidates.filter(Boolean),
  };
}

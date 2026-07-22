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

const HUBS = Array.isArray(hubsJson) ? hubsJson : [];

/** @type {Map<string, object>} */
const hubByKey = new Map();
/** @type {Map<string, { hub: object, attraction: object }>} */
const attractionByKey = new Map();

for (const hub of HUBS) {
  const keys = [hub.name, hub.name_en, hub.hubId, ...(hub.aliases || [])];
  for (const k of keys) {
    const nk = normalizeKey(k);
    if (nk) hubByKey.set(nk, hub);
  }
  for (const attraction of hub.attractions || []) {
    for (const k of [attraction.name, attraction.name_en]) {
      const nk = normalizeKey(k);
      if (nk && !attractionByKey.has(nk)) {
        attractionByKey.set(nk, { hub, attraction });
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
    slug: normalizeKey(attraction.name_en || attraction.name),
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

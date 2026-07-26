/**
 * 카테고리 면별 나라 목록 — 권역(지리) 구분용.
 * 카테고리 라벨(휴양·자연 등)은 지구본 5면 UX일 뿐, 테마 여행지 필터가 아님.
 * 예: paradise 면 = 한국 중심 아시아·남태평양 권역 나라.
 */

import { GLOBE_CATEGORY_IDS, GLOBE_FACE_CENTER_BY_CATEGORY } from './globeCategoryFocus.js';
import {
  GLOBE_COUNTRY_CATALOG,
  getGlobeCountryById,
  resolveGlobeCountryIdFromLabel,
} from './globeCountryCatalog.js';
import { TRAVEL_SPOTS } from '../data/travelSpots.js';

/**
 * 면별 상단 우선 시드 — 해당 권역에서 먼저 보여줄 나라.
 * 스팟·테마와 무관.
 */
export const GLOBE_FACE_PRIORITY = {
  /** 한국 중심 아시아·남태평양 */
  paradise: ['kr', 'jp', 'tw', 'cn', 'th', 'vn', 'ph', 'id', 'my', 'sg', 'kh', 'au', 'nz', 'mv'],
  /** 아프리카·인도양 */
  nature: ['ke', 'tz', 'za', 'ma', 'eg', 'na', 'mg', 'et', 'zm', 'mu', 'sc'],
  /** 유럽 */
  urban: ['no', 'fr', 'gb', 'it', 'es', 'de', 'nl', 'cz', 'pt', 'gr', 'ch', 'hr', 'is', 'tr'],
  /** 북미·중미·카리브 */
  culture: ['us', 'ca', 'mx', 'cu', 'cr', 'gt', 'pa', 'jm', 'bs'],
  /** 남미 */
  adventure: ['br', 'pe', 'ar', 'cl', 'co', 'ec', 'bo', 'py'],
};

/** @deprecated 하위 호환 — 면별 조립 결과 캐시 아님, getter 사용 */
export const GLOBE_FACE_REGIONS = new Proxy(
  {},
  {
    get(_t, prop) {
      if (typeof prop !== 'string') return undefined;
      if (!GLOBE_CATEGORY_IDS.includes(prop)) return undefined;
      return getFaceRegionsForCategory(prop);
    },
    ownKeys() {
      return [...GLOBE_CATEGORY_IDS];
    },
    getOwnPropertyDescriptor(_t, prop) {
      if (typeof prop === 'string' && GLOBE_CATEGORY_IDS.includes(prop)) {
        return { enumerable: true, configurable: true, value: getFaceRegionsForCategory(prop) };
      }
      return undefined;
    },
  },
);

/** 국가 단위 “평면 느낌” 기본 줌 — 지역별 zoom이 없을 때 */
export const GLOBE_FACE_REGION_DEFAULT_ZOOM = 4.2;

export const GLOBE_FACE_REGION_FLY_MS = 1800;

/** fitBounds 시 도시 지명 노출을 위한 상한 — 작은 섬 과확대 방지 */
export const GLOBE_FACE_REGION_MAX_ZOOM = 6.4;

/** @type {Map<string, { globe: number, count: number, maxPop: number }> | null} */
let spotCountryStatsCache = null;

/** @type {Map<string, string> | null} countryId → nearest face category */
let homeFaceByCountryCache = null;

function buildSpotCountryStats() {
  if (spotCountryStatsCache) return spotCountryStatsCache;
  const map = new Map();
  for (const spot of TRAVEL_SPOTS) {
    const id = resolveGlobeCountryIdFromLabel(spot.country);
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, { globe: 0, count: 0, maxPop: 0 });
    }
    const e = map.get(id);
    e.count += 1;
    if (spot.showOnGlobe) e.globe += 1;
    e.maxPop = Math.max(e.maxPop, Number(spot.popularity) || 0);
  }
  spotCountryStatsCache = map;
  return map;
}

/**
 * 권역 앵커 — 카테고리 면 중심 + 휴양 면은 아시아·남태평양 추가 앵커.
 * (라벨이 휴양이어도 테마가 아니라 지리 권역)
 */
const FACE_REGION_ANCHORS = {
  paradise: [
    GLOBE_FACE_CENTER_BY_CATEGORY.paradise, // 서울
    { lat: 15.0, lng: 105.0 }, // 동남아
    { lat: 20.0, lng: 78.0 }, // 남아시아
    { lat: -18.0, lng: 178.0 }, // 남태평양(오세아니아)
    { lat: -17.0, lng: -149.0 }, // 남태평양(폴리네시아)
  ],
  nature: [
    GLOBE_FACE_CENTER_BY_CATEGORY.nature,
    { lat: -10.0, lng: 45.0 }, // 서인도양(아프리카 측)
  ],
  urban: [GLOBE_FACE_CENTER_BY_CATEGORY.urban],
  culture: [GLOBE_FACE_CENTER_BY_CATEGORY.culture],
  adventure: [GLOBE_FACE_CENTER_BY_CATEGORY.adventure],
};

function distanceToAnchor(lat, lng, anchor) {
  const dLat = lat - anchor.lat;
  const dLngAbs = Math.abs(lng - anchor.lng);
  const dLng = Math.min(dLngAbs, 360 - dLngAbs);
  return Math.hypot(dLat, dLng);
}

/** 면 권역과의 대략 거리 (복수 앵커면 최소값) */
export function faceAffinityDistance(id, category) {
  const region = GLOBE_COUNTRY_CATALOG[id];
  const anchors = FACE_REGION_ANCHORS[category];
  if (!region || !anchors?.length) return 999;
  let best = Infinity;
  for (const anchor of anchors) {
    const d = distanceToAnchor(region.lat, region.lng, anchor);
    if (d < best) best = d;
  }
  return best;
}

/** 각 나라 → 가장 가까운 지구본 면(권역) */
function buildHomeFaceByCountry() {
  if (homeFaceByCountryCache) return homeFaceByCountryCache;
  const map = new Map();
  for (const id of Object.keys(GLOBE_COUNTRY_CATALOG)) {
    let best = GLOBE_CATEGORY_IDS[0];
    let bestDist = Infinity;
    for (const cat of GLOBE_CATEGORY_IDS) {
      const d = faceAffinityDistance(id, cat);
      if (d < bestDist) {
        bestDist = d;
        best = cat;
      }
    }
    map.set(id, best);
  }
  homeFaceByCountryCache = map;
  return map;
}

function compareByAffinityThenPopularity(aId, bId, category, stats) {
  const aDist = faceAffinityDistance(aId, category);
  const bDist = faceAffinityDistance(bId, category);
  if (aDist !== bDist) return aDist - bDist;

  const a = stats.get(aId) || { globe: 0, count: 0, maxPop: 0 };
  const b = stats.get(bId) || { globe: 0, count: 0, maxPop: 0 };
  if (b.globe !== a.globe) return b.globe - a.globe;
  if (b.count !== a.count) return b.count - a.count;
  if (b.maxPop !== a.maxPop) return b.maxPop - a.maxPop;

  const aLabel = GLOBE_COUNTRY_CATALOG[aId]?.labelKo || aId;
  const bLabel = GLOBE_COUNTRY_CATALOG[bId]?.labelKo || bId;
  return aLabel.localeCompare(bLabel, 'ko');
}

/**
 * 대략적 화면 맞춤 줌 추정 (WebMercator · 정사각 가정).
 * @param {[number, number, number, number]} bbox
 * @param {{ width?: number, height?: number }} [viewport]
 */
export function estimateZoomForBbox(bbox, viewport = {}) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return GLOBE_FACE_REGION_DEFAULT_ZOOM;
  const [west, south, east, north] = bbox;
  if (![west, south, east, north].every((n) => Number.isFinite(n))) {
    return GLOBE_FACE_REGION_DEFAULT_ZOOM;
  }
  const width = Math.max(Number(viewport.width) || 1200, 320);
  const height = Math.max(Number(viewport.height) || 800, 320);
  const lngSpan = Math.max(Math.abs(east - west), 0.05);
  const latSpan = Math.max(Math.abs(north - south), 0.05);
  const zoomX = Math.log2((360 * (width / 256)) / lngSpan);
  const zoomY = Math.log2((180 * (height / 256)) / latSpan);
  return Math.min(zoomX, zoomY) - 0.35;
}

/**
 * 카메라용 bounds — hubBbox(큐레이션 권역) 우선, 없으면 국토 bbox.
 * 하이라이트는 항상 region.bbox(국토).
 * @param {import('./globeCountryCatalog.js').GlobeFaceRegion | { bbox?: number[], hubBbox?: number[] }} region
 * @param {{ width?: number, height?: number }} [viewport]
 * @returns {{ bounds: [number, number, number, number] | null, maxZoom: number, usedHub: boolean }}
 */
export function resolveFaceRegionCameraBounds(region, viewport = {}) {
  const countryBbox = region?.bbox;
  const hubBbox = region?.hubBbox;
  const maxZoom = GLOBE_FACE_REGION_MAX_ZOOM;

  if (Array.isArray(hubBbox) && hubBbox.length === 4) {
    return { bounds: hubBbox, maxZoom, usedHub: true };
  }

  if (Array.isArray(countryBbox) && countryBbox.length === 4) {
    return { bounds: countryBbox, maxZoom, usedHub: false };
  }

  return { bounds: null, maxZoom, usedHub: false };
}

/**
 * 시드(권역 우선) → 같은 권역 나라 → 타 권역 스캔 테일
 * @param {string | null | undefined} category
 */
export function getFaceRegionsForCategory(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];

  const stats = buildSpotCountryStats();
  const homeFace = buildHomeFaceByCountry();
  const seen = new Set();
  const out = [];

  const pushId = (id) => {
    if (!id || seen.has(id)) return;
    const region = getGlobeCountryById(id);
    if (!region) return;
    seen.add(id);
    out.push(region);
  };

  for (const id of GLOBE_FACE_PRIORITY[category] || []) {
    pushId(id);
  }

  const regionIds = [];
  for (const id of Object.keys(GLOBE_COUNTRY_CATALOG)) {
    if (seen.has(id)) continue;
    if (homeFace.get(id) === category) regionIds.push(id);
  }
  regionIds.sort((a, b) => compareByAffinityThenPopularity(a, b, category, stats));
  for (const id of regionIds) pushId(id);

  const scanIds = Object.keys(GLOBE_COUNTRY_CATALOG).filter((id) => !seen.has(id));
  scanIds.sort((a, b) => compareByAffinityThenPopularity(a, b, category, stats));
  for (const id of scanIds) pushId(id);

  return out;
}

/**
 * @param {string | null | undefined} category
 * @param {string | null | undefined} regionId
 */
export function getFaceRegionById(category, regionId) {
  if (!regionId) return null;
  const fromList = getFaceRegionsForCategory(category).find((r) => r.id === regionId);
  if (fromList) return fromList;
  return getGlobeCountryById(regionId);
}

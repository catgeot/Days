/** 카테고리 면별 나라/지역 — 우선 시드 + 테마 스팟 + 스캔 테일 */

import { GLOBE_CATEGORY_IDS, spotMatchesCategory } from './globeCategoryFocus.js';
import {
  GLOBE_COUNTRY_CATALOG,
  getGlobeCountryById,
  resolveGlobeCountryIdFromLabel,
} from './globeCountryCatalog.js';
import { TRAVEL_SPOTS } from '../data/travelSpots.js';

/**
 * 면별 상단 우선 시드 — 테마·권역 추천 순서.
 * 스팟 유무와 무관하게 항상 상단 고정.
 */
export const GLOBE_FACE_PRIORITY = {
  paradise: ['kr', 'jp', 'tw', 'th', 'vn', 'id', 'ph', 'my', 'au', 'nz', 'sg', 'kh', 'cn', 'mv'],
  nature: ['ke', 'tz', 'za', 'ma', 'eg', 'na', 'mg', 'et', 'zm', 'mu', 'sc'],
  urban: ['no', 'fr', 'gb', 'it', 'es', 'de', 'nl', 'cz', 'pt', 'gr', 'ch', 'hr', 'is', 'tr'],
  culture: ['us', 'ca', 'mx', 'cu', 'cr', 'gt', 'pa', 'jm', 'bs'],
  adventure: ['br', 'pe', 'ar', 'cl', 'co', 'ec', 'bo', 'py', 'np'],
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

/** @type {Map<string, { globe: number, count: number, maxPop: number, categories: Set<string> }> | null} */
let spotCountryStatsCache = null;

function buildSpotCountryStats() {
  if (spotCountryStatsCache) return spotCountryStatsCache;
  const map = new Map();
  for (const spot of TRAVEL_SPOTS) {
    const id = resolveGlobeCountryIdFromLabel(spot.country);
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, { globe: 0, count: 0, maxPop: 0, categories: new Set() });
    }
    const e = map.get(id);
    e.count += 1;
    if (spot.showOnGlobe) e.globe += 1;
    e.maxPop = Math.max(e.maxPop, Number(spot.popularity) || 0);
    for (const cat of GLOBE_CATEGORY_IDS) {
      if (spotMatchesCategory(spot, cat)) e.categories.add(cat);
    }
  }
  spotCountryStatsCache = map;
  return map;
}

function compareThemeTail(aId, bId, stats) {
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
 * @param {GlobeFaceRegion} region
 * @param {{ width?: number, height?: number }} [viewport]
 * @returns {{ bounds: [number, number, number, number], maxZoom: number, usedHub: boolean }}
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
 * 시드 → 테마 스팟 나라 → 카탈로그 스캔 테일
 * @param {string | null | undefined} category
 * @returns {GlobeFaceRegion[]}
 */
export function getFaceRegionsForCategory(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];

  const stats = buildSpotCountryStats();
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

  const themeIds = [];
  for (const [id, e] of stats) {
    if (seen.has(id)) continue;
    if (e.categories.has(category)) themeIds.push(id);
  }
  themeIds.sort((a, b) => compareThemeTail(a, b, stats));
  for (const id of themeIds) pushId(id);

  const scanIds = Object.keys(GLOBE_COUNTRY_CATALOG).filter((id) => !seen.has(id));
  scanIds.sort((a, b) => compareThemeTail(a, b, stats));
  for (const id of scanIds) pushId(id);

  return out;
}

/**
 * @param {string | null | undefined} category
 * @param {string | null | undefined} regionId
 * @returns {GlobeFaceRegion | null}
 */
export function getFaceRegionById(category, regionId) {
  if (!regionId) return null;
  const fromList = getFaceRegionsForCategory(category).find((r) => r.id === regionId);
  if (fromList) return fromList;
  return getGlobeCountryById(regionId);
}

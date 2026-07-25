/** 카테고리 면별 나라/지역 큐레이션 SSOT — 클릭 시 국가 단위 fitBounds / flyTo */

import { GLOBE_CATEGORY_IDS } from './globeCategoryFocus.js';

/**
 * @typedef {{
 *   id: string,
 *   labelKo: string,
 *   iso: string,
 *   lat: number,
 *   lng: number,
 *   zoom: number,
 *   bbox: [number, number, number, number],
 *   hubBbox?: [number, number, number, number],
 * }} GlobeFaceRegion
 */

/** 작·중형: 국토 bbox · 대형/열도: hubBbox로 지명(≥4) 권역, bbox는 하이라이트용 */
export const GLOBE_FACE_REGIONS = {
  paradise: [
    { id: 'kr', labelKo: '한국', iso: 'KR', lat: 36.5, lng: 127.8, zoom: 5.4, bbox: [124.5, 33.0, 132.0, 43.1] },
    { id: 'jp', labelKo: '일본', iso: 'JP', lat: 36.2, lng: 138.2, zoom: 4.6, bbox: [129.0, 30.9, 146.0, 45.6] },
    { id: 'tw', labelKo: '대만', iso: 'TW', lat: 23.7, lng: 121.0, zoom: 5.8, bbox: [119.3, 21.8, 122.1, 25.4] },
    { id: 'th', labelKo: '태국', iso: 'TH', lat: 15.5, lng: 101.0, zoom: 4.8, bbox: [97.3, 5.6, 105.7, 20.5] },
    { id: 'vn', labelKo: '베트남', iso: 'VN', lat: 16.0, lng: 107.5, zoom: 4.8, bbox: [102.1, 8.3, 109.5, 23.4] },
    {
      id: 'id',
      labelKo: '인도네시아',
      iso: 'ID',
      lat: -2.5,
      lng: 118.0,
      zoom: 3.6,
      bbox: [95.0, -11.1, 141.0, 6.1],
      hubBbox: [104.0, -9.0, 116.5, 6.0],
    },
    { id: 'ph', labelKo: '필리핀', iso: 'PH', lat: 12.0, lng: 122.0, zoom: 4.6, bbox: [116.9, 4.6, 126.7, 21.1] },
    { id: 'my', labelKo: '말레이시아', iso: 'MY', lat: 4.0, lng: 109.5, zoom: 4.6, bbox: [99.6, 0.8, 119.4, 7.5] },
    {
      id: 'au',
      labelKo: '호주',
      iso: 'AU',
      lat: -25.0,
      lng: 134.0,
      zoom: 3.4,
      bbox: [112.9, -43.7, 153.7, -10.0],
      hubBbox: [140.0, -39.2, 153.7, -10.5],
    },
  ],
  nature: [
    { id: 'ke', labelKo: '케냐', iso: 'KE', lat: 0.5, lng: 37.9, zoom: 5.0, bbox: [33.9, -4.7, 41.9, 5.5] },
    { id: 'tz', labelKo: '탄자니아', iso: 'TZ', lat: -6.4, lng: 34.9, zoom: 5.0, bbox: [29.3, -11.8, 40.5, -0.95] },
    { id: 'za', labelKo: '남아프리카', iso: 'ZA', lat: -30.5, lng: 25.0, zoom: 4.2, bbox: [16.3, -34.8, 32.9, -22.1] },
    { id: 'ma', labelKo: '모로코', iso: 'MA', lat: 31.8, lng: -7.1, zoom: 5.0, bbox: [-17.3, 21.3, -0.99, 35.9] },
    { id: 'eg', labelKo: '이집트', iso: 'EG', lat: 26.8, lng: 30.8, zoom: 4.8, bbox: [24.7, 22.0, 36.9, 31.7] },
    { id: 'na', labelKo: '나미비아', iso: 'NA', lat: -22.0, lng: 17.0, zoom: 4.8, bbox: [11.7, -28.9, 25.3, -16.9] },
    { id: 'mg', labelKo: '마다가스카르', iso: 'MG', lat: -19.0, lng: 46.5, zoom: 4.8, bbox: [43.2, -25.6, 50.5, -11.9] },
    { id: 'et', labelKo: '에티오피아', iso: 'ET', lat: 9.1, lng: 40.5, zoom: 4.8, bbox: [33.0, 3.4, 47.9, 14.9] },
  ],
  urban: [
    { id: 'no', labelKo: '노르웨이', iso: 'NO', lat: 64.0, lng: 11.0, zoom: 3.8, bbox: [4.5, 57.9, 31.1, 71.2] },
    { id: 'fr', labelKo: '프랑스', iso: 'FR', lat: 46.6, lng: 2.4, zoom: 4.8, bbox: [-5.2, 41.3, 9.6, 51.1] },
    { id: 'gb', labelKo: '영국', iso: 'GB', lat: 54.0, lng: -2.5, zoom: 5.0, bbox: [-8.2, 49.9, 1.8, 58.7] },
    { id: 'it', labelKo: '이탈리아', iso: 'IT', lat: 42.5, lng: 12.5, zoom: 5.0, bbox: [6.6, 36.6, 18.5, 47.1] },
    { id: 'es', labelKo: '스페인', iso: 'ES', lat: 40.2, lng: -3.7, zoom: 5.0, bbox: [-9.3, 36.0, 3.3, 43.8] },
    { id: 'de', labelKo: '독일', iso: 'DE', lat: 51.2, lng: 10.4, zoom: 5.0, bbox: [5.9, 47.3, 15.0, 55.1] },
    { id: 'nl', labelKo: '네덜란드', iso: 'NL', lat: 52.1, lng: 5.3, zoom: 6.0, bbox: [3.3, 50.7, 7.2, 53.7] },
    { id: 'cz', labelKo: '체코', iso: 'CZ', lat: 49.8, lng: 15.5, zoom: 6.0, bbox: [12.1, 48.5, 18.9, 51.1] },
  ],
  culture: [
    { id: 'us', labelKo: '미국', iso: 'US', lat: 39.8, lng: -98.5, zoom: 3.2, bbox: [-124.8, 24.5, -66.9, 49.4] },
    { id: 'ca', labelKo: '캐나다', iso: 'CA', lat: 56.1, lng: -106.3, zoom: 2.8, bbox: [-141.0, 41.7, -52.6, 83.1] },
    { id: 'mx', labelKo: '멕시코', iso: 'MX', lat: 23.6, lng: -102.5, zoom: 4.0, bbox: [-118.4, 14.5, -86.7, 32.7] },
    { id: 'cu', labelKo: '쿠바', iso: 'CU', lat: 21.5, lng: -79.0, zoom: 5.6, bbox: [-85.0, 19.8, -74.1, 23.3] },
    { id: 'cr', labelKo: '코스타리카', iso: 'CR', lat: 9.7, lng: -84.0, zoom: 6.2, bbox: [-85.9, 8.0, -82.5, 11.2] },
    { id: 'gt', labelKo: '과테말라', iso: 'GT', lat: 15.5, lng: -90.3, zoom: 6.0, bbox: [-92.3, 13.7, -88.2, 17.8] },
    { id: 'pa', labelKo: '파나마', iso: 'PA', lat: 8.5, lng: -80.1, zoom: 6.4, bbox: [-83.0, 7.2, -77.2, 9.6] },
    { id: 'jm', labelKo: '자메이카', iso: 'JM', lat: 18.1, lng: -77.3, zoom: 7.0, bbox: [-78.4, 17.7, -76.2, 18.5] },
  ],
  adventure: [
    { id: 'br', labelKo: '브라질', iso: 'BR', lat: -14.2, lng: -51.9, zoom: 3.2, bbox: [-74.0, -33.8, -34.8, 5.3] },
    { id: 'pe', labelKo: '페루', iso: 'PE', lat: -9.2, lng: -75.0, zoom: 4.4, bbox: [-81.4, -18.4, -68.7, 0.0] },
    { id: 'ar', labelKo: '아르헨티나', iso: 'AR', lat: -38.4, lng: -63.6, zoom: 3.4, bbox: [-73.6, -55.1, -53.6, -21.8] },
    {
      id: 'cl',
      labelKo: '칠레',
      iso: 'CL',
      lat: -35.7,
      lng: -71.5,
      zoom: 3.6,
      bbox: [-75.7, -55.9, -66.4, -17.5],
      hubBbox: [-74.5, -41.5, -69.5, -22.0],
    },
    { id: 'co', labelKo: '콜롬비아', iso: 'CO', lat: 4.6, lng: -74.1, zoom: 4.8, bbox: [-79.1, -4.3, -66.9, 12.5] },
    { id: 'ec', labelKo: '에콰도르', iso: 'EC', lat: -1.8, lng: -78.2, zoom: 5.6, bbox: [-81.1, -5.0, -75.2, 1.5] },
    { id: 'bo', labelKo: '볼리비아', iso: 'BO', lat: -16.3, lng: -63.6, zoom: 4.8, bbox: [-69.6, -22.9, -57.5, -9.7] },
    { id: 'py', labelKo: '파라과이', iso: 'PY', lat: -23.4, lng: -58.4, zoom: 5.2, bbox: [-62.6, -27.6, -54.3, -19.3] },
  ],
};

/** 국가 단위 “평면 느낌” 기본 줌 — 지역별 zoom이 없을 때 */
export const GLOBE_FACE_REGION_DEFAULT_ZOOM = 4.2;

export const GLOBE_FACE_REGION_FLY_MS = 1800;

/** fitBounds 시 도시 지명 노출을 위한 상한 — 작은 섬 과확대 방지 */
export const GLOBE_FACE_REGION_MAX_ZOOM = 6.4;

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
 * @param {string | null | undefined} category
 * @returns {GlobeFaceRegion[]}
 */
export function getFaceRegionsForCategory(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];
  return GLOBE_FACE_REGIONS[category] || [];
}

/**
 * @param {string | null | undefined} category
 * @param {string | null | undefined} regionId
 * @returns {GlobeFaceRegion | null}
 */
export function getFaceRegionById(category, regionId) {
  if (!regionId) return null;
  return getFaceRegionsForCategory(category).find((r) => r.id === regionId) || null;
}

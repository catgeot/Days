/** 카테고리 면별 나라/지역 큐레이션 SSOT — 클릭 시 국가 단위 flyTo */

import { GLOBE_CATEGORY_IDS } from './globeCategoryFocus.js';

/**
 * @typedef {{ id: string, labelKo: string, lat: number, lng: number, zoom: number }} GlobeFaceRegion
 */

/** 카테고리당 6~10개 — 면 중심([`GLOBE_FACE_CENTER_BY_CATEGORY`](./globeCategoryFocus.js))과 같은 권역 */
export const GLOBE_FACE_REGIONS = {
  paradise: [
    { id: 'kr', labelKo: '한국', lat: 36.5, lng: 127.8, zoom: 5.4 },
    { id: 'jp', labelKo: '일본', lat: 36.2, lng: 138.2, zoom: 4.6 },
    { id: 'tw', labelKo: '대만', lat: 23.7, lng: 121.0, zoom: 5.8 },
    { id: 'th', labelKo: '태국', lat: 15.5, lng: 101.0, zoom: 4.8 },
    { id: 'vn', labelKo: '베트남', lat: 16.0, lng: 107.5, zoom: 4.8 },
    { id: 'id', labelKo: '인도네시아', lat: -2.5, lng: 118.0, zoom: 3.6 },
    { id: 'ph', labelKo: '필리핀', lat: 12.0, lng: 122.0, zoom: 4.6 },
    { id: 'my', labelKo: '말레이시아', lat: 4.0, lng: 109.5, zoom: 4.6 },
    { id: 'au', labelKo: '호주', lat: -25.0, lng: 134.0, zoom: 3.4 },
  ],
  nature: [
    { id: 'ke', labelKo: '케냐', lat: 0.5, lng: 37.9, zoom: 5.0 },
    { id: 'tz', labelKo: '탄자니아', lat: -6.4, lng: 34.9, zoom: 5.0 },
    { id: 'za', labelKo: '남아프리카', lat: -30.5, lng: 25.0, zoom: 4.2 },
    { id: 'ma', labelKo: '모로코', lat: 31.8, lng: -7.1, zoom: 5.0 },
    { id: 'eg', labelKo: '이집트', lat: 26.8, lng: 30.8, zoom: 4.8 },
    { id: 'na', labelKo: '나미비아', lat: -22.0, lng: 17.0, zoom: 4.8 },
    { id: 'mg', labelKo: '마다가스카르', lat: -19.0, lng: 46.5, zoom: 4.8 },
    { id: 'et', labelKo: '에티오피아', lat: 9.1, lng: 40.5, zoom: 4.8 },
  ],
  urban: [
    { id: 'no', labelKo: '노르웨이', lat: 64.0, lng: 11.0, zoom: 3.8 },
    { id: 'fr', labelKo: '프랑스', lat: 46.6, lng: 2.4, zoom: 4.8 },
    { id: 'gb', labelKo: '영국', lat: 54.0, lng: -2.5, zoom: 5.0 },
    { id: 'it', labelKo: '이탈리아', lat: 42.5, lng: 12.5, zoom: 5.0 },
    { id: 'es', labelKo: '스페인', lat: 40.2, lng: -3.7, zoom: 5.0 },
    { id: 'de', labelKo: '독일', lat: 51.2, lng: 10.4, zoom: 5.0 },
    { id: 'nl', labelKo: '네덜란드', lat: 52.1, lng: 5.3, zoom: 6.0 },
    { id: 'cz', labelKo: '체코', lat: 49.8, lng: 15.5, zoom: 6.0 },
  ],
  culture: [
    { id: 'us', labelKo: '미국', lat: 39.8, lng: -98.5, zoom: 3.2 },
    { id: 'ca', labelKo: '캐나다', lat: 56.1, lng: -106.3, zoom: 2.8 },
    { id: 'mx', labelKo: '멕시코', lat: 23.6, lng: -102.5, zoom: 4.0 },
    { id: 'cu', labelKo: '쿠바', lat: 21.5, lng: -79.0, zoom: 5.6 },
    { id: 'cr', labelKo: '코스타리카', lat: 9.7, lng: -84.0, zoom: 6.2 },
    { id: 'gt', labelKo: '과테말라', lat: 15.5, lng: -90.3, zoom: 6.0 },
    { id: 'pa', labelKo: '파나마', lat: 8.5, lng: -80.1, zoom: 6.4 },
    { id: 'jm', labelKo: '자메이카', lat: 18.1, lng: -77.3, zoom: 7.0 },
  ],
  adventure: [
    { id: 'br', labelKo: '브라질', lat: -14.2, lng: -51.9, zoom: 3.2 },
    { id: 'pe', labelKo: '페루', lat: -9.2, lng: -75.0, zoom: 4.4 },
    { id: 'ar', labelKo: '아르헨티나', lat: -38.4, lng: -63.6, zoom: 3.4 },
    { id: 'cl', labelKo: '칠레', lat: -35.7, lng: -71.5, zoom: 3.6 },
    { id: 'co', labelKo: '콜롬비아', lat: 4.6, lng: -74.1, zoom: 4.8 },
    { id: 'ec', labelKo: '에콰도르', lat: -1.8, lng: -78.2, zoom: 5.6 },
    { id: 'bo', labelKo: '볼리비아', lat: -16.3, lng: -63.6, zoom: 4.8 },
    { id: 'py', labelKo: '파라과이', lat: -23.4, lng: -58.4, zoom: 5.2 },
  ],
};

/** 국가 단위 “평면 느낌” 기본 줌 — 지역별 zoom이 없을 때 */
export const GLOBE_FACE_REGION_DEFAULT_ZOOM = 4.2;

export const GLOBE_FACE_REGION_FLY_MS = 1800;

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

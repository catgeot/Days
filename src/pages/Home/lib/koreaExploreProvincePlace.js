import { stripKoreaAdminSuffix } from './koreaAdminRegionMatch.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';

const PROVINCE_KO = [
  '강원특별자치도',
  '강원도',
  '제주특별자치도',
  '경기도',
  '경상북도',
  '경상남도',
  '전라북도',
  '전북특별자치도',
  '전라남도',
  '충청북도',
  '충청남도',
  '세종특별자치시',
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
];

const PROVINCE_EN = [
  ['jeju-do', '제주특별자치도'],
  ['jeju', '제주특별자치도'],
  ['gangwon-do', '강원특별자치도'],
  ['gangwon', '강원특별자치도'],
  ['gyeonggi-do', '경기도'],
  ['gyeonggi', '경기도'],
];

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function extractHangulProvinceToken(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const m = text.match(
    /[\uAC00-\uD7A3]+(?:특별자치도|특별자치시|특별시|광역시|도)/u,
  );
  return m ? m[0] : '';
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
export function expandKoreaAdminPlaceQueries(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  const out = new Set([text]);
  const hangul = extractHangulProvinceToken(text);
  if (hangul) out.add(hangul);
  const stripped = stripKoreaAdminSuffix(text);
  if (stripped && stripped.length >= 2) out.add(stripped);
  if (/특별자치도$/u.test(text)) {
    const prefix = text.replace(/특별자치도$/u, '').trim();
    if (prefix) out.add(prefix);
  }
  const key = compactKey(text);
  for (const [en, ko] of PROVINCE_EN) {
    if (key === en || key === en.replace(/-/g, '')) out.add(ko);
  }
  for (const ko of PROVINCE_KO) {
    if (compactKey(ko) === key) out.add(ko);
  }
  return [...out].filter(Boolean);
}

/**
 * @param {string | null | undefined} name
 */
export function isKoreaProvinceLevelName(name) {
  const queries = expandKoreaAdminPlaceQueries(name);
  for (const q of queries) {
    const key = compactKey(q);
    if (PROVINCE_KO.some((ko) => compactKey(ko) === key)) return true;
    const bare = stripKoreaAdminSuffix(q);
    if (PROVINCE_KO.some((ko) => stripKoreaAdminSuffix(ko) === bare && bare.length >= 2)) {
      return true;
    }
  }
  return false;
}

/**
 * 시·도 행정명 → 허브(jeju 등). 강원·경기 등 무매칭 도는 null.
 * @param {string | null | undefined} name
 */
export function resolveKoreaProvinceCatalogHub(name) {
  for (const q of expandKoreaAdminPlaceQueries(name)) {
    const hub = resolveExploreCityHubExact(q);
    if (hub?.hubId) return hub;
    const bare = stripKoreaAdminSuffix(q);
    if (bare.length >= 2) {
      const hubBare = resolveExploreCityHubExact(bare);
      if (hubBare?.hubId) return hubBare;
    }
  }
  return null;
}

/**
 * TourAPI 행 — title이 시·도명이고 POI 허브가 아니면 Enter는 홈(강원도→2714533 방지).
 * @param {object | null | undefined} pin
 */
export function isKoreaProvinceLevelTourResult(pin) {
  if (!pin || typeof pin !== 'object') return false;
  const source = String(pin.source ?? '').trim().toLowerCase();
  if (source !== 'tourapi') return false;
  const title = String(pin.name || pin.name_ko || pin.title || '').trim();
  if (!title || !isKoreaProvinceLevelName(title)) return false;
  if (resolveKoreaProvinceCatalogHub(title)) return false;
  return true;
}

/**
 * Mapbox region feature — 시·도·나라만 admin. 고산사 등 POI 오분류 제외.
 * @param {object | null | undefined} pin
 */
export function isMapboxRegionFeatureAdminPin(pin) {
  if (!pin || typeof pin !== 'object') return false;
  const featureType = String(pin.feature_type || pin.featureType || '').toLowerCase();
  if (featureType !== 'region') return false;
  const name = String(pin.name || pin.name_ko || '').trim();
  if (!name) return false;
  if (resolveKoreaProvinceCatalogHub(name)) return true;
  if (isKoreaProvinceLevelName(name)) return true;
  return false;
}

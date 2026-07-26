/**
 * 면 안 소권역 — 소분류 칩 SSOT (PC 세로 · 모바일 상단 가로 선택바).
 * 대면(권역≠테마)·면 배타는 [`globeFaceRegions.js`](./globeFaceRegions.js) 유지.
 * 소권역끼리도 배타. 짧은 면(≤ SUBREGION_CHIP_MIN_COUNTRIES)은 칩 생략.
 */

import { GLOBE_CATEGORY_IDS } from './globeCategoryFocus.js';
import { getFaceRegionsForCategory } from './globeFaceRegions.js';

/** 이 수 이하면 소분류 칩 숨김 (문화·모험 등) */
export const SUBREGION_CHIP_MIN_COUNTRIES = 12;

/** 「전체」선택 id */
export const GLOBE_FACE_SUBREGION_ALL = 'all';

/**
 * @typedef {{ id: string, labelKo: string, countryIds: string[] }} GlobeFaceSubregion
 */

/** @type {Record<string, GlobeFaceSubregion[]>} */
export const GLOBE_FACE_SUBREGIONS = {
  paradise: [
    {
      id: 'east_asia',
      labelKo: '동아시아',
      countryIds: ['kr', 'jp', 'tw', 'cn', 'mn', 'ru'],
    },
    {
      id: 'se_sasia',
      labelKo: '동남아·남아시아',
      countryIds: [
        'th', 'vn', 'ph', 'id', 'my', 'sg', 'kh', 'la', 'mm', 'bn',
        'in', 'np', 'lk', 'mv',
      ],
    },
    {
      id: 'pacific',
      labelKo: '남태평양·오세아니아',
      countryIds: [
        'au', 'nz', 'hi', 'um', 'fj', 'pf', 'to', 'vu', 'ws', 'ck',
        'nc', 'sb', 'ki', 'pn', 'nr', 'mp', 'gu', 'pw', 'fm',
      ],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: ['ae', 'ir'],
    },
  ],
  nature: [
    {
      id: 'east_south',
      labelKo: '동·남아프리카',
      countryIds: [
        'ke', 'tz', 'za', 'na', 'mg', 'et', 'zm', 'mu', 'sc', 're', 'io',
      ],
    },
    {
      id: 'north_west',
      labelKo: '북·서아프리카',
      countryIds: ['eg', 'ma', 'cv', 'eh', 'ml', 'il', 'jo', 'sh'],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: ['aq', 'tf'],
    },
  ],
  urban: [
    {
      id: 'west_south',
      labelKo: '서·남유럽',
      countryIds: [
        'fr', 'gb', 'eng', 'sct', 'wls', 'nir', 'it', 'es', 'pt', 'gr', 'ch', 'hr', 'tr', 'be', 'nl',
        'at', 'si', 'va', 'me', 'mt', 'ie',
      ],
    },
    {
      id: 'north_east',
      labelKo: '북·동유럽',
      countryIds: ['no', 'de', 'cz', 'dk', 'se', 'pl', 'hu', 'fi'],
    },
    {
      id: 'arctic',
      labelKo: '북극·도서',
      countryIds: ['gl', 'sj', 'is'],
    },
  ],
  culture: [],
  adventure: [],
};

/**
 * @param {string | null | undefined} category
 * @returns {GlobeFaceSubregion[]}
 */
export function getFaceSubregions(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];

  const regions = getFaceRegionsForCategory(category);
  if (regions.length <= SUBREGION_CHIP_MIN_COUNTRIES) return [];

  const faceIds = new Set(regions.map((r) => r.id));
  const defs = GLOBE_FACE_SUBREGIONS[category] || [];
  const out = [];

  for (const def of defs) {
    const countryIds = (def.countryIds || []).filter((id) => faceIds.has(id));
    if (countryIds.length === 0) continue;
    out.push({ id: def.id, labelKo: def.labelKo, countryIds });
  }

  return out;
}

/**
 * @param {string | null | undefined} category
 * @param {string | null | undefined} subregionId
 */
export function getFaceRegionsForSubregion(category, subregionId) {
  const regions = getFaceRegionsForCategory(category);
  if (!subregionId || subregionId === GLOBE_FACE_SUBREGION_ALL) return regions;

  const sub = getFaceSubregions(category).find((s) => s.id === subregionId);
  if (!sub) return regions;

  const allowed = new Set(sub.countryIds);
  return regions.filter((r) => allowed.has(r.id));
}

/**
 * 소권역 칩을 보여줄지. 짧은 면·미정의 면은 false.
 * @param {string | null | undefined} category
 */
export function shouldShowFaceSubregionChips(category) {
  return getFaceSubregions(category).length > 0;
}

/**
 * 소권역 기본값 — 첫 소권역 id (칩 없으면 null). 「전체」칩 없음.
 * @param {string | null | undefined} category
 * @returns {string | null}
 */
export function getDefaultFaceSubregionId(category) {
  const subs = getFaceSubregions(category);
  return subs[0]?.id ?? null;
}

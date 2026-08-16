/**
 * 면별 상위 대양 칩 — 소권역 바에 나라 중분류와 배타로 노출.
 * 탐색용으로 4대 권역(태평양·대서양·인도양·지중해) 고정 노출.
 */
import { GLOBE_CATEGORY_IDS } from './globeCategoryFocus.js';
import { SEA_BASIN_TOP_OCEANS } from './seaBasinRail.js';

/**
 * @param {string | null | undefined} category
 * @returns {{ id: string, name: string }[]}
 */
export function getFaceSeaOceans(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];
  return SEA_BASIN_TOP_OCEANS.map((o) => ({ id: o.id, name: o.name }));
}

/**
 * @param {string | null | undefined} category
 */
export function shouldShowFaceSeaOceanChips(category) {
  return getFaceSeaOceans(category).length > 0;
}

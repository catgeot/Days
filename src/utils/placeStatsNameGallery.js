import { resolveHubPlaceFromSlug } from '../pages/Home/lib/cityAttractionHubs.js';
import { pickPlaceStatsGalleryRow } from './galleryPortraitFilter.js';

/**
 * 같은 한글 이름의 옛 place_id(라틴 오탐 slug)는 남기고,
 * 다른 시군 허브 행(평창 등)은 갤러리 후보에서 뺀다.
 * @param {Array<Record<string, unknown>> | null | undefined} rows
 * @param {string} koreanName
 */
export function rowsForKoreanPlaceName(rows, koreanName) {
  const name = String(koreanName || '').trim();
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return list.filter((row) => {
    const rowName = String(row.name_ko || '').trim();
    if (name && rowName && rowName !== name) return false;
    const hub = resolveHubPlaceFromSlug(row.place_id);
    if (!hub) return true;
    return String(hub.name || '').trim() === name;
  });
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} rows
 * @param {string} koreanName
 */
export function pickKoreanNameGallery(rows, koreanName) {
  return pickPlaceStatsGalleryRow(rowsForKoreanPlaceName(rows, koreanName), '');
}

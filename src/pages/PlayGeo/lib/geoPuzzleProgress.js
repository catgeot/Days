import { GEO_PUZZLE_STORAGE_KEY } from '../data/geoPuzzleTree.js';

/** @typedef {{ score: number, filledIds: string[], continentId: string, clearedSubregionIds: string[], clearedContinentIds: string[] }} GeoPuzzleProgress */

/** @returns {GeoPuzzleProgress} */
export function loadGeoPuzzleProgress() {
  try {
    const raw = localStorage.getItem(GEO_PUZZLE_STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return {
      score: Number(parsed.score) || 0,
      filledIds: Array.isArray(parsed.filledIds) ? parsed.filledIds.map(String) : [],
      continentId: String(parsed.continentId || ''),
      clearedSubregionIds: Array.isArray(parsed.clearedSubregionIds)
        ? parsed.clearedSubregionIds.map(String)
        : [],
      clearedContinentIds: Array.isArray(parsed.clearedContinentIds)
        ? parsed.clearedContinentIds.map(String)
        : [],
    };
  } catch {
    return defaultProgress();
  }
}

/** @returns {GeoPuzzleProgress} */
export function defaultProgress() {
  return {
    score: 0,
    filledIds: [],
    continentId: '',
    clearedSubregionIds: [],
    clearedContinentIds: [],
  };
}

/** @param {GeoPuzzleProgress} progress */
export function saveGeoPuzzleProgress(progress) {
  try {
    localStorage.setItem(GEO_PUZZLE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}

export function clearGeoPuzzleProgress() {
  try {
    localStorage.removeItem(GEO_PUZZLE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

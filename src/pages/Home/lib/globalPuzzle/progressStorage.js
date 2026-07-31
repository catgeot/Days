import { mergeBestStars } from './rules.js';

export const GLOBAL_PUZZLE_STORAGE_KEY = 'gateo_global_puzzle_v1';

/**
 * @typedef {{ cleared: boolean, bestStars: number, hintUsedBest?: boolean }} PuzzleCountryProgress
 * @typedef {{ countries: Record<string, PuzzleCountryProgress> }} PuzzleProgress
 */

/** @returns {PuzzleProgress} */
export function defaultPuzzleProgress() {
  return { countries: {} };
}

/** @returns {PuzzleProgress} */
export function loadPuzzleProgress() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultPuzzleProgress();
  }
  try {
    const raw = window.localStorage.getItem(GLOBAL_PUZZLE_STORAGE_KEY);
    if (!raw) return defaultPuzzleProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultPuzzleProgress();
    const countries = parsed.countries && typeof parsed.countries === 'object'
      ? parsed.countries
      : {};
    return { countries: { ...countries } };
  } catch {
    return defaultPuzzleProgress();
  }
}

/** @param {PuzzleProgress} progress */
export function savePuzzleProgress(progress) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(
      GLOBAL_PUZZLE_STORAGE_KEY,
      JSON.stringify(progress || defaultPuzzleProgress()),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {PuzzleProgress} progress
 * @param {string} countryId
 * @param {{ stars: number, hintUsed?: boolean }} result
 */
export function recordPuzzleClear(progress, countryId, { stars, hintUsed = false }) {
  const next = {
    countries: { ...(progress?.countries || {}) },
  };
  const prev = next.countries[countryId] || { cleared: false, bestStars: 0 };
  const bestStars = mergeBestStars(prev.bestStars, stars);
  next.countries[countryId] = {
    cleared: true,
    bestStars,
    hintUsedBest: bestStars === stars ? Boolean(hintUsed) : prev.hintUsedBest,
  };
  return next;
}

/** @param {PuzzleProgress} progress @param {string} countryId */
export function getCountryProgress(progress, countryId) {
  return progress?.countries?.[countryId] || null;
}

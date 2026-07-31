/** 범지구적 퍼즐 — 별 규칙 (만점 3 · 힌트/오답 각 −1 · 하한 1) */

export const GLOBAL_PUZZLE_MAX_STARS = 3;
export const GLOBAL_PUZZLE_MIN_STARS = 1;

/**
 * @param {{ hintUsed?: boolean, hadWrong?: boolean }} flags
 * @returns {number}
 */
export function computePuzzleStars({ hintUsed = false, hadWrong = false } = {}) {
  let stars = GLOBAL_PUZZLE_MAX_STARS;
  if (hintUsed) stars -= 1;
  if (hadWrong) stars -= 1;
  return Math.max(GLOBAL_PUZZLE_MIN_STARS, stars);
}

/**
 * @param {number} prevBest
 * @param {number} nextStars
 */
export function mergeBestStars(prevBest, nextStars) {
  const a = Number.isFinite(prevBest) ? prevBest : 0;
  const b = Number.isFinite(nextStars) ? nextStars : 0;
  return Math.max(a, b);
}

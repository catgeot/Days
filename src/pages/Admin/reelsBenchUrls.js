const REEL_BASE = 'https://reels.findable.kr/reels/2026-10';

export const REELS_BENCH_COUNT = 7;

/** @param {number} index 1..7 */
export function reelIndexLabel(index) {
  return String(index).padStart(2, '0');
}

/** @param {number} index 1..7 */
export function reelPosterUrl(index) {
  const n = reelIndexLabel(index);
  return `${REEL_BASE}/reel-final-${n}-cap1.png`;
}

/** @param {number} index 1..7 */
export function reelOriginalMp4Url(index) {
  const n = reelIndexLabel(index);
  return `${REEL_BASE}/reel-final-${n}.mp4`;
}

/** @param {number} index 1..7 */
export function reelWebMp4Url(index) {
  const n = reelIndexLabel(index);
  return `${REEL_BASE}/web/reel-web-${n}.mp4`;
}

export const REELS_BENCH_INDICES = Array.from({ length: REELS_BENCH_COUNT }, (_, i) => i + 1);

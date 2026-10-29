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

/**
 * CDN byte sizes (verified server-side HEAD 2026-10-28 — browser fetch blocked by no CORS).
 * @type {Record<string, { original: number, web: number }>}
 */
export const REELS_BENCH_VERIFIED_BYTES = {
  '01': { original: 23_547_743, web: 4_479_274 },
  '02': { original: 33_257_224, web: 5_306_343 },
  '03': { original: 19_247_104, web: 3_652_080 },
  '04': { original: 26_703_064, web: 4_430_764 },
  '05': { original: 34_275_967, web: 6_231_163 },
  '06': { original: 21_984_755, web: 4_065_307 },
  '07': { original: 41_404_793, web: 7_476_352 },
};

/** @param {number} index @param {'web' | 'original'} kind */
export function getVerifiedReelByteSize(index, kind) {
  const row = REELS_BENCH_VERIFIED_BYTES[reelIndexLabel(index)];
  if (!row) return null;
  return kind === 'web' ? row.web : row.original;
}

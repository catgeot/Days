/** Minimum intersection ratio to count as a play candidate. */
export const SELF_REELS_VISIBLE_MIN = 0.55;

/**
 * Pick one reel index to play from visibility ratios.
 * Returns null when nothing is visible enough.
 * When two candidates are tied, keep previousIndex if it is among them.
 */
export function pickVisiblePlayIndex(ratios, previousIndex = null) {
  if (!Array.isArray(ratios) || ratios.length === 0) return null;

  let bestIndex = null;
  let bestRatio = -1;

  for (let i = 0; i < ratios.length; i += 1) {
    const ratio = Number(ratios[i]);
    if (!Number.isFinite(ratio) || ratio < SELF_REELS_VISIBLE_MIN) continue;
    if (bestIndex === null || ratio > bestRatio) {
      bestIndex = i;
      bestRatio = ratio;
      continue;
    }
    if (
      ratio === bestRatio &&
      previousIndex === i &&
      (bestIndex !== previousIndex)
    ) {
      bestIndex = i;
    }
  }

  return bestIndex;
}

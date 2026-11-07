/** Pure helpers for Session4 playback-failure UI (no auto-advance). */

export function failureUiState(failCount, hasNext) {
  const count = Number.isFinite(failCount) ? Math.max(0, failCount) : 0;
  return {
    showRetry: count >= 1,
    showNext: count >= 2 && Boolean(hasNext),
  };
}

export function nextReelIndex(activeIndex, length) {
  if (!Number.isInteger(activeIndex) || !Number.isInteger(length)) return null;
  if (activeIndex < 0 || length <= 0) return null;
  const next = activeIndex + 1;
  return next < length ? next : null;
}

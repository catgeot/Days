/** Gallery scroll offsets keyed by place, so Back can return to the same spot. */

const tops = new Map();

/**
 * @param {unknown} key
 * @param {unknown} top
 */
export function rememberPlaceGalleryScroll(key, top) {
  const id = String(key || '').trim();
  const n = Number(top);
  if (!id || !Number.isFinite(n) || n < 0) return;
  tops.set(id, n);
}

/**
 * Restore only when the user came back. A fresh open starts at the top.
 * @param {unknown} key
 * @param {unknown} navigationType
 * @returns {number}
 */
export function placeGalleryScrollToRestore(key, navigationType) {
  if (navigationType !== 'POP') return 0;
  const n = tops.get(String(key || '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

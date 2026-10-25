/** Gallery scroll offsets keyed by place, so Back can return to the same spot. */

const tops = new Map();

function storageKey(id) {
  return `gateo:place-gallery-scroll:${id}`;
}

/**
 * @param {unknown} key
 * @param {unknown} top
 */
export function rememberPlaceGalleryScroll(key, top) {
  const id = String(key || '').trim();
  const n = Number(top);
  if (!id || !Number.isFinite(n) || n < 0) return;
  tops.set(id, n);
  try {
    sessionStorage.setItem(storageKey(id), String(n));
  } catch {
    /* private mode */
  }
}

function readStoredGalleryScroll(id) {
  const fromMap = tops.get(id);
  if (Number.isFinite(fromMap) && fromMap > 0) return fromMap;
  try {
    const n = Number(sessionStorage.getItem(storageKey(id)));
    if (Number.isFinite(n) && n > 0) {
      tops.set(id, n);
      return n;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

/**
 * Restore only when the user came back. A fresh open starts at the top.
 * @param {unknown} key
 * @param {unknown} navigationType
 * @returns {number}
 */
export function placeGalleryScrollToRestore(key, navigationType) {
  if (navigationType !== 'POP') return 0;
  const id = String(key || '').trim();
  return readStoredGalleryScroll(id);
}

/** Before in-app route push to reviews — so browser Back restores gallery scroll. */
export function snapshotGalleryScrollForPlaceBack(placeKey) {
  if (typeof document === 'undefined') return;
  const id = String(placeKey || '').trim();
  if (!id) return;
  const el = document.querySelector('[data-place-gallery-scroll]');
  if (!el) return;
  rememberPlaceGalleryScroll(id, el.scrollTop);
}

/**
 * @param {unknown} placeKey
 * @returns {number}
 */
export function peekGalleryScrollForPlaceBack(placeKey) {
  const id = String(placeKey || '').trim();
  if (!id) return 0;
  return readStoredGalleryScroll(id);
}

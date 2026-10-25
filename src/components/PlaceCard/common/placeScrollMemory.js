/** Gallery scroll offsets keyed by place, so Back can return to the same spot. */

const tops = new Map();
const backTops = new Map();

function storageKey(id) {
  return `gateo:place-gallery-scroll:${id}`;
}

function backStorageKey(id) {
  return `gateo:place-gallery-back-scroll:${id}`;
}

function backArmKey(id) {
  return `gateo:place-gallery-back-armed:${id}`;
}

let galleryHistoryPopSeen = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    galleryHistoryPopSeen = true;
  });
}

export function consumeGalleryHistoryPopFlag() {
  const v = galleryHistoryPopSeen;
  galleryHistoryPopSeen = false;
  return v;
}

function isBackArmed(id) {
  try {
    return sessionStorage.getItem(backArmKey(id)) === '1';
  } catch {
    return false;
  }
}

function clearBackArm(id) {
  try {
    sessionStorage.removeItem(backArmKey(id));
  } catch {
    /* ignore */
  }
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

function readBackGalleryScroll(id) {
  const fromMap = backTops.get(id);
  if (Number.isFinite(fromMap) && fromMap > 0) return fromMap;
  try {
    const n = Number(sessionStorage.getItem(backStorageKey(id)));
    if (Number.isFinite(n) && n > 0) {
      backTops.set(id, n);
      return n;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function clearBackGalleryScroll(id) {
  backTops.delete(id);
  try {
    sessionStorage.removeItem(backStorageKey(id));
  } catch {
    /* private mode */
  }
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
  return readBackGalleryScroll(id);
}

/** Call after POP scroll restore is applied so in-app navigation does not re-use the offset. */
export function clearPlaceGalleryScrollBack(key) {
  const id = String(key || '').trim();
  if (!id) return;
  clearBackGalleryScroll(id);
  clearBackArm(id);
}

/** Before in-app route push to reviews — so browser Back restores gallery scroll. */
export function snapshotGalleryScrollForPlaceBack(placeKey) {
  if (typeof document === 'undefined') return;
  const id = String(placeKey || '').trim();
  if (!id) return;
  const el = document.querySelector('[data-place-gallery-scroll]');
  if (!el) return;
  const n = Number(el.scrollTop);
  if (!Number.isFinite(n) || n < 0) return;
  backTops.set(id, n);
  try {
    sessionStorage.setItem(backStorageKey(id), String(n));
    sessionStorage.setItem(backArmKey(id), '1');
  } catch {
    /* private mode */
  }
}

/**
 * @param {unknown} placeKey
 * @param {string} navigationType
 * @returns {boolean}
 */
export function isGalleryBackRestoreDue(placeKey, navigationType) {
  const id = String(placeKey || '').trim();
  if (!id || readBackGalleryScroll(id) <= 0) return false;
  if (!isBackArmed(id)) return false;
  if (navigationType === 'POP') return true;
  return consumeGalleryHistoryPopFlag();
}

/**
 * @param {unknown} placeKey
 * @returns {number}
 */
export function peekGalleryScrollForPlaceBack(placeKey) {
  const id = String(placeKey || '').trim();
  if (!id) return 0;
  return readBackGalleryScroll(id);
}

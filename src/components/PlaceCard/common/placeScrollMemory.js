/** Gallery scroll offsets keyed by place, so Back can return to the same spot. */

const tops = new Map();
const backTops = new Map();
/** In-session only — stale sessionStorage after reload/direct entry must not restore. */
const backRestoreLive = new Map();
/** Lightbox / modal overlays that unmount or reflow the scroll container. */
const overlayScrollByKey = new Map();

function isGalleryScrollAtTop(el) {
  const liveTop = Number(el?.scrollTop);
  return Number.isFinite(liveTop) && liveTop <= 8;
}

function readGalleryScrollSnapshotFromElement(el, placeKey) {
  const id = String(placeKey || '').trim();
  const liveTop = Number(el?.scrollTop);
  const live = Number.isFinite(liveTop) && liveTop >= 0 ? liveTop : 0;
  if (isGalleryScrollAtTop(el)) return live;
  const remembered = id ? readStoredGalleryScroll(id) : 0;
  const attrTop = Number(el?.getAttribute?.('data-gallery-last-scroll'));
  return Math.max(
    live,
    remembered,
    Number.isFinite(attrTop) && attrTop > 0 ? attrTop : 0,
  );
}

function storageKey(id) {
  return `gateo:place-gallery-scroll:${id}`;
}

function backStorageKey(id) {
  return `gateo:place-gallery-back-scroll:${id}`;
}

function backArmKey(id) {
  return `gateo:place-gallery-back-armed:${id}`;
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
  if (typeof document !== 'undefined') {
    const el = document.querySelector('[data-place-gallery-scroll]');
    if (!el) return;
    if (n > 0) el.setAttribute('data-gallery-last-scroll', String(n));
    else el.removeAttribute('data-gallery-last-scroll');
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
  if (!id || !backRestoreLive.get(id)) return 0;
  if (!isBackArmed(id)) return 0;
  return readBackGalleryScroll(id);
}

/** Call after POP scroll restore is applied so in-app navigation does not re-use the offset. */
export function clearPlaceGalleryScrollBack(key) {
  const id = String(key || '').trim();
  if (!id) return;
  backRestoreLive.delete(id);
  clearBackGalleryScroll(id);
  clearBackArm(id);
}

function readGalleryScrollForBackSnapshot(el, placeKey) {
  const id = String(placeKey || '').trim();
  const liveTop = Number(el?.scrollTop);
  const live = Number.isFinite(liveTop) && liveTop >= 0 ? liveTop : 0;
  const remembered = id ? readStoredGalleryScroll(id) : 0;
  const attrTop = Number(el?.getAttribute?.('data-gallery-last-scroll'));
  const attr = Number.isFinite(attrTop) && attrTop > 0 ? attrTop : 0;
  if (live <= 8) {
    if (attr > 0 && (remembered <= 8 || attr <= remembered)) return attr;
    if (remembered > 0) return remembered;
    return live;
  }
  return Math.max(live, remembered, attr);
}

/** Before in-app route push to reviews — so browser Back restores gallery scroll. */
export function snapshotGalleryScrollForPlaceBack(placeKey) {
  if (typeof document === 'undefined') return;
  const id = String(placeKey || '').trim();
  if (!id) return;
  const el = document.querySelector('[data-place-gallery-scroll]');
  if (!el) return;
  const n = readGalleryScrollForBackSnapshot(el, id);
  if (!Number.isFinite(n) || n <= 0) return;
  backTops.set(id, n);
  backRestoreLive.set(id, true);
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
  if (!backRestoreLive.get(id)) return false;
  if (!isBackArmed(id)) return false;
  return navigationType === 'POP';
}

/**
 * Armed gallery back offset when snapshotGalleryScrollForPlaceBack ran this session.
 * @param {unknown} placeKey
 * @returns {number}
 */
export function peekArmedGalleryBackScroll(placeKey) {
  const id = String(placeKey || '').trim();
  if (!id || !backRestoreLive.get(id)) return 0;
  if (!isBackArmed(id)) return 0;
  return readBackGalleryScroll(id);
}

/**
 * Browser Back (router POP) only — in-app tab/link navigation must not restore armed scroll.
 * @param {unknown} placeKey
 * @param {unknown} navigationType
 * @returns {number}
 */
export function armedGalleryBackScrollToRestore(placeKey, navigationType) {
  if (navigationType !== 'POP') return 0;
  return peekArmedGalleryBackScroll(placeKey);
}

/**
 * @param {unknown} overlayKey
 * @param {Element | null | undefined} container
 * @param {unknown} [galleryPlaceKey]
 */
export function snapshotScrollBeforeOverlay(overlayKey, container, galleryPlaceKey = '') {
  const key = String(overlayKey || '').trim();
  if (!key || !container) return;
  const placeId = String(galleryPlaceKey || '').trim();
  const n = placeId
    ? readGalleryScrollSnapshotFromElement(container, placeId)
    : Math.max(
        Number.isFinite(Number(container.scrollTop)) && Number(container.scrollTop) >= 0
          ? Number(container.scrollTop)
          : 0,
        Number(container.getAttribute?.('data-gallery-last-scroll')) > 0
          ? Number(container.getAttribute('data-gallery-last-scroll'))
          : 0,
      );
  if (!Number.isFinite(n) || n < 0) return;
  overlayScrollByKey.set(key, n);
  if (placeId && n > 0) rememberPlaceGalleryScroll(placeId, n);
}

/**
 * @param {unknown} overlayKey
 * @returns {number}
 */
export function consumeScrollAfterOverlay(overlayKey) {
  const key = String(overlayKey || '').trim();
  if (!key) return 0;
  const n = overlayScrollByKey.get(key);
  overlayScrollByKey.delete(key);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const GALLERY_SCROLL_REALIGN_TIMEOUT_MS = 1500;
const GALLERY_SCROLL_REALIGN_MAX_MS = GALLERY_SCROLL_REALIGN_TIMEOUT_MS * 3;
/** Wheel/touch cancel only after restore grace — avoids aborting programmatic realign. */
export const GALLERY_SCROLL_USER_INTENT_GRACE_MS = 450;

function isGalleryImgInContainerViewport(container, img) {
  if (!container || !img || typeof container.getBoundingClientRect !== 'function') return false;
  if (typeof img.getBoundingClientRect !== 'function') return false;
  const cRect = container.getBoundingClientRect();
  const iRect = img.getBoundingClientRect();
  return iRect.bottom > cRect.top && iRect.top < cRect.bottom;
}

/**
 * One deferred scroll re-apply after in-viewport images finish loading (layout shift on WebKit).
 * Cancels on user input; hard timeout drops listeners so lazy offscreen loads never pull scroll.
 * @param {Element | null | undefined} container
 * @param {number} scrollTop
 * @param {() => void} [onDone]
 * @returns {() => void}
 */
export function scheduleOneGalleryScrollRealignAfterImages(container, scrollTop, onDone) {
  const top = Number(scrollTop);
  if (!container || !Number.isFinite(top) || top <= 0) {
    onDone?.();
    return () => {};
  }

  let finished = false;
  let applying = false;
  let rafId = 0;
  let timeoutId = 0;
  const trackedImgs = [];
  let userIntentListenersActive = false;
  let userIntentGraceDone = false;
  let userIntentGraceTimer = 0;
  let resizeObserver;
  const realignStartedAt = Date.now();

  const detachImgListeners = () => {
    for (const [img, onLoad, onError] of trackedImgs) {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    }
    trackedImgs.length = 0;
  };

  const detachUserIntentListeners = () => {
    if (!userIntentListenersActive || typeof window === 'undefined') return;
    userIntentListenersActive = false;
    window.removeEventListener('wheel', onUserIntent, true);
    window.removeEventListener('touchstart', onUserIntent, true);
    window.removeEventListener('keydown', onUserIntent, true);
  };

  const detachAll = () => {
    detachImgListeners();
    detachUserIntentListeners();
    if (rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = 0;
    }
    if (userIntentGraceTimer) {
      clearTimeout(userIntentGraceTimer);
      userIntentGraceTimer = 0;
    }
    resizeObserver?.disconnect();
    resizeObserver = undefined;
  };

  const finish = (force = false) => {
    if (finished) return;
    if (!force && !scrollApplied() && Date.now() - realignStartedAt < GALLERY_SCROLL_REALIGN_MAX_MS) {
      return;
    }
    finished = true;
    detachAll();
    onDone?.();
  };

  const abort = () => {
    finish(true);
  };

  const maxScrollTop = () =>
    Math.max(0, container.scrollHeight - container.clientHeight);

  const scrollApplied = () => {
    if (maxScrollTop() + 8 < top) return false;
    return Math.abs(container.scrollTop - top) <= 8;
  };

  const applyScroll = () => {
    applying = true;
    container.scrollTop = top;
    if (typeof setTimeout === 'function') {
      setTimeout(() => {
        applying = false;
      }, 96);
    } else if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        applying = false;
      });
    } else {
      applying = false;
    }
  };

  const tryApply = () => {
    if (finished) return;
    applyScroll();
    if (scrollApplied()) finish(true);
  };

  const scheduleApply = () => {
    if (finished) return;
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(tryApply);
    } else {
      tryApply();
    }
  };

  const onUserIntent = () => {
    if (finished || applying || !userIntentGraceDone) return;
    abort();
  };

  const attachUserIntentListeners = () => {
    if (userIntentListenersActive || typeof window === 'undefined') return;
    userIntentListenersActive = true;
    window.addEventListener('wheel', onUserIntent, { capture: true, passive: true });
    window.addEventListener('touchstart', onUserIntent, { capture: true, passive: true });
    window.addEventListener('keydown', onUserIntent, { capture: true, passive: true });
  };

  if (typeof setTimeout === 'function') {
    userIntentGraceTimer = setTimeout(() => {
      userIntentGraceDone = true;
      userIntentGraceTimer = 0;
      attachUserIntentListeners();
    }, GALLERY_SCROLL_USER_INTENT_GRACE_MS);
  } else {
    userIntentGraceDone = true;
    attachUserIntentListeners();
  }

  const imgs = container.querySelectorAll('img');
  let pending = 0;
  const onImgSettled = () => {
    pending -= 1;
    if (pending <= 0) scheduleApply();
  };

  for (const img of imgs) {
    if (img.complete) continue;
    if (!isGalleryImgInContainerViewport(container, img)) continue;
    pending += 1;
    const onLoad = () => onImgSettled();
    const onError = () => onImgSettled();
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
    trackedImgs.push([img, onLoad, onError]);
  }

  if (pending === 0) {
    scheduleApply();
  }

  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(() => {
      tryApply();
    });
    resizeObserver.observe(container);
  }

  timeoutId = setTimeout(() => {
    if (finished) return;
    applyScroll();
    finish(true);
  }, GALLERY_SCROLL_REALIGN_MAX_MS);

  return abort;
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

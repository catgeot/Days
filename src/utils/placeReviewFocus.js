import { EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM } from '../logbookOfficialReviews/constants.js';
import { isGateoLogbookReviewHubEnabled } from '../shared/gateoFeatureFlags.js';

function hubAlignedPlaceReviewFocusEnabled() {
  return isGateoLogbookReviewHubEnabled();
}

export const PLACE_REVIEW_ANCHOR_PREFIX = 'place-review-';

const HIGHLIGHT_CLASS = 'place-review-focus-highlight';
const HIGHLIGHT_STATIC_CLASS = 'place-review-focus-highlight-static';

export const PLACE_REVIEW_USER_INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown'];

/**
 * @param {string | number | null | undefined} reviewId
 * @returns {string | null}
 */
export function placeReviewDomId(reviewId) {
  const id = String(reviewId ?? '').trim();
  if (!id) return null;
  return `${PLACE_REVIEW_ANCHOR_PREFIX}${id}`;
}

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {string | null}
 */
export function parsePlaceReviewFocusId(search) {
  const raw = search instanceof URLSearchParams
    ? search
    : new URLSearchParams(String(search ?? '').replace(/^\?/, ''));
  const value = raw.get(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM);
  const id = String(value ?? '').trim();
  return id || null;
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {URLSearchParams}
 */
export function placeReviewFocusSearchWithoutReview(searchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM);
  return next;
}

/**
 * @param {string | null | undefined} placePath
 * @param {string | number | null | undefined} reviewId
 * @returns {string}
 */
export function buildPlaceReviewsHref(placePath, reviewId) {
  const base = String(placePath ?? '').trim();
  if (!base) return '';
  const id = String(reviewId ?? '').trim();
  if (!id) return `${base}/reviews`;
  return `${base}/reviews?${EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM}=${encodeURIComponent(id)}`;
}

/**
 * @param {string | number} reviewId
 * @param {ParentNode} [root]
 * @returns {HTMLElement | null}
 */
function escapeCssIdent(value) {
  const raw = String(value ?? '');
  const Css = globalThis.CSS;
  if (Css && typeof Css.escape === 'function') {
    return Css.escape(raw);
  }
  return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function cssReviewIdSelector(reviewId) {
  const id = String(reviewId ?? '').trim();
  if (!id) return null;
  return `[data-review-id="${escapeCssIdent(id)}"]`;
}

function findPlaceReviewElementLegacy(reviewId, root = null) {
  const doc = root?.ownerDocument || root || globalThis.document;
  if (!doc) return null;
  const domId = placeReviewDomId(reviewId);
  if (domId && typeof doc.getElementById === 'function') {
    const byId = doc.getElementById(domId);
    if (byId) return byId;
  }
  const scope = typeof root?.querySelector === 'function' ? root : doc;
  return scope.querySelector?.(`[data-review-id="${reviewId}"]`) ?? null;
}

export function findPlaceReviewElement(reviewId, root = null) {
  if (!hubAlignedPlaceReviewFocusEnabled()) {
    return findPlaceReviewElementLegacy(reviewId, root);
  }

  const doc = root?.ownerDocument || root || globalThis.document;
  if (!doc) return null;
  const domId = placeReviewDomId(reviewId);
  const scrollRoot =
    typeof root?.querySelector === 'function' && root?.hasAttribute?.('data-place-reviews-scroll-root')
      ? root
      : doc.querySelector?.('[data-place-reviews-scroll-root]');

  if (domId && scrollRoot?.querySelector) {
    const inRoot = scrollRoot.querySelector(`#${escapeCssIdent(domId)}`);
    if (inRoot) return inRoot;
  }
  if (domId && typeof doc.getElementById === 'function') {
    const byId = doc.getElementById(domId);
    if (byId && (!scrollRoot || scrollRoot.contains(byId))) return byId;
  }

  const attrSel = cssReviewIdSelector(reviewId);
  if (!attrSel) return null;
  if (scrollRoot?.querySelector) {
    const inRoot = scrollRoot.querySelector(attrSel);
    if (inRoot) return inRoot;
  }
  const scope = typeof root?.querySelector === 'function' ? root : doc;
  return scope.querySelector?.(attrSel) ?? null;
}

function isPlaceReviewFocusTargetVisible(element) {
  if (!element?.isConnected) return false;
  if (typeof window === 'undefined') return true;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function resolvePlaceReviewsScrollRoot(scrollRoot, reviewElement) {
  if (scrollRoot?.contains?.(reviewElement)) return scrollRoot;
  const fromEl = reviewElement?.closest?.('[data-place-reviews-scroll-root]');
  if (fromEl) return fromEl;
  return scrollRoot || null;
}

export function prefersReducedMotionForReviewFocus() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * @param {HTMLElement | null} element
 * @returns {() => void}
 */
export function flashPlaceReviewHighlight(element) {
  if (!element) return () => {};
  element.classList.remove(HIGHLIGHT_CLASS, HIGHLIGHT_STATIC_CLASS);
  void element.offsetWidth;
  const timers = [];
  if (prefersReducedMotionForReviewFocus()) {
    element.classList.add(HIGHLIGHT_STATIC_CLASS);
    timers.push(window.setTimeout(() => {
      element.classList.remove(HIGHLIGHT_STATIC_CLASS);
    }, 1500));
  } else {
    element.classList.add(HIGHLIGHT_CLASS);
    timers.push(window.setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, 1550));
  }
  return () => {
    timers.forEach((id) => clearTimeout(id));
    element.classList.remove(HIGHLIGHT_CLASS, HIGHLIGHT_STATIC_CLASS);
  };
}

/**
 * @param {HTMLElement | null} scrollRoot
 * @returns {number}
 */
export function measurePlaceReviewScrollHeaderOffset(scrollRoot) {
  const base = 12;
  if (typeof window === 'undefined') return base + 88;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (!scrollRoot) return base + (isMobile ? 88 : 16);
  if (!hubAlignedPlaceReviewFocusEnabled()) {
    const nav = scrollRoot.querySelector('[data-place-reviews-scroll-chrome]');
    const navHeight = nav ? nav.getBoundingClientRect().height : (isMobile ? 44 : 0);
    return base + navHeight;
  }
  const rootRect = scrollRoot.getBoundingClientRect();
  const chromeNodes = scrollRoot.querySelectorAll('[data-place-reviews-scroll-chrome]');
  let chromeBottom = rootRect.top;
  chromeNodes.forEach((node) => {
    chromeBottom = Math.max(chromeBottom, node.getBoundingClientRect().bottom);
  });
  let navHeight = chromeBottom - rootRect.top;
  if (navHeight <= 0) {
    navHeight = isMobile ? 88 : 0;
  }
  return base + navHeight;
}

/**
 * @param {HTMLElement | null} scrollRoot
 * @param {string | number} reviewId
 * @param {{ headerOffset?: number, behavior?: ScrollBehavior, onScheduleTimer?: (id: number) => void }} [options]
 * @returns {boolean}
 */
function scrollPlaceReviewIntoViewLegacy(scrollRoot, reviewId, options = {}) {
  const el = findPlaceReviewElement(reviewId);
  if (!el) return false;

  const headerOffset = options.headerOffset ?? measurePlaceReviewScrollHeaderOffset(scrollRoot);
  const behavior = prefersReducedMotionForReviewFocus()
    ? 'auto'
    : (options.behavior ?? 'smooth');

  if (scrollRoot && scrollRoot.contains(el)) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const nextTop = Math.max(0, scrollRoot.scrollTop + (elRect.top - rootRect.top) - headerOffset);
    if (behavior === 'auto') {
      scrollRoot.scrollTop = nextTop;
    } else {
      scrollRoot.scrollTo({ top: nextTop, behavior });
      const timerId = window.setTimeout(() => {
        if (Math.abs(scrollRoot.scrollTop - nextTop) > 6) {
          scrollRoot.scrollTop = nextTop;
        }
      }, 450);
      options.onScheduleTimer?.(timerId);
    }
  } else {
    el.scrollIntoView({ behavior, block: 'start' });
  }
  return true;
}

export function scrollPlaceReviewIntoView(scrollRoot, reviewId, options = {}) {
  if (!hubAlignedPlaceReviewFocusEnabled()) {
    return scrollPlaceReviewIntoViewLegacy(scrollRoot, reviewId, options);
  }

  const el = findPlaceReviewElement(reviewId);
  if (!el) return false;

  const headerOffset = options.headerOffset ?? measurePlaceReviewScrollHeaderOffset(scrollRoot);
  const behavior = prefersReducedMotionForReviewFocus()
    ? 'auto'
    : (options.behavior ?? 'smooth');

  const activeRoot = resolvePlaceReviewsScrollRoot(scrollRoot, el);
  if (activeRoot?.contains(el)) {
    const rootRect = activeRoot.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const chromeNodes = activeRoot.querySelectorAll('[data-place-reviews-scroll-chrome]');
    let chromeBottom = rootRect.top;
    chromeNodes.forEach((node) => {
      chromeBottom = Math.max(chromeBottom, node.getBoundingClientRect().bottom);
    });
    const gapBase = 4;
    const desiredCardTop = chromeBottom + gapBase;
    const nextTop = Math.max(0, activeRoot.scrollTop + (elRect.top - desiredCardTop));
    if (behavior === 'auto') {
      activeRoot.scrollTop = nextTop;
    } else {
      activeRoot.scrollTo({ top: nextTop, behavior });
      const timerId = window.setTimeout(() => {
        if (Math.abs(activeRoot.scrollTop - nextTop) > 6) {
          activeRoot.scrollTop = nextTop;
        }
      }, 450);
      options.onScheduleTimer?.(timerId);
    }
    const realignDelays = options.realignDelays ?? [120, 320, 520];
    for (const delay of realignDelays) {
      const realignId = window.setTimeout(() => {
        if (!activeRoot.contains(el)) return;
        const rr = activeRoot.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        let chromeEdge = rr.top;
        activeRoot.querySelectorAll('[data-place-reviews-scroll-chrome]').forEach((node) => {
          chromeEdge = Math.max(chromeEdge, node.getBoundingClientRect().bottom);
        });
        const corrected = Math.max(0, activeRoot.scrollTop + (er.top - (chromeEdge + gapBase)));
        activeRoot.scrollTop = corrected;
      }, delay);
      options.onScheduleTimer?.(realignId);
    }
  } else {
    el.scrollIntoView({ behavior, block: 'start' });
  }
  return true;
}

/**
 * @typedef {'found' | 'timeout' | 'user-interacted' | 'aborted'} PlaceReviewFocusEndReason
 * @typedef {{ ok: boolean, reason: PlaceReviewFocusEndReason }} PlaceReviewFocusResult
 */

/**
 * @param {string | number} reviewId
 * @param {HTMLElement | null} scrollRoot
 * @param {{ maxWaitMs?: number, pollMs?: number, headerOffset?: number, programmaticScrollGraceMs?: number }} [options]
 * @returns {{ promise: Promise<PlaceReviewFocusResult>, abort: () => void }}
 */
export function startPlaceReviewFocusSession(reviewId, scrollRoot, options = {}) {
  const maxWait = options.maxWaitMs ?? 12_000;
  const poll = options.pollMs ?? 80;
  const graceMs = options.programmaticScrollGraceMs ?? 500;
  const start = Date.now();
  const guardTimers = new Set();
  const scrollCorrectTimers = new Set();
  const listeners = [];
  let settled = false;
  /** @type {PlaceReviewFocusResult | null} */
  let lastResult = null;
  let ignoreUserScrollUntil = 0;
  let clearHighlight = () => {};

  const trackGuardTimer = (id) => {
    guardTimers.add(id);
    return id;
  };

  const trackScrollCorrectTimer = (id) => {
    scrollCorrectTimers.add(id);
    return id;
  };

  const detachGuards = () => {
    guardTimers.forEach((id) => clearTimeout(id));
    guardTimers.clear();
    listeners.forEach(([target, type, handler, opts]) => {
      target.removeEventListener(type, handler, opts);
    });
    listeners.length = 0;
  };

  const detachScrollCorrectTimers = () => {
    scrollCorrectTimers.forEach((id) => clearTimeout(id));
    scrollCorrectTimers.clear();
  };

  let resolvePromise = () => {};

  const finish = (result) => {
    if (settled) return;
    settled = true;
    lastResult = result;
    detachGuards();
    if (result.reason !== 'found') {
      detachScrollCorrectTimers();
      clearHighlight();
      clearHighlight = () => {};
    }
    resolvePromise(result);
  };

  const abort = () => {
    clearHighlight();
    clearHighlight = () => {};
    detachGuards();
    detachScrollCorrectTimers();
    if (!settled) {
      settled = true;
      lastResult = { ok: false, reason: 'aborted' };
      resolvePromise(lastResult);
    }
  };

  /** After successful focus + URL strip: stop polling/guards but keep highlight + scroll correction. */
  const release = () => {
    detachGuards();
    if (!settled) {
      abort();
    }
  };

  const attachUserInputGuards = (root) => {
    if (!root) return;
    const onUserInput = () => {
      if (settled || Date.now() < ignoreUserScrollUntil) return;
      finish({ ok: false, reason: 'user-interacted' });
    };
    for (const type of PLACE_REVIEW_USER_INPUT_EVENTS) {
      root.addEventListener(type, onUserInput, { passive: true });
      listeners.push([root, type, onUserInput, { passive: true }]);
    }
  };

  attachUserInputGuards(scrollRoot);

  const promise = new Promise((resolve) => {
    resolvePromise = resolve;

    const attempt = () => {
      if (settled) return;

      const el = findPlaceReviewElement(reviewId, scrollRoot);
      const root = hubAlignedPlaceReviewFocusEnabled()
        ? resolvePlaceReviewsScrollRoot(scrollRoot, el)
        : scrollRoot;
      const ready =
        el &&
        root &&
        root.clientHeight > 0 &&
        root.contains(el) &&
        (!hubAlignedPlaceReviewFocusEnabled() || isPlaceReviewFocusTargetVisible(el));

      if (ready) {
        ignoreUserScrollUntil = Date.now() + graceMs;
        const ok = scrollPlaceReviewIntoView(root, reviewId, {
          ...options,
          onScheduleTimer: (id) => trackScrollCorrectTimer(id),
        });
        if (ok) {
          clearHighlight = flashPlaceReviewHighlight(el);
        }
        finish({ ok: Boolean(ok), reason: 'found' });
        return;
      }

      if (Date.now() - start >= maxWait) {
        finish({ ok: false, reason: 'timeout' });
        return;
      }

      trackGuardTimer(window.setTimeout(attempt, poll));
    };

    attempt();
  });

  const getResult = () => lastResult;

  return { promise, abort, release, getResult };
}

/** @deprecated use startPlaceReviewFocusSession */
export function waitForPlaceReviewThenFocus(reviewId, scrollRoot, options = {}) {
  const { promise } = startPlaceReviewFocusSession(reviewId, scrollRoot, options);
  return promise.then((result) => result.ok);
}

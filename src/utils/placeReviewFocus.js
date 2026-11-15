import { EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM } from '../logbookOfficialReviews/constants.js';

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

/** History state kept after `?review=` is replaced away, so Back restores the same review. */
export const PLACE_REVIEW_FOCUS_STATE_ID = 'focusedPlaceReviewId';
export const PLACE_REVIEW_FOCUS_STATE_SLUG = 'focusedPlaceReviewSlug';

/**
 * Move the deep-linked review to index 0. Date order stays for every other row.
 * Same array reference when nothing changes.
 * @param {Array<{ id?: string | number }> | null | undefined} reviews
 * @param {string | number | null | undefined} focusId
 */
export function orderPlaceReviewsForDeepLink(reviews, focusId) {
  if (!Array.isArray(reviews) || reviews.length < 2) return reviews;
  const id = String(focusId ?? '').trim();
  if (!id) return reviews;
  const index = reviews.findIndex((review) => String(review?.id ?? '') === id);
  if (index <= 0) return reviews;
  return [reviews[index], ...reviews.slice(0, index), ...reviews.slice(index + 1)];
}

/**
 * @param {unknown} prevState
 * @param {string | number | null | undefined} reviewId
 * @param {string | null | undefined} placeSlug
 */
export function withPlaceReviewFocusHistory(prevState, reviewId, placeSlug) {
  const id = String(reviewId ?? '').trim();
  const slug = String(placeSlug ?? '').trim();
  const prev = prevState && typeof prevState === 'object' ? prevState : {};
  if (!id || !slug) return prevState ?? null;
  return {
    ...prev,
    [PLACE_REVIEW_FOCUS_STATE_ID]: id,
    [PLACE_REVIEW_FOCUS_STATE_SLUG]: slug,
  };
}

/**
 * @param {unknown} state
 * @param {string | null | undefined} placeSlug
 * @returns {string | null}
 */
export function readPlaceReviewFocusIdFromHistory(state, placeSlug) {
  if (!state || typeof state !== 'object') return null;
  const slug = String(placeSlug ?? '').trim();
  const stateSlug = String(state[PLACE_REVIEW_FOCUS_STATE_SLUG] ?? '').trim();
  if (!slug || stateSlug !== slug) return null;
  const id = String(state[PLACE_REVIEW_FOCUS_STATE_ID] ?? '').trim();
  return id || null;
}

/** React Router keeps location state on `history.state.usr`. Back can restore it before the router does. */
export function readBrowserHistoryUserState() {
  if (typeof window === 'undefined' || !window.history) return null;
  const raw = window.history.state;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.usr && typeof raw.usr === 'object') return raw.usr;
  return raw;
}

export function readPlaceReviewFocusIdFromBrowser(placeSlug) {
  return readPlaceReviewFocusIdFromHistory(readBrowserHistoryUserState(), placeSlug);
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
function reviewSelectorId(value) {
  return String(value ?? '').replace(/"/g, '');
}

export function findPlaceReviewElement(reviewId, root = null) {
  const doc = root?.ownerDocument || root || globalThis.document;
  if (!doc) return null;
  const domId = placeReviewDomId(reviewId);
  if (root && typeof root.querySelector === 'function') {
    if (domId) {
      const byId = root.querySelector(`[id="${reviewSelectorId(domId)}"]`);
      if (byId) return byId;
    }
    return root.querySelector(`[data-review-id="${reviewSelectorId(reviewId)}"]`);
  }
  if (domId && typeof doc.getElementById === 'function') {
    const byId = doc.getElementById(domId);
    if (byId) return byId;
  }
  return doc.querySelector?.(`[data-review-id="${reviewSelectorId(reviewId)}"]`) ?? null;
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
  const nav = scrollRoot.querySelector('[data-place-reviews-scroll-chrome]');
  const navHeight = nav ? nav.getBoundingClientRect().height : (isMobile ? 44 : 0);
  return base + navHeight;
}

/**
 * @param {HTMLElement | null} scrollRoot
 * @param {string | number} reviewId
 * @param {{ headerOffset?: number, behavior?: ScrollBehavior, onScheduleTimer?: (id: number) => void }} [options]
 * @returns {boolean}
 */
export function scrollPlaceReviewIntoView(scrollRoot, reviewId, options = {}) {
  const el = scrollRoot
    ? findPlaceReviewElement(reviewId, scrollRoot)
    : findPlaceReviewElement(reviewId);
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

      const el = scrollRoot
        ? findPlaceReviewElement(reviewId, scrollRoot)
        : findPlaceReviewElement(reviewId);
      const root = scrollRoot || el?.closest('[data-place-reviews-scroll-root]');
      const ready = el && root && root.clientHeight > 0 && el.offsetParent !== null;

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

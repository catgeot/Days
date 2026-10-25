import { EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM } from '../logbookOfficialReviews/constants.js';

export const PLACE_REVIEW_ANCHOR_PREFIX = 'place-review-';

const HIGHLIGHT_CLASS = 'place-review-focus-highlight';
const HIGHLIGHT_STATIC_CLASS = 'place-review-focus-highlight-static';

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
export function findPlaceReviewElement(reviewId, root = typeof document !== 'undefined' ? document : null) {
  if (!root) return null;
  const domId = placeReviewDomId(reviewId);
  if (domId && root instanceof Document) {
    const byId = root.getElementById(domId);
    if (byId) return byId;
  }
  const scoped = root instanceof Document ? root : root;
  return scoped.querySelector?.(`[data-review-id="${reviewId}"]`) ?? null;
}

export function prefersReducedMotionForReviewFocus() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * @param {HTMLElement | null} element
 */
export function flashPlaceReviewHighlight(element) {
  if (!element) return;
  element.classList.remove(HIGHLIGHT_CLASS, HIGHLIGHT_STATIC_CLASS);
  void element.offsetWidth;
  if (prefersReducedMotionForReviewFocus()) {
    element.classList.add(HIGHLIGHT_STATIC_CLASS);
    window.setTimeout(() => {
      element.classList.remove(HIGHLIGHT_STATIC_CLASS);
    }, 1500);
    return;
  }
  element.classList.add(HIGHLIGHT_CLASS);
  window.setTimeout(() => {
    element.classList.remove(HIGHLIGHT_CLASS);
  }, 1550);
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
 * @param {{ headerOffset?: number, behavior?: ScrollBehavior }} [options]
 * @returns {boolean}
 */
export function scrollPlaceReviewIntoView(scrollRoot, reviewId, options = {}) {
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
      window.setTimeout(() => {
        if (Math.abs(scrollRoot.scrollTop - nextTop) > 6) {
          scrollRoot.scrollTop = nextTop;
        }
      }, 450);
    }
  } else {
    el.scrollIntoView({ behavior, block: 'start' });
  }
  return true;
}

/**
 * @param {string | number} reviewId
 * @param {HTMLElement | null} scrollRoot
 * @param {{ maxWaitMs?: number, pollMs?: number, headerOffset?: number }} [options]
 * @returns {Promise<boolean>}
 */
export function waitForPlaceReviewThenFocus(reviewId, scrollRoot, options = {}) {
  const maxWait = options.maxWaitMs ?? 12_000;
  const poll = options.pollMs ?? 80;
  const start = Date.now();

  return new Promise((resolve) => {
    const attempt = () => {
      const el = findPlaceReviewElement(reviewId);
      const root = scrollRoot || el?.closest('[data-place-reviews-scroll-root]');
      const ready = el && root && root.clientHeight > 0 && el.offsetParent !== null;
      if (ready) {
        const ok = scrollPlaceReviewIntoView(root, reviewId, options);
        if (ok) flashPlaceReviewHighlight(el);
        resolve(true);
        return;
      }
      if (Date.now() - start >= maxWait) {
        if (scrollRoot) {
          scrollRoot.scrollTo({ top: 0, behavior: 'auto' });
        }
        resolve(false);
        return;
      }
      window.setTimeout(attempt, poll);
    };
    attempt();
  });
}

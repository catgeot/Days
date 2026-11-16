import { isInAppRelativePath } from './appHistoryPathIndex.js';

const RETURN_KEY = 'gateo:logbook-detail-return';
const ORIGIN_KEY = 'gateo:logbook-reader-origin';
const SCROLL_KEY = 'gateo:logbook-detail-scroll';
const EMPTY_REFERRER_MS = 15_000;
const ORIGIN_TTL_MS = 30 * 60 * 1000;

/** history.state / location.state field that binds one internal-link navigation. */
export const LOGBOOK_READER_ORIGIN_NONCE = 'logbookReaderOriginNonce';

export function isLogbookReaderPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  const pathname = path.split('?')[0].split('#')[0];
  return pathname.startsWith('/blog/e/') || /^\/p\/[^/]+$/.test(pathname);
}

const BLOG_OWNER_RESERVED = new Set(['curation', 'write', 'e']);

/** Logged-in post at /blog/:id. List, write, and curation stay out. */
export function isBlogOwnerArticlePath(path) {
  const match = pathnameOf(path).match(/^\/blog\/([^/]+)$/);
  if (!match) return false;
  return !BLOG_OWNER_RESERVED.has(match[1]);
}

/** Place review article, including ?review= deep links. */
export function isPlaceReviewReaderPath(path) {
  return /^\/place\/[^/]+\/reviews$/.test(pathnameOf(path));
}

/**
 * Body the reader was on before an in-body place or festival link.
 * Public editorial, short /p/:id, owner /blog/:id, and /place/:slug/reviews.
 */
export function isArticleReaderPath(path) {
  return isLogbookReaderPath(path) || isBlogOwnerArticlePath(path) || isPlaceReviewReaderPath(path);
}

export const ARTICLE_REVIEWS_SCROLL_SELECTOR = '[data-place-reviews-scroll-root]';
export const ARTICLE_DASHBOARD_SCROLL_SELECTOR = '[data-logbook-main-scroll]';

/**
 * Same-origin referrer path (no hash). Origin-only referrers count as in-app
 * so history.back() can restore the real previous entry.
 * @param {unknown} referrer
 * @param {unknown} origin
 */
export function sameOriginAppPath(referrer, origin) {
  if (typeof referrer !== 'string' || !referrer || typeof origin !== 'string' || !origin) return null;
  let url;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const path = `${url.pathname}${url.search}`;
  return isInAppRelativePath(path) ? path : null;
}

function pathnameOf(path) {
  return String(path || '').split('?')[0].split('#')[0];
}

/**
 * ← on /blog/e/:slug and /p/:id.
 * In-app SPA history or a same-origin document referrer goes back.
 * Direct entry, a new tab (history length 1), and an external referrer use fallback.
 *
 * @param {{
 *   historyIdx?: number | null,
 *   prevPath?: string | null,
 *   historyLength?: number | null,
 *   referrer?: string | null,
 *   origin?: string | null,
 *   returnTo?: string | null,
 *   fallback?: string,
 * }} input
 * @returns {{ type: 'history' } | { type: 'assign', path: string }}
 */
export function resolveLogbookDetailBack(input) {
  const fallback = typeof input?.fallback === 'string' && input.fallback.startsWith('/')
    ? input.fallback
    : '/blog';
  const historyIdx = input?.historyIdx;
  const prevPath = typeof input?.prevPath === 'string' ? input.prevPath : null;
  const prevName = pathnameOf(prevPath);

  if (typeof historyIdx === 'number' && historyIdx > 0 && (prevPath == null || isInAppRelativePath(prevPath))) {
    // Place/explore live in another layout. A SPA pop races Helmet removeChild (#803).
    if (prevPath && (prevName.startsWith('/place/') || prevName.startsWith('/explore'))) {
      return { type: 'assign', path: prevPath };
    }
    return { type: 'history' };
  }

  const historyLength = input?.historyLength;
  const referrerPath = sameOriginAppPath(input?.referrer, input?.origin);
  if (typeof historyLength === 'number' && historyLength > 1 && referrerPath) {
    return { type: 'history' };
  }

  const returnTo = typeof input?.returnTo === 'string' ? input.returnTo : null;
  const referrer = typeof input?.referrer === 'string' ? input.referrer : '';
  const externalReferrer = Boolean(referrer) && !referrerPath;
  if (
    returnTo &&
    isInAppRelativePath(returnTo) &&
    typeof historyLength === 'number' &&
    historyLength > 1 &&
    !externalReferrer
  ) {
    return { type: 'assign', path: returnTo };
  }

  return { type: 'assign', path: fallback };
}

export function performLogbookDetailBack(action) {
  if (typeof window === 'undefined') return;
  if (action?.type === 'history') {
    window.history.back();
    return;
  }
  const path = typeof action?.path === 'string' && action.path.startsWith('/') ? action.path : '/blog';
  window.location.assign(path);
}

function readJson(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function clearLogbookDetailReturn() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearLogbookReaderOrigin() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ORIGIN_KEY);
  } catch {
    /* ignore */
  }
}

/** Call before leaving the current page for /blog/e/* or /p/:id. */
export function rememberLogbookDetailReturn(destinationHref) {
  if (typeof window === 'undefined' || !destinationHref) return;
  let dest;
  try {
    dest = new URL(String(destinationHref), window.location.href);
  } catch {
    return;
  }
  if (dest.origin !== window.location.origin) return;
  const forPath = `${dest.pathname}${dest.search}`;
  if (!isLogbookReaderPath(forPath)) return;
  writeJson(RETURN_KEY, {
    path: `${window.location.pathname}${window.location.search}`,
    forPath,
    savedAt: Date.now(),
  });
}

/**
 * @param {object | null} stored
 * @param {{ currentPath: string, referrer?: string, origin?: string, now?: number, navType?: string }} ctx
 */
export function selectLogbookDetailReturn(stored, ctx) {
  if (!stored || typeof stored.path !== 'string' || !isInAppRelativePath(stored.path)) return null;
  if (!isLogbookReaderPath(ctx?.currentPath || '')) return null;
  if (pathnameOf(stored.forPath) !== pathnameOf(ctx.currentPath)) return null;
  const referrer = typeof ctx.referrer === 'string' ? ctx.referrer : '';
  const referrerPath = sameOriginAppPath(referrer, ctx.origin);
  if (referrer && !referrerPath) return null;
  if (!referrer) {
    const age = (ctx.now ?? 0) - (stored.savedAt ?? 0);
    const freshNavigate = ctx.navType === 'navigate' && age >= 0 && age < EMPTY_REFERRER_MS;
    const reload = ctx.navType === 'reload';
    if (!freshNavigate && !reload) return null;
  }
  return stored.path;
}

export function readLogbookDetailReturn(currentPath) {
  if (typeof window === 'undefined') return null;
  let navType = 'navigate';
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && typeof nav.type === 'string') navType = nav.type;
  } catch {
    /* ignore */
  }
  return selectLogbookDetailReturn(readJson(RETURN_KEY), {
    currentPath,
    referrer: document.referrer,
    origin: window.location.origin,
    now: Date.now(),
    navType,
  });
}

/**
 * Origin stored for one internal-link hop. The place page may use it only when
 * its history entry carries the same nonce.
 * @param {object | null} stored
 * @param {unknown} nonce
 * @param {number} [now]
 */
export function selectLogbookReaderOrigin(stored, nonce, now = Date.now()) {
  if (typeof nonce !== 'string' || !nonce) return null;
  if (!stored || stored.nonce !== nonce) return null;
  if (typeof stored.path !== 'string' || !isArticleReaderPath(stored.path)) return null;
  if (now - (stored.savedAt || 0) > ORIGIN_TTL_MS) return null;
  return stored.path;
}

const pendingLinkMeta = new WeakMap();
let manualScrollHeld = false;
let manualScrollGen = 0;

function isDomElement(value) {
  return typeof Element !== 'undefined' && value instanceof Element;
}

/**
 * Scroll that keeps the clicked anchor at the same viewport offset.
 * Falls back to the pre-click scrollY when that anchor is not available.
 * @param {{ scrollY?: number, anchorDocTop?: number } | null | undefined} saved
 * @param {number} anchorDocTop
 */
export function articleClickedLinkScrollY(saved, anchorDocTop) {
  const y = Number(saved?.scrollY);
  if (!Number.isFinite(y) || y < 0) return 0;
  const savedDoc = Number(saved?.anchorDocTop);
  const now = Number(anchorDocTop);
  if (!Number.isFinite(savedDoc) || !Number.isFinite(now)) return y;
  const target = now - (savedDoc - y);
  if (!Number.isFinite(target)) return y;
  return Math.max(0, Math.round(target));
}

/**
 * @param {{ scrollY?: number, anchorDocTop?: number, linkHref?: string, linkIndex?: number } | null | undefined} saved
 * @param {Array<{ href?: string, docTop?: number }> | null | undefined} anchors
 */
export function articleLinkRestoreTarget(saved, anchors) {
  const y = Number(saved?.scrollY);
  if (!Number.isFinite(y) || y < 0) return 0;
  const href = typeof saved?.linkHref === 'string' ? saved.linkHref : '';
  const index = Number.isInteger(saved?.linkIndex) ? saved.linkIndex : -1;
  if (!href || index < 0 || !Array.isArray(anchors)) return y;
  const row = anchors.filter((item) => item && item.href === href)[index];
  if (!row || !Number.isFinite(Number(row.docTop))) return y;
  return articleClickedLinkScrollY(saved, Number(row.docTop));
}

/** Pointer-down snapshot so restore prefers the anchor that was pressed. */
export function noteArticleLinkPointer(anchor) {
  if (!isDomElement(anchor) || typeof window === 'undefined') return;
  const href = anchor.getAttribute('href') || '';
  const root = anchor.closest('.logbook-body, [data-review-body]') || anchor.ownerDocument;
  const matches = [...root.querySelectorAll('a[href]')]
    .filter((el) => (el.getAttribute('href') || '') === href);
  const scrollY = window.scrollY || document.documentElement?.scrollTop || 0;
  pendingLinkMeta.set(anchor, {
    notedAt: Date.now(),
    scrollY,
    linkHref: href,
    linkIndex: matches.indexOf(anchor),
    anchorDocTop: anchor.getBoundingClientRect().top + scrollY,
  });
}

function takeArticleLinkPointer(anchor) {
  if (!isDomElement(anchor)) return null;
  const meta = pendingLinkMeta.get(anchor);
  pendingLinkMeta.delete(anchor);
  if (!meta || Date.now() - meta.notedAt > 2000) return null;
  return meta;
}

/** Keep the browser from replaying a scroll captured on the page we leave. */
export function holdManualScrollRestoration() {
  if (typeof history === 'undefined') return;
  manualScrollGen += 1;
  if (manualScrollHeld) return;
  try {
    history.scrollRestoration = 'manual';
    manualScrollHeld = true;
  } catch {
    manualScrollHeld = false;
  }
}

export function releaseManualScrollRestoration() {
  manualScrollHeld = false;
  if (typeof history === 'undefined') return;
  try {
    history.scrollRestoration = 'auto';
  } catch {
    /* ignore */
  }
}

/** @returns {string | null} nonce written into history.state for this hop */
export function rememberLogbookReaderOrigin(source) {
  if (typeof window === 'undefined') return null;
  const path = `${window.location.pathname}${window.location.search}`;
  if (!isArticleReaderPath(path)) return null;
  const captured = captureArticleScroll();
  const meta = takeArticleLinkPointer(source);
  const scrollY = meta && Number.isFinite(meta.scrollY) ? meta.scrollY : captured.scrollY;
  const nonce = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const savedAt = Date.now();
  writeJson(ORIGIN_KEY, { path, scrollY, nonce, savedAt });
  writeJson(SCROLL_KEY, {
    path,
    scrollY,
    nestedTop: captured.nestedTop,
    nestedKind: captured.nestedKind,
    reviewId: captured.reviewId || '',
    linkHref: meta?.linkHref || '',
    linkIndex: Number.isInteger(meta?.linkIndex) ? meta.linkIndex : -1,
    anchorDocTop: Number.isFinite(meta?.anchorDocTop) ? meta.anchorDocTop : 0,
    nonce,
    savedAt,
  });
  return nonce;
}

function captureArticleScroll() {
  const scrollY = window.scrollY || document.documentElement?.scrollTop || 0;
  const reviews = [...document.querySelectorAll(ARTICLE_REVIEWS_SCROLL_SELECTOR)]
    .filter((el) => el instanceof HTMLElement)
    .sort((a, b) => b.scrollTop - a.scrollTop)[0];
  if (reviews && reviews.scrollTop > 0) {
    const toggle = reviews.querySelector('[data-review-expand-toggle][aria-expanded="true"]');
    const reviewId = toggle?.closest('[data-review-id]')?.getAttribute('data-review-id') || '';
    return { scrollY, nestedTop: reviews.scrollTop, nestedKind: 'place-reviews', reviewId };
  }
  const dashboard = [...document.querySelectorAll(ARTICLE_DASHBOARD_SCROLL_SELECTOR)]
    .filter((el) => el instanceof HTMLElement)
    .sort((a, b) => b.scrollTop - a.scrollTop)[0];
  if (dashboard && dashboard.scrollTop > 0) {
    return { scrollY, nestedTop: dashboard.scrollTop, nestedKind: 'logbook-dashboard', reviewId: '' };
  }
  return { scrollY, nestedTop: 0, nestedKind: '', reviewId: '' };
}

/**
 * Nested scroller saved with the article hop. Does not consume.
 * @param {string} currentPath
 * @returns {{ kind: 'place-reviews' | 'logbook-dashboard', top: number, reviewId: string } | null}
 */
export function peekArticleNestedScroll(currentPath) {
  const data = readJson(SCROLL_KEY);
  if (!data) return null;
  if (pathnameOf(data.path) !== pathnameOf(currentPath)) return null;
  if (Date.now() - (data.savedAt || 0) > 30 * 60 * 1000) return null;
  const kind = data.nestedKind === 'place-reviews' || data.nestedKind === 'logbook-dashboard'
    ? data.nestedKind
    : '';
  const top = Number(data.nestedTop);
  if (!kind || !Number.isFinite(top) || top <= 0) return null;
  return { kind, top, reviewId: typeof data.reviewId === 'string' ? data.reviewId : '' };
}

/** @param {string} currentPath */
export function consumeArticleNestedScroll(currentPath) {
  const data = readJson(SCROLL_KEY);
  if (!data) return;
  if (pathnameOf(data.path) !== pathnameOf(currentPath)) return;
  try {
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    /* ignore */
  }
}

/** @param {unknown} nonce */
export function readLogbookReaderOrigin(nonce) {
  return selectLogbookReaderOrigin(readJson(ORIGIN_KEY), nonce);
}

function emptyArticleWindowScroll() {
  return { y: 0, linkHref: '', linkIndex: -1, anchorDocTop: 0 };
}

/** Consumes the saved window scroll for this article, including which link was pressed. */
export function takeArticleWindowScroll(currentPath) {
  const data = readJson(SCROLL_KEY);
  if (!data) return emptyArticleWindowScroll();
  try {
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    /* ignore */
  }
  if (pathnameOf(data.path) !== pathnameOf(currentPath)) return emptyArticleWindowScroll();
  const y = Number(data.scrollY);
  if (!Number.isFinite(y) || y <= 0) return emptyArticleWindowScroll();
  if (Date.now() - (data.savedAt || 0) > 30 * 60 * 1000) return emptyArticleWindowScroll();
  const anchorDocTop = Number(data.anchorDocTop);
  return {
    y,
    linkHref: typeof data.linkHref === 'string' ? data.linkHref : '',
    linkIndex: Number.isInteger(data.linkIndex) ? data.linkIndex : -1,
    anchorDocTop: Number.isFinite(anchorDocTop) ? anchorDocTop : 0,
  };
}

export function takeLogbookDetailScroll(currentPath) {
  return takeArticleWindowScroll(currentPath).y;
}

function readerAnchorRows() {
  return [...document.querySelectorAll('.logbook-body a[href]')].map((el) => ({
    href: el.getAttribute('href') || '',
    docTop: el.getBoundingClientRect().top + (window.scrollY || document.documentElement?.scrollTop || 0),
    el,
  }));
}

/**
 * Reapplies the clicked link's scroll until layout settles.
 * A newer holdManualScrollRestoration() (the next hop) keeps manual restoration.
 * @param {{ y?: number, linkHref?: string, linkIndex?: number, anchorDocTop?: number }} saved
 */
export function restoreArticleClickedScroll(saved) {
  if (typeof window === 'undefined') return () => {};
  const payload = {
    scrollY: saved?.y,
    linkHref: saved?.linkHref || '',
    linkIndex: Number.isInteger(saved?.linkIndex) ? saved.linkIndex : -1,
    anchorDocTop: saved?.anchorDocTop,
  };
  if (!payload.scrollY) return () => {};
  const genAtRestore = manualScrollGen;
  let userMoved = false;
  const markUser = () => {
    userMoved = true;
  };
  window.addEventListener('wheel', markUser, { passive: true });
  window.addEventListener('touchmove', markUser, { passive: true });
  window.addEventListener('keydown', markUser);

  let applying = false;
  const apply = () => {
    if (userMoved || applying) return;
    applying = true;
    try {
      const rows = readerAnchorRows();
      const target = articleLinkRestoreTarget(payload, rows);
      if (payload.linkHref && payload.linkIndex >= 0) {
        const matches = rows.filter((row) => row.href === payload.linkHref);
        const row = matches[payload.linkIndex];
        const active = document.activeElement;
        if (
          row?.el
          && active instanceof HTMLAnchorElement
          && matches.some((item) => item.el === active)
          && active !== row.el
        ) {
          row.el.focus({ preventScroll: true });
        }
      }
      const current = window.scrollY || document.documentElement?.scrollTop || 0;
      if (target > 0 && Math.abs(current - target) > 1) window.scrollTo(0, target);
    } finally {
      applying = false;
    }
  };

  apply();
  let frames = 0;
  let raf = 0;
  const tick = () => {
    apply();
    frames += 1;
    if (frames < 12 && !userMoved) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  window.addEventListener('scroll', onScroll, { passive: true });
  const root = document.querySelector('.logbook-body');
  const onImg = () => apply();
  const images = root ? [...root.querySelectorAll('img')] : [];
  images.forEach((img) => {
    if (!img.complete) img.addEventListener('load', onImg);
  });
  const ro = root && typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => apply())
    : null;
  ro?.observe(root);

  function onScroll() {
    apply();
  }

  const releaseIfCurrent = () => {
    if (manualScrollGen === genAtRestore) releaseManualScrollRestoration();
  };
  const timer = window.setTimeout(() => {
    remove();
    releaseIfCurrent();
  }, 1500);

  function remove() {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
    window.removeEventListener('wheel', markUser);
    window.removeEventListener('touchmove', markUser);
    window.removeEventListener('keydown', markUser);
    window.removeEventListener('scroll', onScroll);
    images.forEach((img) => img.removeEventListener('load', onImg));
    ro?.disconnect();
  }

  return () => {
    remove();
    releaseIfCurrent();
  };
}

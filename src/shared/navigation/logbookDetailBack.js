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
  if (typeof stored.path !== 'string' || !isLogbookReaderPath(stored.path)) return null;
  if (now - (stored.savedAt || 0) > ORIGIN_TTL_MS) return null;
  return stored.path;
}

/** @returns {string | null} nonce written into history.state for this hop */
export function rememberLogbookReaderOrigin() {
  if (typeof window === 'undefined') return null;
  const path = `${window.location.pathname}${window.location.search}`;
  if (!isLogbookReaderPath(path)) return null;
  const scrollY = window.scrollY || document.documentElement?.scrollTop || 0;
  const nonce = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const savedAt = Date.now();
  writeJson(ORIGIN_KEY, { path, scrollY, nonce, savedAt });
  writeJson(SCROLL_KEY, { path, scrollY, nonce, savedAt });
  return nonce;
}

/** @param {unknown} nonce */
export function readLogbookReaderOrigin(nonce) {
  return selectLogbookReaderOrigin(readJson(ORIGIN_KEY), nonce);
}

export function takeLogbookDetailScroll(currentPath) {
  const data = readJson(SCROLL_KEY);
  if (!data) return 0;
  try {
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    /* ignore */
  }
  if (pathnameOf(data.path) !== pathnameOf(currentPath)) return 0;
  const y = Number(data.scrollY);
  if (!Number.isFinite(y) || y <= 0) return 0;
  if (Date.now() - (data.savedAt || 0) > 30 * 60 * 1000) return 0;
  return y;
}

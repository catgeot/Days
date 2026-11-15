const SESSION_KEY = 'gateo:logbook-review-hub-ui';

/**
 * @typedef {{
 *   expanded?: boolean,
 *   visibleCount?: number,
 *   scrollY?: number,
 *   returnTo?: string,
 *   savedAt?: number,
 *   anchorReviewId?: string,
 *   anchorOffset?: number,
 *   cityOverflowOpen?: boolean,
 * }} LogbookReviewHubSession
 */

/** @type {LogbookReviewHubSession | null} */
let memorySession = null;

function readRaw() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {Partial<LogbookReviewHubSession>} patch */
export function snapshotLogbookReviewHubSession(patch) {
  if (typeof window === 'undefined') return;
  const prev = memorySession || readRaw() || {};
  const next = {
    ...prev,
    ...patch,
    savedAt: Date.now(),
  };
  memorySession = next;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

/** @returns {LogbookReviewHubSession | null} */
export function readLogbookReviewHubSession() {
  if (memorySession && typeof memorySession === 'object') return memorySession;
  const data = readRaw();
  if (!data || typeof data !== 'object') return null;
  memorySession = data;
  return data;
}

/**
 * @param {string} pathname
 * @param {string} search
 * @returns {LogbookReviewHubSession | null}
 */
export function readMatchingLogbookReviewHubSession(pathname, search) {
  const session = readLogbookReviewHubSession();
  if (!session) return null;
  const current = buildLogbookHubReturnTo(pathname, search);
  if (session.returnTo && session.returnTo !== current) return null;
  return session;
}

export function clearLogbookReviewHubSession() {
  memorySession = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function buildLogbookHubReturnTo(pathname, search) {
  const path = String(pathname || '/blog').startsWith('/')
    ? pathname
    : '/blog';
  const query = String(search || '');
  return `${path}${query}`;
}
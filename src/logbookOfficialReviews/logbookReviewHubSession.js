const SESSION_KEY = 'gateo:logbook-review-hub-ui';

/** @typedef {{ expanded?: boolean, visibleCount?: number, scrollY?: number, returnTo?: string, savedAt?: number }} LogbookReviewHubSession */

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
  const prev = readRaw() || {};
  const next = {
    ...prev,
    ...patch,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

/** @returns {LogbookReviewHubSession | null} */
export function readLogbookReviewHubSession() {
  const data = readRaw();
  if (!data || typeof data !== 'object') return null;
  return data;
}

export function clearLogbookReviewHubSession() {
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
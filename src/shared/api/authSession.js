const AUTH_TOKEN_MARK = '-auth-token';
const KEEP_KEYS = new Set(['savedEmail']);

/** Refetchable caches. Search, visits, favorites, and drafts are not in this list. */
const CACHE_KEY_PREFIXES = [
  'gateo:tourapi-proxy:',
  'gateo:mrt-tnas:',
  'gateo:mrt-stays:',
  'gateo:mrt-stay-coords:',
  'gateo:nearby-attractions:',
  'gateo:korea-festivals:v2:',
  'gateo:festival-open-detail:',
  'gateo-world-event-list-photo',
  'gateo.yt.unplayable',
  'days_place_chat_intro:',
  'days_gallery_swr_',
  'Days_Score_',
];

function isQuotaError(error) {
  if (!error) return false;
  const name = error.name || '';
  return name === 'QuotaExceededError'
    || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error.code === 22
    || error.code === 1014;
}

function isDisposableCacheKey(key) {
  return CACHE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function collectEvictableKeys(backing, keep) {
  if (typeof backing.length !== 'number' || typeof backing.key !== 'function') return [];
  const keys = [];
  for (let i = 0; i < backing.length; i += 1) {
    const key = backing.key(i);
    if (!key || keep.has(key) || key.includes(AUTH_TOKEN_MARK)) continue;
    if (!isDisposableCacheKey(key)) continue;
    keys.push(key);
  }
  return keys;
}

/**
 * localStorage adapter for the Supabase auth session.
 * A failed write-probe makes auth-js keep the session in memory, so a refresh
 * or a new window looks logged out. On quota, disposable caches are removed
 * once and the session write is retried. Search and visit records stay.
 */
export function createAuthSessionStorage(backing) {
  return {
    getItem: (key) => backing.getItem(key),
    removeItem: (key) => backing.removeItem(key),
    setItem: (key, value) => {
      try {
        backing.setItem(key, value);
      } catch (error) {
        if (!isQuotaError(error) || !String(key).includes(AUTH_TOKEN_MARK)) throw error;
        const keep = new Set([key, `${key}-code-verifier`, `${key}-user`, ...KEEP_KEYS]);
        collectEvictableKeys(backing, keep).forEach((name) => backing.removeItem(name));
        backing.setItem(key, value);
      }
    },
  };
}

export function gateoAuthOptions(storage) {
  return {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage,
  };
}

export function browserAuthStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return createAuthSessionStorage(window.localStorage);
}

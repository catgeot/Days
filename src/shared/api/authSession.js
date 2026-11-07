const AUTH_TOKEN_MARK = '-auth-token';
const KEEP_KEYS = new Set(['savedEmail']);

/** Refetchable caches. Stay listings and user records are not in this list. */
const CACHE_KEY_PREFIXES = [
  'gateo:tourapi-proxy:',
  'gateo:mrt-tnas:',
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

/** Stay search copies. Evicted only after the prefixes above, oldest first. */
const STAY_LISTING_PREFIX = 'gateo:mrt-stays:';

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

function collectKeys(backing, keep, include) {
  if (typeof backing.length !== 'number' || typeof backing.key !== 'function') return [];
  const keys = [];
  for (let i = 0; i < backing.length; i += 1) {
    const key = backing.key(i);
    if (!key || keep.has(key) || key.includes(AUTH_TOKEN_MARK)) continue;
    if (!include(key)) continue;
    keys.push(key);
  }
  return keys;
}

function stayListingFetchedAt(backing, key) {
  try {
    const parsed = JSON.parse(backing.getItem(key) || '');
    const at = Number(parsed?.fetchedAt);
    if (Number.isFinite(at)) return at;
  } catch {
    /* unreadable copies are oldest */
  }
  return 0;
}

function removeKeys(backing, keys) {
  let removed = 0;
  for (const name of keys) {
    if (backing.getItem(name) == null) continue;
    backing.removeItem(name);
    removed += 1;
  }
  return removed;
}

/**
 * localStorage adapter for the Supabase auth session.
 * A failed write-probe makes auth-js keep the session in memory, so a refresh
 * or a new window looks logged out. On quota, other refetchable caches go
 * first. Stay listings are removed one at a time, oldest first, and only
 * while the session still does not fit. Search and visit records stay.
 */
export function createAuthSessionStorage(backing) {
  return {
    getItem: (key) => backing.getItem(key),
    removeItem: (key) => backing.removeItem(key),
    setItem: (key, value) => {
      const write = () => backing.setItem(key, value);
      try {
        write();
      } catch (error) {
        if (!isQuotaError(error) || !String(key).includes(AUTH_TOKEN_MARK)) throw error;
        const keep = new Set([key, `${key}-code-verifier`, `${key}-user`, ...KEEP_KEYS]);
        const freedOther = removeKeys(
          backing,
          collectKeys(backing, keep, isDisposableCacheKey),
        );
        if (freedOther > 0) {
          try {
            write();
            return;
          } catch (retryError) {
            if (!isQuotaError(retryError)) throw retryError;
          }
        }
        const stays = collectKeys(backing, keep, (name) => name.startsWith(STAY_LISTING_PREFIX))
          .sort((a, b) => (
            stayListingFetchedAt(backing, a) - stayListingFetchedAt(backing, b)
            || a.localeCompare(b)
          ));
        for (const name of stays) {
          if (removeKeys(backing, [name]) < 1) continue;
          try {
            write();
            return;
          } catch (stayError) {
            if (!isQuotaError(stayError)) throw stayError;
          }
        }
        throw error;
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

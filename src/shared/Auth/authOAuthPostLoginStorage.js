import { sanitizeAuthPostLoginPath } from './authPostLoginPath.js';

export const AUTH_OAUTH_POST_LOGIN_KEY = 'gateo:auth-oauth-post-login';
export const LOGBOOK_OAUTH_REDIRECT_PATH = '/blog';
const TTL_MS = 15 * 60 * 1000;

function storageApi(storage = typeof sessionStorage !== 'undefined' ? sessionStorage : null) {
  return storage;
}

/**
 * @param {unknown} storage
 * @returns {{ path: string, savedAt: number } | null}
 */
export function readAuthOAuthPostLoginRecord(storage = storageApi()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(AUTH_OAUTH_POST_LOGIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.path !== 'string' || typeof parsed.savedAt !== 'number') return null;
    return { path: parsed.path, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} storage
 * @param {number} [now]
 */
export function clearAuthOAuthPostLoginPath(storage = storageApi()) {
  if (!storage) return;
  try {
    storage.removeItem(AUTH_OAUTH_POST_LOGIN_KEY);
  } catch {
    /* quota */
  }
}

/**
 * @param {string} path
 * @param {unknown} [storage]
 * @param {number} [now]
 * @returns {boolean}
 */
export function stashAuthOAuthPostLoginPath(path, storage = storageApi(), now = Date.now()) {
  const storageRef = storageApi(storage);
  if (!storageRef) return false;
  const normalized = sanitizeAuthPostLoginPath(path, '/blog/write');
  if (!normalized.startsWith('/blog/write')) return false;
  try {
    storageRef.setItem(
      AUTH_OAUTH_POST_LOGIN_KEY,
      JSON.stringify({ path: normalized, savedAt: now }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} [storage]
 * @param {number} [now]
 * @returns {boolean}
 */
export function hasValidAuthOAuthPostLoginPending(storage = storageApi(), now = Date.now()) {
  const record = readAuthOAuthPostLoginRecord(storage);
  if (!record) return false;
  if (now - record.savedAt > TTL_MS) {
    clearAuthOAuthPostLoginPath(storage);
    return false;
  }
  const path = sanitizeAuthPostLoginPath(record.path, '/');
  if (path !== record.path || !path.startsWith('/blog/write')) {
    clearAuthOAuthPostLoginPath(storage);
    return false;
  }
  return true;
}

/**
 * @param {unknown} [storage]
 * @param {number} [now]
 * @returns {string | null}
 */
export function consumeAuthOAuthPostLoginPath(storage = storageApi(), now = Date.now()) {
  const record = readAuthOAuthPostLoginRecord(storage);
  clearAuthOAuthPostLoginPath(storage);
  if (!record) return null;
  if (now - record.savedAt > TTL_MS) return null;
  const path = sanitizeAuthPostLoginPath(record.path, '/');
  if (path !== record.path || !path.startsWith('/blog/write')) return null;
  return path;
}
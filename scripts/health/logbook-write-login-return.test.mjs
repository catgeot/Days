import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { sanitizeAuthPostLoginPath } from '../../src/shared/Auth/authPostLoginPath.js';
import {
  AUTH_OAUTH_POST_LOGIN_KEY,
  LOGBOOK_OAUTH_REDIRECT_PATH,
  clearAuthOAuthPostLoginPath,
  consumeAuthOAuthPostLoginPath,
  hasValidAuthOAuthPostLoginPending,
  stashAuthOAuthPostLoginPath,
} from '../../src/shared/Auth/authOAuthPostLoginStorage.js';

const ORIGIN = 'https://www.gateo.kr';

function memorySession() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

const writeSource = readFileSync(
  fileURLToPath(new URL('../../src/pages/DailyReport/Write.jsx', import.meta.url)),
  'utf8',
);
const loginSource = readFileSync(
  fileURLToPath(new URL('../../src/shared/Auth/Login.jsx', import.meta.url)),
  'utf8',
);

test('sanitizeAuthPostLoginPath keeps in-app write paths with query', () => {
  assert.equal(sanitizeAuthPostLoginPath('/blog/write', '/', ORIGIN), '/blog/write');
  assert.equal(
    sanitizeAuthPostLoginPath('/blog/write?date=2026-11-18', '/', ORIGIN),
    '/blog/write?date=2026-11-18',
  );
  assert.equal(sanitizeAuthPostLoginPath('/blog/write/uuid-1', '/', ORIGIN), '/blog/write/uuid-1');
});

test('sanitizeAuthPostLoginPath rejects encoded and scheme attacks', () => {
  const attacks = [
    'https://evil.example/steal',
    '//evil.example/path',
    '/%2F%2Fevil',
    '/\\evil',
    '/javascript:alert(1)',
    '/%09/blog',
    'javascript:alert(1)',
  ];
  for (const raw of attacks) {
    assert.equal(sanitizeAuthPostLoginPath(raw, '/', ORIGIN), '/', raw);
  }
  assert.equal(sanitizeAuthPostLoginPath('/%2F%2Fevil', '/', ORIGIN), '/');
});

test('non-logged-in write guard passes current path and stashes OAuth return', () => {
  assert.match(writeSource, /stashAuthOAuthPostLoginPath\(returnTo\)/);
  assert.match(writeSource, /\$\{location\.pathname\}\$\{location\.search\}/);
  assert.doesNotMatch(writeSource, /from:\s*'\/blog'/);
});

test('login OAuth uses /blog landing when OAuth post-login stash is pending', () => {
  assert.match(loginSource, /hasValidAuthOAuthPostLoginPending\(\)/);
  assert.match(loginSource, /LOGBOOK_OAUTH_REDIRECT_PATH/);
  assert.match(loginSource, /clearAuthOAuthPostLoginPath/);
  assert.match(loginSource, /redirectTo:\s*window\.location\.origin \+ oauthLanding/);
  assert.match(loginSource, /navigate\(from\)/);
});

test('mock OAuth: stash → redirectTo /blog → session consume → write URL', () => {
  const storage = memorySession();
  const writePath = '/blog/write?date=2026-11-18';
  const now = 1_000_000;
  assert.equal(stashAuthOAuthPostLoginPath(writePath, storage, now), true);
  assert.equal(hasValidAuthOAuthPostLoginPending(storage, now), true);
  const oauthRedirectTo = `${ORIGIN}${
    hasValidAuthOAuthPostLoginPending(storage, now) ? LOGBOOK_OAUTH_REDIRECT_PATH : '/'
  }`;
  assert.equal(oauthRedirectTo, `${ORIGIN}/blog`);

  const consumed = consumeAuthOAuthPostLoginPath(storage, now + 1000);
  assert.equal(consumed, writePath);
  assert.equal(storage.getItem(AUTH_OAUTH_POST_LOGIN_KEY), null);
  assert.equal(hasValidAuthOAuthPostLoginPending(storage, now + 1000), false);
});

test('mock OAuth: no stash keeps default redirect path from login state', () => {
  const storage = memorySession();
  const from = '/place/rome?lang=ko';
  assert.equal(hasValidAuthOAuthPostLoginPending(storage), false);
  const oauthLanding = hasValidAuthOAuthPostLoginPending(storage) ? LOGBOOK_OAUTH_REDIRECT_PATH : from;
  assert.equal(`${ORIGIN}${oauthLanding}`, `${ORIGIN}${from}`);
});

test('expired or malicious stash is ignored', () => {
  const storage = memorySession();
  const now = 10_000;
  stashAuthOAuthPostLoginPath('/blog/write?date=2026-11-18', storage, now);
  assert.equal(consumeAuthOAuthPostLoginPath(storage, now + 16 * 60 * 1000), null);
  storage.setItem(
    AUTH_OAUTH_POST_LOGIN_KEY,
    JSON.stringify({ path: '/%2F%2Fevil', savedAt: now }),
  );
  assert.equal(hasValidAuthOAuthPostLoginPending(storage, now + 100), false);
  storage.setItem(
    AUTH_OAUTH_POST_LOGIN_KEY,
    JSON.stringify({ path: 'https://evil.example', savedAt: now + 100 }),
  );
  assert.equal(consumeAuthOAuthPostLoginPath(storage, now + 200), null);
});

test('dashboard write CTA unchanged on main (no PR diff expected in test)', () => {
  const dashboardSource = readFileSync(
    fileURLToPath(new URL('../../src/pages/DailyReport/Dashboard.jsx', import.meta.url)),
    'utf8',
  );
  assert.match(dashboardSource, /trackEvent\('logbook_write_click'/);
  assert.match(dashboardSource, /data-testid="logbook-write-cta"/);
  assert.match(dashboardSource, /border border-gray-200 bg-white text-gray-700/);
});
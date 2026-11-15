import assert from 'node:assert/strict';
import test from 'node:test';

import {
  initialLogbookPublicMode,
  storageHasAuthSession,
} from '../../src/pages/DailyReport/hooks/logbookPublicMode.js';

function memoryStorage(entries) {
  const map = new Map(Object.entries(entries));
  return {
    get length() {
      return map.size;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
  };
}

test('public tab is public even when a session is stored', () => {
  const storage = memoryStorage({
    'sb-example-auth-token': JSON.stringify({ access_token: 'a', user: { id: 'u1' } }),
  });
  assert.equal(initialLogbookPublicMode('?tab=public&lang=ko', storage), true);
  assert.equal(storageHasAuthSession(storage), true);
});

test('a guest without a session starts on the public logbook', () => {
  assert.equal(initialLogbookPublicMode('', memoryStorage({})), true);
  assert.equal(initialLogbookPublicMode('?lang=ko', null), true);
});

test('a stored session without the public tab stays on the private logbook', () => {
  const storage = memoryStorage({
    'sb-example-auth-token': JSON.stringify({ access_token: 'a', user: { id: 'u1' } }),
    'sb-example-auth-token-code-verifier': 'verifier',
  });
  assert.equal(initialLogbookPublicMode('?lang=ko', storage), false);
});

test('an empty auth token does not count as a session', () => {
  const storage = memoryStorage({
    'sb-example-auth-token': 'null',
  });
  assert.equal(storageHasAuthSession(storage), false);
  assert.equal(initialLogbookPublicMode('', storage), true);
});

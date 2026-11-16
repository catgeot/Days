import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearAppHistoryPathMemory,
  getAppHistoryPath,
  recordAppHistoryPath,
} from '../../src/shared/navigation/appHistoryPathIndex.js';

test('history idx paths survive a refresh via sessionStorage', () => {
  const store = new Map();
  const sessionStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
  const prevWindow = globalThis.window;
  const prevSession = globalThis.sessionStorage;
  globalThis.sessionStorage = sessionStorage;
  globalThis.window = { history: { state: { idx: 2 } }, sessionStorage };

  try {
    recordAppHistoryPath('/blog/e/short-20261111-week-festivals', '');
    clearAppHistoryPathMemory();
    assert.equal(
      getAppHistoryPath(2),
      '/blog/e/short-20261111-week-festivals',
    );
    assert.equal(getAppHistoryPath(1), null);
  } finally {
    clearAppHistoryPathMemory();
    globalThis.window = prevWindow;
    globalThis.sessionStorage = prevSession;
  }
});

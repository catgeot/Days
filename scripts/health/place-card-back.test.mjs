import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlaceCardBack } from '../../src/pages/Home/lib/placeCardBack.js';
import {
  isLogbookPlaceReturnPath,
  setPlaceReturnTo,
  peekPlaceReturnTo,
  clearPlaceReturnTo,
} from '../../src/pages/Home/lib/placeReturnTo.js';

test('placeReturnTo allows /blog with query', () => {
  assert.equal(isLogbookPlaceReturnPath('/blog?tab=public&lang=ko&region=overseas'), true);
});

test('resolvePlaceCardBack — blog returnTo wins over close', () => {
  const action = resolvePlaceCardBack({
    historyIdx: 0,
    prevPath: null,
    returnTo: '/blog?tab=public&lang=ko',
    exploreReturnPath: null,
  });
  assert.deepEqual(action, {
    type: 'push',
    path: '/blog?tab=public&lang=ko',
    clearReturnTo: true,
  });
});

test('resolvePlaceCardBack — push prev /blog when returnTo missing', () => {
  const action = resolvePlaceCardBack({
    historyIdx: 2,
    prevPath: '/blog?tab=public&lang=ko',
    returnTo: null,
    exploreReturnPath: null,
  });
  assert.deepEqual(action, {
    type: 'push',
    path: '/blog?tab=public&lang=ko',
    clearReturnTo: true,
  });
});

test('setPlaceReturnTo session for blog', () => {
  const store = new Map();
  const prev = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    setItem: (k, v) => store.set(k, v),
    getItem: (k) => store.get(k) ?? null,
    removeItem: (k) => store.delete(k),
  };
  clearPlaceReturnTo();
  setPlaceReturnTo('/blog?tab=public');
  assert.equal(peekPlaceReturnTo(null), '/blog?tab=public');
  clearPlaceReturnTo();
  globalThis.sessionStorage = prev;
});
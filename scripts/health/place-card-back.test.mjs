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

test('setPlaceReturnTo session for blog — hub flag only', () => {
  const store = new Map();
  const prev = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    setItem: (k, v) => store.set(k, v),
    getItem: (k) => store.get(k) ?? null,
    removeItem: (k) => store.delete(k),
  };
  clearPlaceReturnTo();
  setPlaceReturnTo('/blog?tab=public');
  assert.equal(peekPlaceReturnTo(null), null);
  assert.equal(
    peekPlaceReturnTo({ fromLogbookReviewHub: true }),
    '/blog?tab=public',
  );
  clearPlaceReturnTo();
  globalThis.sessionStorage = prev;
});

test('explore snapshot + missing prevPath uses history', () => {
  const action = resolvePlaceCardBack({
    historyIdx: 2,
    prevPath: null,
    returnTo: null,
    exploreReturnPath: '/explore',
  });
  assert.deepEqual(action, { type: 'history' });
});

test('explore snapshot + idx 1 still pushes explore path', () => {
  const action = resolvePlaceCardBack({
    historyIdx: 1,
    prevPath: null,
    returnTo: null,
    exploreReturnPath: '/explore/asia',
  });
  assert.deepEqual(action, {
    type: 'push',
    path: '/explore/asia',
  });
});

test('explore prev wins over stale blog session', () => {
  const store = new Map();
  const prev = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    setItem: (k, v) => store.set(k, v),
    getItem: (k) => store.get(k) ?? null,
    removeItem: (k) => store.delete(k),
  };
  clearPlaceReturnTo();
  setPlaceReturnTo('/blog?tab=public&lang=ko');
  const action = resolvePlaceCardBack({
    historyIdx: 2,
    prevPath: '/explore',
    returnTo: peekPlaceReturnTo(null),
    exploreReturnPath: null,
  });
  assert.deepEqual(action, { type: 'history' });
  clearPlaceReturnTo();
  globalThis.sessionStorage = prev;
});
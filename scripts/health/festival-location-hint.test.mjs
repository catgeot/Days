import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isHintDismissed,
  isWithinTtl,
  readDismissTimestamp,
  readLocationSuccess,
  shouldAttemptSilentGeolocation,
  shouldShowDefaultLocHint,
  writeHintDismissed,
  writeLocationSuccess,
  LOC_HINT_TTL_MS,
} from '../../src/pages/Korea/festivalLocationHint.js';

const NOW = 1_700_000_000_000;

function mockStorage() {
  /** @type {Record<string, string>} */
  const map = {};
  return {
    getItem: (k) => (k in map ? map[k] : null),
    setItem: (k, v) => {
      map[k] = String(v);
    },
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new Error('quota');
    },
    setItem: () => {
      throw new Error('quota');
    },
  };
}

const baseHintParams = {
  hintDismissed: false,
  recentSuccess: null,
  permission: 'prompt',
  loading: false,
  error: false,
  nearActive: false,
  personalTab: null,
  areaCode: 'all',
  cityName: 'all',
  defaultAreaCode: 'all',
  searchActive: false,
};

test('isWithinTtl respects seven-day window', () => {
  assert.equal(isWithinTtl(NOW - LOC_HINT_TTL_MS + 1, NOW), true);
  assert.equal(isWithinTtl(NOW - LOC_HINT_TTL_MS, NOW), false);
});

test('dismissal persists for seven days in storage', () => {
  const storage = mockStorage();
  writeHintDismissed(storage, NOW);
  assert.equal(isHintDismissed(storage, NOW + 1000), true);
  assert.equal(
    isHintDismissed(storage, NOW + LOC_HINT_TTL_MS + 1),
    false,
  );
  assert.equal(readDismissTimestamp(storage, NOW + LOC_HINT_TTL_MS + 1), null);
});

test('recent success record is readable within TTL', () => {
  const storage = mockStorage();
  writeLocationSuccess(storage, 37.5, 127.0, NOW);
  const hit = readLocationSuccess(storage, NOW + 60_000);
  assert.deepEqual(hit, { at: NOW, lat: 37.5, lng: 127.0 });
  assert.equal(readLocationSuccess(storage, NOW + LOC_HINT_TTL_MS + 1), null);
});

test('shouldShowDefaultLocHint — granted hides banner', () => {
  assert.equal(
    shouldShowDefaultLocHint({
      ...baseHintParams,
      permission: 'granted',
    }),
    false,
  );
});

test('shouldShowDefaultLocHint — recent success hides banner', () => {
  assert.equal(
    shouldShowDefaultLocHint({
      ...baseHintParams,
      recentSuccess: { at: NOW, lat: 1, lng: 2 },
    }),
    false,
  );
});

test('shouldShowDefaultLocHint — dismissed within window', () => {
  assert.equal(
    shouldShowDefaultLocHint({
      ...baseHintParams,
      hintDismissed: true,
    }),
    false,
  );
});

test('shouldShowDefaultLocHint — default nationwide shows banner', () => {
  assert.equal(shouldShowDefaultLocHint(baseHintParams), true);
});

test('shouldShowDefaultLocHint — expired dismissal shows again', () => {
  const storage = mockStorage();
  writeHintDismissed(storage, NOW - LOC_HINT_TTL_MS - 1);
  assert.equal(isHintDismissed(storage, NOW), false);
  assert.equal(
    shouldShowDefaultLocHint({
      ...baseHintParams,
      hintDismissed: false,
    }),
    true,
  );
});

test('shouldAttemptSilentGeolocation matrix', () => {
  assert.equal(
    shouldAttemptSilentGeolocation('granted', null, false),
    true,
  );
  assert.equal(
    shouldAttemptSilentGeolocation('denied', null, false),
    false,
  );
  assert.equal(
    shouldAttemptSilentGeolocation(
      'unsupported',
      { at: NOW, lat: 1, lng: 2 },
      false,
    ),
    true,
  );
  assert.equal(
    shouldAttemptSilentGeolocation('denied', { at: NOW, lat: 1, lng: 2 }, false),
    true,
  );
});

test('storage throws — reads return safe defaults', () => {
  const storage = throwingStorage();
  assert.equal(isHintDismissed(storage, NOW), false);
  assert.equal(readLocationSuccess(storage, NOW), null);
  writeHintDismissed(storage, NOW);
  writeLocationSuccess(storage, 1, 2, NOW);
});

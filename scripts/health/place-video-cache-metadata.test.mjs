import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const modUrl = pathToFileURL(join(root, 'src/pages/Home/lib/placeVideoCache.js')).href;
const {
  shouldRefreshPlaceVideoCache,
  isRetryBlockingRefetch,
  isMetadataExpired,
  placeVideosForClient,
} = await import(modUrl);

const DAY = 24 * 60 * 60 * 1000;

test('shouldRefreshPlaceVideoCache returns true when last_updated older than 30 days and no backoff', () => {
  const now = Date.now();
  const row = {
    videos: [{ id: 'v1' }],
    next_retry_at: null,
    last_updated: new Date(now - 31 * DAY).toISOString(),
  };
  assert.equal(shouldRefreshPlaceVideoCache(row, now), true);
});

test('shouldRefreshPlaceVideoCache respects next_retry_at when metadata fresh', () => {
  const now = Date.now();
  const row = {
    videos: [{ id: 'v1' }],
    next_retry_at: new Date(now + DAY).toISOString(),
    last_updated: new Date(now - DAY).toISOString(),
  };
  assert.equal(shouldRefreshPlaceVideoCache(row, now), false);
});

test('placeVideosForClient strips title when last_updated expired', () => {
  const row = {
    videos: [{ id: 'a', title: 'old', channelTitle: 'c' }],
    last_updated: '2020-01-01T00:00:00.000Z',
  };
  assert.deepEqual(placeVideosForClient(row), [{ id: 'a' }]);
});

test('expired metadata + future next_retry_at does not refetch (backoff gate)', () => {
  const now = Date.now();
  const row = {
    videos: [{ id: 'v1' }],
    next_retry_at: new Date(now + 2 * DAY).toISOString(),
    last_updated: new Date(now - 31 * DAY).toISOString(),
  };
  assert.equal(isMetadataExpired(row.last_updated, now), true);
  assert.equal(isRetryBlockingRefetch(row, now), true);
  assert.equal(shouldRefreshPlaceVideoCache(row, now), false);
});

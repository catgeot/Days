import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const modUrl = pathToFileURL(join(root, 'src/pages/Home/lib/placeVideoCache.js')).href;
const { shouldRefreshPlaceVideoCache } = await import(modUrl);

const DAY = 24 * 60 * 60 * 1000;

test('shouldRefreshPlaceVideoCache returns true when last_updated older than 30 days', () => {
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

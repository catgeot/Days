import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_SITE_SEARCH: '1' };

const { runExploreHybridSuggestUpdate } = await import(
  '../../src/pages/Home/lib/exploreHybridSuggestUpdate.js'
);

test('runExploreHybridSuggestUpdate returns paints when requestId still current', async () => {
  let currentId = 10;
  const result = await runExploreHybridSuggestUpdate(
    'q',
    10,
    () => currentId,
    { mergeStartedAt: Date.now() },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', source: 'ssot' }],
      buildFest: async () => [],
      applyMerge: async (_q, items) => ({ items, late: null }),
    },
  );
  assert.equal(result.stale, false);
  assert.equal(result.paints.length, 1);
  assert.equal(result.paints[0][0].id, 'city-1');
});

test('runExploreHybridSuggestUpdate drops paints when requestId stale after merge wait', async () => {
  let currentId = 7;
  const applyMerge = async (_q, items) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
    return { items: [{ id: 'fest-1', kind: 'festival' }, ...items], late: null };
  };

  const runPromise = runExploreHybridSuggestUpdate(
    'q',
    7,
    () => currentId,
    { mergeStartedAt: Date.now() },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', source: 'ssot' }],
      buildFest: async () => [],
      applyMerge,
    },
  );

  setTimeout(() => {
    currentId = 8;
  }, 40);

  const result = await runPromise;
  assert.equal(result.stale, true);
  assert.equal(result.paints.length, 0);
});

test('runExploreHybridSuggestUpdate drops late paint when requestId stale after append merge', async () => {
  let currentId = 3;
  const applyMerge = async (_q, items) => ({
    items,
    late: async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 80);
      });
      return [{ id: 'city-1' }, { id: 'fest-late', kind: 'festival' }];
    },
  });

  const runPromise = runExploreHybridSuggestUpdate(
    'q',
    3,
    () => currentId,
    { mergeStartedAt: Date.now() - 400 },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', source: 'ssot' }],
      buildFest: async () => [{ id: 'f1', kind: 'festival' }],
      applyMerge,
    },
  );

  setTimeout(() => {
    currentId = 4;
  }, 10);

  const result = await runPromise;
  assert.equal(result.stale, true);
  assert.equal(result.paints.length, 0);
});

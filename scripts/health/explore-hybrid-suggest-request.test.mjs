import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_SITE_SEARCH: '1' };

const { runExploreHybridSuggestUpdate } = await import(
  '../../src/pages/Home/lib/exploreHybridSuggestUpdate.js'
);

test('runExploreHybridSuggestUpdate onPaint when requestId still current', async () => {
  let currentId = 10;
  /** @type {object[][]} */
  const painted = [];
  const result = await runExploreHybridSuggestUpdate(
    'q',
    10,
    () => currentId,
    {
      mergeStartedAt: Date.now(),
      onPaint: (items) => painted.push(items),
    },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', name: '테스트', source: 'ssot' }],
      buildFest: async () => [],
      applyMerge: async (_q, items) => ({ items, late: null }),
    },
  );
  assert.equal(result.stale, false);
  assert.equal(painted.length, 1);
  assert.equal(painted[0][0].id, 'city-1');
});

test('onPaint fires firstPaint before late merge resolves', async () => {
  /** @type {number[]} */
  const paintAtMs = [];
  const t0 = Date.now();
  /** @type {(() => void) | null} */
  let releaseLate = null;
  const lateGate = new Promise((resolve) => {
    releaseLate = resolve;
  });

  const applyMerge = async (_q, items) => ({
    items,
    late: async () => {
      await lateGate;
      return [...items, { id: 'fest-late', name: '축제', kind: 'festival' }];
    },
  });

  const runPromise = runExploreHybridSuggestUpdate(
    'q',
    1,
    () => 1,
    {
      mergeStartedAt: Date.now() - 400,
      onPaint: () => paintAtMs.push(Date.now() - t0),
    },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', name: '테스트', source: 'ssot' }],
      buildFest: async () => [],
      applyMerge,
    },
  );

  await new Promise((resolve) => {
    setTimeout(resolve, 30);
  });
  assert.equal(paintAtMs.length, 1, 'firstPaint should paint before late resolves');

  releaseLate?.();
  await runPromise;
  assert.equal(paintAtMs.length, 2);
  assert.ok(paintAtMs[1] > paintAtMs[0] + 20);
});

test('parity OFF uses main autocomplete path (no review merge, no maxItems cap)', async () => {
  let reviewMerged = false;
  /** @type {object[][]} */
  const painted = [];
  await runExploreHybridSuggestUpdate(
    'q',
    1,
    () => 1,
    { onPaint: (items) => painted.push(items) },
    {
      isSiteSearchEnabled: () => true,
      isSubmitParityEnabled: () => false,
      buildHybrid: async () => [{ id: 'city-1', name: '테스트', source: 'ssot' }],
      buildFest: async () => [{ id: 'fest-1', kind: 'festival', name: '축제' }],
      applyMerge: async (_q, items, mergeOpts) => {
        assert.equal(mergeOpts.maxItems, undefined);
        return { items: [...items, { id: 'fest-1', name: '축제', kind: 'festival' }], late: null };
      },
      mergeReview: async () => {
        reviewMerged = true;
        return [];
      },
    },
  );
  assert.equal(reviewMerged, false);
  assert.equal(painted.length, 1);
  assert.equal(painted[0].some((row) => row.id === 'fest-1'), true);
});

test('runExploreHybridSuggestUpdate skips onPaint when requestId stale after merge wait', async () => {
  let currentId = 7;
  const painted = [];
  const applyMerge = async (_q, items) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
    return { items: [{ id: 'fest-1', name: '축제', kind: 'festival' }, ...items], late: null };
  };

  const runPromise = runExploreHybridSuggestUpdate(
    'q',
    7,
    () => currentId,
    { mergeStartedAt: Date.now(), onPaint: (items) => painted.push(items) },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', name: '테스트', source: 'ssot' }],
      buildFest: async () => [],
      applyMerge,
    },
  );

  setTimeout(() => {
    currentId = 8;
  }, 40);

  const result = await runPromise;
  assert.equal(result.stale, true);
  assert.equal(painted.length, 0);
});

test('runExploreHybridSuggestUpdate skips late onPaint when requestId stale after append merge', async () => {
  let currentId = 3;
  const painted = [];
  const applyMerge = async (_q, items) => ({
    items,
    late: async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 80);
      });
      return [{ id: 'city-1', name: '테스트' }, { id: 'fest-late', name: '늦은축제', kind: 'festival' }];
    },
  });

  const runPromise = runExploreHybridSuggestUpdate(
    'q',
    3,
    () => currentId,
    { mergeStartedAt: Date.now() - 400, onPaint: (items) => painted.push(items) },
    {
      isSiteSearchEnabled: () => true,
      buildHybrid: async () => [{ id: 'city-1', name: '테스트', source: 'ssot' }],
      buildFest: async () => [{ id: 'f1', name: '축제', kind: 'festival' }],
      applyMerge,
    },
  );

  setTimeout(() => {
    currentId = 4;
  }, 10);

  const result = await runPromise;
  assert.equal(result.stale, true);
  assert.equal(painted.length, 1, 'firstPaint only; late paint dropped when stale');
});

import assert from 'node:assert/strict';

const store = new Map();
let storageThrows = false;

globalThis.sessionStorage = {
  getItem(key) {
    if (storageThrows) throw new Error('storage');
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    if (storageThrows) throw new Error('storage');
    store.set(key, String(value));
  },
  removeItem(key) {
    if (storageThrows) throw new Error('storage');
    store.delete(key);
  },
};

const { clearTrendingRankingMemoryCache, fetchTrendingRankingCached } = await import(
  '../src/pages/Home/lib/fetchTrendingRanking.js'
);

const FAIL_KEY = 'gateo_trending_ranking_fail_v1';
const spots = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
];

function reset() {
  store.clear();
  storageThrows = false;
  clearTrendingRankingMemoryCache();
}

{
  reset();
  let calls = 0;
  const fetchDb = async () => {
    calls += 1;
    const err = new Error('500');
    err.status = 500;
    throw err;
  };
  const t0 = 1_000_000;
  assert.equal(await fetchTrendingRankingCached({ now: t0, fetchDb }), null);
  assert.equal(calls, 1);
  assert.equal(await fetchTrendingRankingCached({ now: t0 + 60_000, fetchDb }), null);
  assert.equal(await fetchTrendingRankingCached({ now: t0 + 4 * 60_000, fetchDb }), null);
  assert.equal(calls, 1);
  assert.equal(await fetchTrendingRankingCached({ now: t0 + 5 * 60_000 + 1, fetchDb }), null);
  assert.equal(calls, 2);
}

{
  reset();
  let calls = 0;
  const fetchDb = async () => {
    calls += 1;
    return [];
  };
  const t0 = 2_000_000;
  assert.equal(await fetchTrendingRankingCached({ now: t0, fetchDb }), null);
  assert.equal(await fetchTrendingRankingCached({ now: t0 + 1_000, fetchDb }), null);
  assert.equal(calls, 1);
  assert.ok(store.has(FAIL_KEY));
}

{
  reset();
  let calls = 0;
  const fetchDb = async () => {
    calls += 1;
    if (calls === 1) {
      const err = new Error('401');
      err.status = 401;
      throw err;
    }
    return spots;
  };
  const t0 = 3_000_000;
  assert.equal(await fetchTrendingRankingCached({ now: t0, fetchDb }), null);
  assert.equal(await fetchTrendingRankingCached({ now: t0 + 1_000, fetchDb }), null);
  assert.equal(calls, 1);
  clearTrendingRankingMemoryCache();
  const ok = await fetchTrendingRankingCached({ now: t0 + 5 * 60_000 + 1, fetchDb });
  assert.deepEqual(ok, spots);
  assert.equal(calls, 2);
  assert.equal(store.has(FAIL_KEY), false);
  const again = await fetchTrendingRankingCached({ now: t0 + 5 * 60_000 + 2, fetchDb });
  assert.deepEqual(again, spots);
  assert.equal(calls, 2);
}

{
  reset();
  storageThrows = true;
  let calls = 0;
  const fetchDb = async () => {
    calls += 1;
    throw new Error('401');
  };
  assert.equal(await fetchTrendingRankingCached({ now: 4_000_000, fetchDb }), null);
  assert.equal(calls, 1);
}

console.log('smoke-trending-ranking-backoff: OK');

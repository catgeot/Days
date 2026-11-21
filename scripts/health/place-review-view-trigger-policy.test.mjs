import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { applyPlaceReviewViewTrigger } from '../../src/shared/placeReviewViewTriggerPolicy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function mockSessionStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
}

function mockRpc() {
  let calls = 0;
  return {
    calls: () => calls,
    rpc: async () => {
      calls += 1;
      return { error: null };
    },
  };
}

test('ReviewItem — list mount does not increment', async () => {
  const rpc = mockRpc();
  const storage = mockSessionStorage();
  for (const id of ['a', 'b', 'c']) {
    const res = await applyPlaceReviewViewTrigger({
      reviewId: id,
      trigger: 'mount',
      rpc: rpc.rpc,
      sessionStorage: storage,
      env: { userAgent: CHROME_UA },
    });
    assert.equal(res.rpcCalls, 0);
  }
  assert.equal(rpc.calls(), 0);
});

test('ReviewItem — expand records once per item and session', async () => {
  const rpc = mockRpc();
  const storage = mockSessionStorage();
  let itemCounted = false;
  const first = await applyPlaceReviewViewTrigger({
    reviewId: 'rev-1',
    trigger: 'expand',
    itemAlreadyCounted: itemCounted,
    rpc: rpc.rpc,
    sessionStorage: storage,
    env: { userAgent: CHROME_UA },
  });
  assert.equal(first.rpcCalls, 1);
  itemCounted = first.itemCounted;
  const second = await applyPlaceReviewViewTrigger({
    reviewId: 'rev-1',
    trigger: 'expand',
    itemAlreadyCounted: itemCounted,
    rpc: rpc.rpc,
    sessionStorage: storage,
    env: { userAgent: CHROME_UA },
  });
  assert.equal(second.rpcCalls, 0);
  assert.equal(rpc.calls(), 1);
});

test('ReviewItem — deeplink focus records once', async () => {
  const rpc = mockRpc();
  const storage = mockSessionStorage();
  const res = await applyPlaceReviewViewTrigger({
    reviewId: 'rev-deeplink',
    trigger: 'deeplink',
    rpc: rpc.rpc,
    sessionStorage: storage,
    env: { userAgent: CHROME_UA },
  });
  assert.equal(res.rpcCalls, 1);
  assert.equal(rpc.calls(), 1);
});

test('ReviewItem — bot/QA expand performs zero rpc', async () => {
  const rpc = mockRpc();
  const storage = mockSessionStorage();
  const res = await applyPlaceReviewViewTrigger({
    reviewId: 'rev-1',
    trigger: 'expand',
    rpc: rpc.rpc,
    sessionStorage: storage,
    env: { search: '?qa=1', userAgent: CHROME_UA },
  });
  assert.equal(res.rpcCalls, 0);
  assert.equal(rpc.calls(), 0);
});

test('ReviewsTab ReviewItem does not increment on bare mount', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'),
    'utf8',
  );
  assert.doesNotMatch(
    src.slice(src.indexOf('export const ReviewItem'), src.indexOf('const ReviewsTab')),
    /useEffect\(\(\) => \{[\s\S]*onVisible\(id\)/,
  );
  assert.match(src, /if \(!focused\) return/);
  assert.match(src, /handleExpandToggleClick/);
  assert.match(src, /data-review-expand-toggle/);
});
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  isGateoBotUserAgent,
  readGateoTrafficSignals,
  shouldSkipGateoAutomatedTraffic,
} from '../../src/shared/analytics/gateoGaQa.js';
import { incrementPlaceReviewViewOnce } from '../../src/shared/placeReviewViewIncrement.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

test('shouldSkipGateoAutomatedTraffic — webdriver skips', () => {
  assert.equal(shouldSkipGateoAutomatedTraffic({ webdriver: true, userAgent: CHROME_UA }), true);
});

test('shouldSkipGateoAutomatedTraffic — qa query or storage skips', () => {
  assert.equal(
    shouldSkipGateoAutomatedTraffic({ search: '?qa=1', userAgent: CHROME_UA }),
    true,
  );
  const storage = { getItem: (k) => (k === 'gateo_qa' ? '1' : null), setItem: () => {} };
  assert.equal(
    shouldSkipGateoAutomatedTraffic({ localStorage: storage, userAgent: CHROME_UA }),
    true,
  );
});

test('shouldSkipGateoAutomatedTraffic — bot UA patterns skip', () => {
  for (const ua of [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Slurp/3.0',
    'HeadlessChrome/120',
    'Lighthouse CI',
    'vercel-preview-screenshot',
  ]) {
    assert.equal(shouldSkipGateoAutomatedTraffic({ userAgent: ua }), true, ua);
  }
});

test('shouldSkipGateoAutomatedTraffic — normal browser does not skip', () => {
  assert.equal(shouldSkipGateoAutomatedTraffic({ userAgent: CHROME_UA }), false);
});

test('isGateoBotUserAgent is case-insensitive', () => {
  assert.equal(isGateoBotUserAgent('MyBoT/1.0'), true);
  assert.equal(isGateoBotUserAgent(CHROME_UA), false);
});

test('readGateoTrafficSignals — merges explicit env', () => {
  const s = readGateoTrafficSignals({ webdriver: false, search: '?qa=1', userAgent: 'x' });
  assert.equal(s.webdriver, false);
  assert.equal(s.qa, true);
  assert.equal(s.userAgent, 'x');
});

test('usePlaceReviews incrementView uses incrementPlaceReviewViewOnce', () => {
  const src = readFileSync(join(root, 'src/hooks/usePlaceReviews.js'), 'utf8');
  assert.match(src, /incrementPlaceReviewViewOnce/);
});

function mockSessionStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
}

test('incrementPlaceReviewViewOnce — normal UA performs one rpc', async () => {
  let rpcCalls = 0;
  const storage = mockSessionStorage();
  const res = await incrementPlaceReviewViewOnce({
    reviewId: 'rev-1',
    env: { userAgent: CHROME_UA },
    sessionStorage: storage,
    rpc: async () => {
      rpcCalls += 1;
      return { error: null };
    },
  });
  assert.equal(res.rpcCalls, 1);
  assert.equal(rpcCalls, 1);
});

test('incrementPlaceReviewViewOnce — webdriver, qa, bot UA perform zero rpc', async () => {
  let rpcCalls = 0;
  const rpc = async () => {
    rpcCalls += 1;
    return { error: null };
  };
  const storage = mockSessionStorage();
  const cases = [
    { webdriver: true, userAgent: CHROME_UA },
    { search: '?qa=1', userAgent: CHROME_UA },
    { userAgent: 'Googlebot/2.1' },
    { userAgent: 'HeadlessChrome/1' },
  ];
  for (const env of cases) {
    const res = await incrementPlaceReviewViewOnce({
      reviewId: `rev-${rpcCalls}`,
      env,
      sessionStorage: storage,
      rpc,
    });
    assert.equal(res.rpcCalls, 0, JSON.stringify(env));
  }
  assert.equal(rpcCalls, 0);
});
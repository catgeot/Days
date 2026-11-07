import assert from 'node:assert/strict';
import test from 'node:test';

import { failureUiState, nextReelIndex } from '../src/pages/SelfReels/selfReelsFailure.js';
import { getFixtureSelfReels } from '../src/pages/SelfReels/selfReelsFixture.js';
import { getPublishedSelfReels, toPublicSelfReel } from '../src/pages/SelfReels/selfReelsCatalog.js';
import { GATEO_ENV_FLAG_NAMES, isGateoSelfReelsFixtureEnabled } from '../src/shared/gateoFeatureFlags.js';

function withViteEnv(patch, fn) {
  const prev = { ...globalThis.__VITE_ENV__ };
  globalThis.__VITE_ENV__ = { ...prev, ...patch };
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__ = prev;
  }
}

test('failureUiState: first fail shows retry only; second shows next when available', () => {
  assert.deepEqual(failureUiState(0, true), { showRetry: false, showNext: false });
  assert.deepEqual(failureUiState(1, true), { showRetry: true, showNext: false });
  assert.deepEqual(failureUiState(2, true), { showRetry: true, showNext: true });
  assert.deepEqual(failureUiState(2, false), { showRetry: true, showNext: false });
});

test('nextReelIndex never wraps and stays null at end', () => {
  assert.equal(nextReelIndex(0, 2), 1);
  assert.equal(nextReelIndex(1, 2), null);
  assert.equal(nextReelIndex(null, 2), null);
  assert.equal(nextReelIndex(0, 0), null);
});

test('fixture rows expose all placePaths and isFixture; published stays empty without label', () => {
  const page = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  const fixture = GATEO_ENV_FLAG_NAMES.SELF_REELS_FIXTURE;
  withViteEnv({ [page]: '1', [fixture]: '1' }, () => {
    assert.equal(isGateoSelfReelsFixtureEnabled(), true);
    const reels = getFixtureSelfReels();
    assert.equal(reels.length, 2);
    assert.equal(reels[0].placePaths.length, 5);
    assert.ok(reels.every((reel) => reel.isFixture === true));
    assert.ok(reels.every((reel) => reel.placePaths.every((path) => path.startsWith('/place/'))));
  });
  assert.deepEqual(getPublishedSelfReels(), []);
  const publishedShape = toPublicSelfReel({
    id: 'ops-sample',
    rightsConfirmed: true,
    credit: '출처 공공누리 표기',
    videoUrl: 'https://cdn.example/stable.mp4',
    placePaths: ['/place/a', '/place/b'],
  });
  assert.equal(publishedShape.isFixture, undefined);
});

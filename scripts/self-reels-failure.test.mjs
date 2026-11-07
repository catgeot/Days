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

test('fixture rows expose named places 1:1 and isFixture; path-only rows stay unpublished', () => {
  const page = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  const fixture = GATEO_ENV_FLAG_NAMES.SELF_REELS_FIXTURE;
  withViteEnv({ [page]: '1', [fixture]: '1' }, () => {
    assert.equal(isGateoSelfReelsFixtureEnabled(), true);
    const reels = getFixtureSelfReels();
    assert.equal(reels.length, 2);
    assert.equal(reels[0].places.length, 5);
    assert.equal(reels[0].placePaths.length, 5);
    assert.ok(reels.every((reel) => reel.isFixture === true));
    assert.ok(
      reels.every((reel) =>
        reel.places.every(
          (place, index) =>
            place.path === reel.placePaths[index] &&
            typeof place.name === 'string' &&
            place.name.length > 0 &&
            !place.name.startsWith('/place/'),
        ),
      ),
    );
  });
  assert.deepEqual(getPublishedSelfReels(), []);
  assert.equal(
    toPublicSelfReel({
      id: 'ops-sample',
      rightsConfirmed: true,
      credit: '출처 공공누리 표기',
      videoUrl: 'https://cdn.example/stable.mp4',
      placePaths: ['/place/a', '/place/b'],
    }),
    null,
  );
  const named = toPublicSelfReel({
    id: 'ops-sample',
    rightsConfirmed: true,
    credit: '출처 공공누리 표기',
    videoUrl: 'https://cdn.example/stable.mp4',
    places: [
      { path: '/place/a', name: '확인된 이름 A' },
      { path: '/place/b', name: '확인된 이름 B' },
    ],
  });
  assert.equal(named.isFixture, undefined);
  assert.deepEqual(named.places.map((place) => place.name), ['확인된 이름 A', '확인된 이름 B']);
});

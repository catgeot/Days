import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  SELF_REELS_VISIBLE_MIN,
  pickVisiblePlayIndex,
} from '../src/pages/SelfReels/selfReelsPlayback.js';
import { getFixtureSelfReels } from '../src/pages/SelfReels/selfReelsFixture.js';
import { getPublishedSelfReels } from '../src/pages/SelfReels/selfReelsCatalog.js';
import {
  GATEO_ENV_FLAG_NAMES,
  isGateoSelfReelsFixtureEnabled,
} from '../src/shared/gateoFeatureFlags.js';

function read(rel) {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

function withViteEnv(patch, fn) {
  const prev = { ...globalThis.__VITE_ENV__ };
  globalThis.__VITE_ENV__ = { ...prev, ...patch };
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__ = prev;
  }
}

test('pickVisiblePlayIndex returns one index when two candidates are visible', () => {
  const ratios = [0.7, 0.7, 0.1];
  const picked = pickVisiblePlayIndex(ratios, null);
  assert.equal(typeof picked, 'number');
  assert.ok(picked === 0 || picked === 1);
  assert.equal(pickVisiblePlayIndex(ratios, 1), 1);
  assert.equal(pickVisiblePlayIndex(ratios, 0), 0);
});

test('pickVisiblePlayIndex ignores rows below the visible minimum', () => {
  assert.equal(SELF_REELS_VISIBLE_MIN, 0.55);
  assert.equal(pickVisiblePlayIndex([0.54, 0.2], null), null);
  assert.equal(pickVisiblePlayIndex([0.2, 0.9], null), 1);
  assert.equal(pickVisiblePlayIndex([], 0), null);
  assert.equal(pickVisiblePlayIndex(null, 0), null);
});

test('fixture feed appears only when both self-reels flags are on', () => {
  const page = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  const fixture = GATEO_ENV_FLAG_NAMES.SELF_REELS_FIXTURE;
  withViteEnv({ [page]: '', [fixture]: '' }, () => {
    assert.equal(isGateoSelfReelsFixtureEnabled(), false);
    assert.deepEqual(getPublishedSelfReels(), []);
  });
  withViteEnv({ [page]: '1', [fixture]: '' }, () => {
    assert.equal(isGateoSelfReelsFixtureEnabled(), false);
  });
  withViteEnv({ [page]: '1', [fixture]: '1' }, () => {
    assert.equal(isGateoSelfReelsFixtureEnabled(), true);
    const reels = getFixtureSelfReels();
    assert.equal(reels.length, 2);
    assert.ok(reels.every((reel) => reel.id.startsWith('fixture-')));
  });
});

test('feed source uses muted playsInline video and keeps catalog free of fixtures', () => {
  const feed = read('src/pages/SelfReels/SelfReelsFeed.jsx');
  const page = read('src/pages/SelfReels/SelfReelsPage.jsx');
  const catalog = read('src/pages/SelfReels/selfReelsCatalog.js');
  assert.match(feed, /playsInline/);
  assert.match(feed, /muted=\{muted\}/);
  assert.match(feed, /pickVisiblePlayIndex/);
  assert.match(page, /확인할 영상이 없어요\./);
  assert.match(page, /isGateoSelfReelsFixtureEnabled/);
  assert.doesNotMatch(catalog, /selfReelsFixture|fixture-allow/);
  assert.doesNotMatch(page, /youtube|YouTubePlayerView|KOGL_REELS_RAW/i);
});

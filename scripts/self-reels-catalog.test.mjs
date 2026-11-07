import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  SELF_REELS_PUBLISHED,
  getPublishedSelfReels,
  isInternalPlacePath,
  isStableSelfReelVideoUrl,
  selectPublicSelfReels,
} from '../src/pages/SelfReels/selfReelsCatalog.js';
import {
  FIXTURE_SELF_REEL_ALLOW,
  FIXTURE_SELF_REEL_FIVE_PLACES,
} from '../src/pages/SelfReels/selfReelsFixture.js';

function read(rel) {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

function fixtureEntry(patch) {
  return {
    ...FIXTURE_SELF_REEL_ALLOW,
    id: 'fixture-case',
    placePaths: [...FIXTURE_SELF_REEL_ALLOW.placePaths],
    ...patch,
  };
}

test('published self reels stay empty and do not import fixtures', () => {
  const catalog = read('src/pages/SelfReels/selfReelsCatalog.js');
  assert.deepEqual(SELF_REELS_PUBLISHED, []);
  assert.deepEqual(getPublishedSelfReels(), []);
  assert.doesNotMatch(catalog, /selfReelsFixture|fixture-allow|fixture\.invalid/);
  assert.match(read('src/pages/SelfReels/selfReelsFixture.js'), /테스트 출처/);
});

test('a fixture row with rights, credit, https url, and one place is public', () => {
  const [reel] = selectPublicSelfReels([FIXTURE_SELF_REEL_ALLOW]);
  assert.equal(reel.id, 'fixture-allow');
  assert.match(reel.id, /^fixture-/);
  assert.deepEqual(reel.placePaths, FIXTURE_SELF_REEL_ALLOW.placePaths);
  assert.equal(reel.placePaths.length, 5);
  assert.equal(isStableSelfReelVideoUrl(reel.videoUrl), true);
});

test('five confirmed fixture places are all kept', () => {
  const [reel] = selectPublicSelfReels([FIXTURE_SELF_REEL_FIVE_PLACES]);
  assert.equal(reel.placePaths.length, 5);
  assert.deepEqual(reel.placePaths, FIXTURE_SELF_REEL_FIVE_PLACES.placePaths);
});

test('missing rights, credit, or video url drops the row', () => {
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ rightsConfirmed: false })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ rightsConfirmed: 'true' })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ credit: '테스트 출처' })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ videoUrl: '' })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ placePaths: [] })]), []);
});

test('malformed, non-https, and signed video urls are rejected', () => {
  const base = 'https://fixture.invalid/fixture-allow.mp4';
  assert.equal(isStableSelfReelVideoUrl('https://'), false);
  assert.equal(isStableSelfReelVideoUrl('http://fixture.invalid/fixture-allow.mp4'), false);
  assert.equal(isStableSelfReelVideoUrl('//fixture.invalid/fixture-allow.mp4'), false);
  assert.equal(isStableSelfReelVideoUrl('https:///fixture-allow.mp4'), false);
  assert.equal(isStableSelfReelVideoUrl('https://user:fixture@fixture.invalid/fixture-allow.mp4'), false);
  assert.equal(isStableSelfReelVideoUrl(`${base}?Signature=fixture`), false);
  assert.equal(isStableSelfReelVideoUrl(`${base}?Expires=60`), false);
  assert.equal(isStableSelfReelVideoUrl(`${base}?X-Amz-Signature=fixture`), false);
  assert.equal(isStableSelfReelVideoUrl(`${base}?x-goog-expires=60`), false);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ videoUrl: `${base}?Signature=fixture` })]), []);
});

test('external and protocol-relative place paths do not pass', () => {
  assert.equal(isInternalPlacePath('/place/fixture-path'), true);
  assert.equal(isInternalPlacePath('//fixture.invalid/place/fixture-path'), false);
  assert.equal(isInternalPlacePath('https://fixture.invalid/place/fixture-path'), false);
  assert.equal(isInternalPlacePath('place/fixture-path'), false);
  assert.equal(isInternalPlacePath('/place/../fixture-path'), false);
  assert.equal(isInternalPlacePath('/place/%2e%2e/fixture-path'), false);
  assert.equal(isInternalPlacePath('/place/fixture-path?next=https://fixture.invalid'), false);
  const mixed = fixtureEntry({
    placePaths: ['/place/fixture-path', 'https://fixture.invalid/place/fixture-path'],
  });
  assert.deepEqual(selectPublicSelfReels([mixed]), []);
});

test('non-array input is an empty public list', () => {
  assert.deepEqual(selectPublicSelfReels(null), []);
  assert.deepEqual(selectPublicSelfReels({}), []);
});

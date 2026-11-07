import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  SELF_REELS_PUBLISHED,
  getPublishedSelfReels,
  isInternalPlacePath,
  isStableSelfReelVideoUrl,
  selectPublicSelfReels,
  toPublicPlaces,
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
    places: FIXTURE_SELF_REEL_ALLOW.places.map((place) => ({ ...place })),
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

test('a fixture row with rights, credit, https url, and named places is public', () => {
  const [reel] = selectPublicSelfReels([FIXTURE_SELF_REEL_ALLOW]);
  assert.equal(reel.id, 'fixture-allow');
  assert.match(reel.id, /^fixture-/);
  assert.deepEqual(reel.places, FIXTURE_SELF_REEL_ALLOW.places);
  assert.deepEqual(
    reel.placePaths,
    FIXTURE_SELF_REEL_ALLOW.places.map((place) => place.path),
  );
  assert.equal(reel.placePaths.length, 5);
  assert.equal(isStableSelfReelVideoUrl(reel.videoUrl), true);
});

test('five confirmed fixture places keep name and href 1:1', () => {
  const [reel] = selectPublicSelfReels([FIXTURE_SELF_REEL_FIVE_PLACES]);
  assert.equal(reel.places.length, 5);
  assert.deepEqual(reel.places, FIXTURE_SELF_REEL_FIVE_PLACES.places);
  assert.deepEqual(
    reel.placePaths,
    FIXTURE_SELF_REEL_FIVE_PLACES.places.map((place) => place.path),
  );
});

test('placePaths without confirmed display names stay unpublished (공개 보류)', () => {
  assert.equal(toPublicPlaces({ placePaths: ['/place/fixture-path-1'] }), null);
  assert.deepEqual(
    selectPublicSelfReels([
      fixtureEntry({
        places: undefined,
        placePaths: ['/place/fixture-path-1'],
      }),
    ]),
    [],
  );
  assert.deepEqual(
    selectPublicSelfReels([
      fixtureEntry({
        places: [{ path: '/place/fixture-path-1', name: '' }],
      }),
    ]),
    [],
  );
  assert.deepEqual(
    selectPublicSelfReels([
      fixtureEntry({
        places: [{ path: '/place/fixture-path-1', name: ' 공백이름 ' }],
      }),
    ]),
    [],
  );
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ places: [] })]), []);
});

test('missing rights, credit, or video url drops the row', () => {
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ rightsConfirmed: false })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ rightsConfirmed: 'true' })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ credit: '테스트 출처' })]), []);
  assert.deepEqual(selectPublicSelfReels([fixtureEntry({ videoUrl: '' })]), []);
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
    places: [
      { path: '/place/fixture-path', name: '테스트 장소' },
      { path: 'https://fixture.invalid/place/fixture-path', name: '외부' },
    ],
  });
  assert.deepEqual(selectPublicSelfReels([mixed]), []);
});

test('non-array input is an empty public list', () => {
  assert.deepEqual(selectPublicSelfReels(null), []);
  assert.deepEqual(selectPublicSelfReels({}), []);
});

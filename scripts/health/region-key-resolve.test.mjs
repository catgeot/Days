import assert from 'node:assert/strict';
import test from 'node:test';

import {
  preloadRegionKeyResolve,
  resolveRegionKey,
  resolveRegionKeyFromAddr,
  resolveRegionKeyFromCoords,
  resolveRegionKeyFromHubId,
  resolveRegionKeyFromLogbookText,
  resolveRegionKeyFromPlaceSlug,
  resolveRegionKeyFromTourApi,
} from '../../src/pages/Home/lib/siteSearchAllAssets/regionKeyResolve.js';

test.before(async () => {
  await preloadRegionKeyResolve();
});

test('hubId passthrough — 화천', async () => {
  assert.equal(await resolveRegionKeyFromHubId('hwacheon'), 'hwacheon');
  assert.equal(await resolveRegionKey({ hubId: 'hwacheon' }), 'hwacheon');
});

test('addr1 token match — 강릉', async () => {
  assert.equal(
    await resolveRegionKeyFromAddr('강원특별자치도 강릉시 경포대로 365'),
    'gangneung',
  );
});

test('scenic-style passthrough — 흥정계곡 → 평창 hub', async () => {
  assert.equal(
    await resolveRegionKey({
      hubId: 'pyeongchang',
      placeSlug: 'heungjeong-valley',
      name: '흥정계곡',
    }),
    'pyeongchang',
  );
  assert.equal(await resolveRegionKeyFromPlaceSlug('pyeongchang'), 'pyeongchang');
});

test('TourAPI area+sigungu codes → hub (화천)', async () => {
  assert.equal(
    await resolveRegionKeyFromTourApi({
      areaCode: '32',
      sigunguCode: '17',
    }),
    'hwacheon',
  );
});

test('TourAPI addr1-only fallback when codes missing', async () => {
  assert.equal(
    await resolveRegionKeyFromTourApi({
      addr1: '강원특별자치도 화천군 화천읍',
    }),
    'hwacheon',
  );
});

test('coordinates-only — near 강릉 hub center', async () => {
  assert.equal(
    await resolveRegionKeyFromCoords({ lat: 37.7519, lng: 128.876 }),
    'gangneung',
  );
});

test('coordinates out of range → null (no forced match)', async () => {
  assert.equal(await resolveRegionKeyFromCoords({ lat: 20, lng: 120 }), null);
  assert.equal(
    await resolveRegionKeyFromCoords({ lat: 37.75, lng: 100 }),
    null,
  );
});

test('logbook — short token and multi-hub text → null', async () => {
  assert.equal(await resolveRegionKeyFromLogbookText({ destination: '릉' }), null);
  assert.equal(
    await resolveRegionKeyFromLogbookText({ title: '강릉 속초 당일치기' }),
    null,
  );
});

test('logbook resolved — 화천 산천어', async () => {
  assert.equal(
    await resolveRegionKeyFromLogbookText({
      destination: '화천',
      title: '산천어 축제 다녀왔어요',
    }),
    'hwacheon',
  );
});

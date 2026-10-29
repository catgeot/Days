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
import { listMultiSidoSigunguLabels } from '../../src/pages/Home/lib/koreaAdminRegionMatch.js';

test.before(async () => {
  await preloadRegionKeyResolve();
});

test('multi-sido sigungu labels derived from hub SSOT include 고성', () => {
  assert.ok(listMultiSidoSigunguLabels().has('고성'));
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

test('ambiguous sigungu alone → null (addr + logbook)', async () => {
  for (const label of ['중구', '동구', '서구', '남구', '북구', '강서구', '고성']) {
    assert.equal(await resolveRegionKeyFromAddr(label), null, `${label} addr`);
    assert.equal(
      await resolveRegionKeyFromLogbookText({ destination: label }),
      null,
      `${label} logbook`,
    );
  }
});

test('sido + ambiguous sigungu resolves to expected hub', async () => {
  assert.equal(await resolveRegionKeyFromAddr('서울 중구'), 'junggu');
  assert.equal(await resolveRegionKeyFromLogbookText({ destination: '서울 중구' }), 'junggu');
  assert.equal(await resolveRegionKeyFromAddr('부산 동구'), 'busan');
  assert.equal(await resolveRegionKeyFromAddr('경남 고성'), 'goseongnam');
  assert.equal(await resolveRegionKeyFromAddr('강원 고성'), 'goseong');
});

test('coordinates — islands and foreign exclude', async () => {
  assert.equal(await resolveRegionKeyFromCoords({ lat: 34.2, lng: 129.29 }), null);
  assert.equal(await resolveRegionKeyFromCoords({ lat: 37.97, lng: 124.63 }), 'ongjin');
  assert.equal(await resolveRegionKeyFromCoords({ lat: 37.48, lng: 130.9 }), 'ulleung');
  assert.equal(await resolveRegionKeyFromCoords({ lat: 37.24, lng: 131.87 }), 'ulleung');
});

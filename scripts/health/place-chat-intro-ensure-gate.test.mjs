import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isSyntheticOrEmptyPlaceDesc,
  needsPlaceChatIntroHydration,
  shouldEnsurePlaceChatIntroForLocation,
} from '../../src/pages/Home/lib/placeDescText.js';
import {
  hydratePlaceGalleryOverview,
  notifyPlaceChatIntroSaved,
  onPlaceChatIntroSaved,
  resetPlaceGalleryOverviewCacheForTests,
} from '../../src/pages/Home/lib/hydratePlaceGalleryOverview.js';

test('SSOT desc — ensure yes, display hydrate no', () => {
  const yap = {
    slug: 'yap',
    name: '야프',
    country: '미크로네시아 연방',
    desc: '태평양에 자리한 섬으로, 전통 석전 화폐로 유명합니다.',
  };
  assert.equal(isSyntheticOrEmptyPlaceDesc(yap), false);
  assert.equal(shouldEnsurePlaceChatIntroForLocation(yap), true);
  assert.equal(needsPlaceChatIntroHydration(yap), false);
});

test('synthetic hub pin — ensure and display hydrate both yes', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    parentCity: '서울',
    desc: '서울 · 경복궁',
  };
  assert.equal(shouldEnsurePlaceChatIntroForLocation(pin), true);
  assert.equal(needsPlaceChatIntroHydration(pin), true);
});

test('palgyeong overlay desc — ensure yes, display hydrate no', () => {
  const birae = {
    name: '비래폭포',
    parentCity: '합천',
    desc: '합천 지역의 대표 명승으로, 계곡과 폭포가 어우러진 자연 경관입니다.',
  };
  assert.equal(shouldEnsurePlaceChatIntroForLocation(birae), true);
  assert.equal(needsPlaceChatIntroHydration(birae), false);
});

test('notifyPlaceChatIntroSaved clears negative cache and notifies subscribers', async () => {
  resetPlaceGalleryOverviewCacheForTests();
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    parentCity: '서울',
    uiPlace: true,
    desc: '서울 · 경복궁',
  };
  let introCalls = 0;
  const readIntro = async () => {
    introCalls += 1;
    return introCalls === 1 ? '' : 'Cached intro after save.';
  };
  const first = await hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour: async () => '' });
  assert.equal(first, '');
  assert.equal(introCalls, 1);

  let notified = 0;
  const off = onPlaceChatIntroSaved(() => {
    notified += 1;
  });
  notifyPlaceChatIntroSaved(pin, 'ko');
  assert.equal(notified, 1);

  const second = await hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour: async () => '' });
  assert.match(second, /Cached intro/);
  assert.equal(introCalls, 2);
  off();
  resetPlaceGalleryOverviewCacheForTests();
});

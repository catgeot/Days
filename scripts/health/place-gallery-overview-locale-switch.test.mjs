import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveGalleryOverviewFixed,
  shouldFetchGalleryOverviewHydration,
  splitPlaceOverview,
} from '../../src/components/PlaceCard/common/placeOverviewText.js';
import { overviewTextIsKoreanOnly } from '../../src/pages/Home/lib/placeSeoText.js';
import {
  hydratePlaceGalleryOverview,
  resetPlaceGalleryOverviewCacheForTests,
} from '../../src/pages/Home/lib/hydratePlaceGalleryOverview.js';

const yapLikePin = {
  slug: 'yap',
  name: 'Yap',
  name_en: 'Yap',
  country: '미크로네시아',
  desc: '야프는 미크로네시아 연방의 돌돈화로 유명한 섬으로, 전통 돌돈 통화와 잠수·문화 체험이 알려져 있습니다.',
  placeChatIntroApplied: true,
};

test('KO overview uses SSOT Korean desc without EN hydrate', () => {
  const { fixed } = splitPlaceOverview(yapLikePin, 'ko');
  assert.match(fixed, /야프/);
  assert.equal(
    shouldFetchGalleryOverviewHydration({
      locale: 'ko',
      baseFixed: fixed,
      curation: '',
      location: yapLikePin,
      flagOn: true,
    }),
    false,
  );
  const merged = resolveGalleryOverviewFixed({
    baseFixed: fixed,
    hydratedFixed: '',
    locale: 'ko',
    flagOn: true,
  });
  assert.equal(merged, fixed);
});

test('EN in-page — fetch hydrate when base is Korean-only', () => {
  const { fixed: enBase } = splitPlaceOverview(yapLikePin, 'en');
  assert.equal(overviewTextIsKoreanOnly(enBase), true);
  assert.equal(
    shouldFetchGalleryOverviewHydration({
      locale: 'en',
      baseFixed: enBase,
      curation: '',
      location: yapLikePin,
      flagOn: true,
    }),
    true,
  );
});

test('KO→EN switch — hydrated EN replaces Korean placeholder body', async () => {
  resetPlaceGalleryOverviewCacheForTests();
  const { fixed: enBase } = splitPlaceOverview(yapLikePin, 'en');
  const enIntro = 'Yap is known for its stone money and traditional Pacific Island culture.';
  const hydrated = await hydratePlaceGalleryOverview(yapLikePin, {
    lng: 'en',
    readIntro: async () => enIntro,
    readTour: async () => '',
  });
  assert.equal(hydrated, enIntro);
  const merged = resolveGalleryOverviewFixed({
    baseFixed: enBase,
    hydratedFixed: hydrated,
    locale: 'en',
    flagOn: true,
  });
  assert.equal(merged, enIntro);
  assert.equal(overviewTextIsKoreanOnly(merged), false);
  resetPlaceGalleryOverviewCacheForTests();
});

test('EN→KO switch — Korean base wins without stale EN hydrate', () => {
  const { fixed: koBase } = splitPlaceOverview(yapLikePin, 'ko');
  const merged = resolveGalleryOverviewFixed({
    baseFixed: koBase,
    hydratedFixed: 'Stale English summary from prior locale.',
    locale: 'ko',
    flagOn: true,
  });
  assert.match(merged, /야프/);
  assert.doesNotMatch(merged, /Stale English/);
});

test('EN with no translation — placeholder label only when body stays Korean', () => {
  const { fixed: enBase } = splitPlaceOverview(yapLikePin, 'en');
  const merged = resolveGalleryOverviewFixed({
    baseFixed: enBase,
    hydratedFixed: '',
    locale: 'en',
    flagOn: true,
  });
  assert.equal(overviewTextIsKoreanOnly(merged), true);
  const withEn = resolveGalleryOverviewFixed({
    baseFixed: enBase,
    hydratedFixed: 'English-only summary.',
    locale: 'en',
    flagOn: true,
  });
  assert.equal(overviewTextIsKoreanOnly(withEn), false);
});

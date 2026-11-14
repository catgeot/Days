import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveGalleryOverviewFixed,
  shouldFetchGalleryOverviewHydration,
  splitPlaceOverview,
} from '../../src/components/PlaceCard/common/placeOverviewText.js';
import {
  resolveGalleryOverviewLocaleNotices,
  shouldShowMobileGalleryOverviewSection,
} from '../../src/components/PlaceCard/common/galleryOverviewLocaleNotices.js';
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

test('mobile section — EN koreanGuide when body empty', () => {
  const pin = {
    slug: 'donggureung-royal-tombs',
    name: '동구릉',
    desc: '경기 구리·남양주 조선 왕릉군으로 유네스코 세계문화유산입니다.',
  };
  const notices = resolveGalleryOverviewLocaleNotices({
    locale: 'en',
    location: pin,
    showDescriptionInKoreanLabel: false,
  });
  assert.equal(notices.showKoreanGuideNotice, true);
  assert.equal(
    shouldShowMobileGalleryOverviewSection({
      curationOverview: '',
      fixedOverview: '',
      overviewQuery: '',
      localeNotices: notices,
    }),
    true,
  );
});

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

test('EN — stale KO hydrate from prior locale must not display', () => {
  const staleKoHydrate = '추크 라군은 수중 박물관으로 불리는 곳입니다.';
  const merged = resolveGalleryOverviewFixed({
    baseFixed: '',
    hydratedFixed: staleKoHydrate,
    locale: 'en',
    flagOn: true,
  });
  assert.equal(merged, '');
  const withEnHydrate = resolveGalleryOverviewFixed({
    baseFixed: staleKoHydrate,
    hydratedFixed: 'Chuuk Lagoon is known for WWII shipwreck diving.',
    locale: 'en',
    flagOn: true,
  });
  assert.match(withEnHydrate, /Chuuk/);
  assert.equal(overviewTextIsKoreanOnly(withEnHydrate), false);
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

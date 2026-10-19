import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGalleryStockRelevanceTokens,
  filterGalleryStockForKoreaPolicy,
  isKoreanGallerySubSpot,
  isKoreanPlaceForGalleryStockPolicy,
  isStockImageRelevantToPlace,
  isStockOnlyGallery,
  normalizeFullPlaceNameToken,
  normalizeGalleryRelevanceToken,
  shouldPersistKoreanGalleryToPlaceStats,
  shouldRunTourApiLiveGalleryFetch,
  stockGalleryImageRelevanceHaystack,
} from '../../src/utils/galleryStockRelevance.js';

const CAIRO = {
  slug: 'cairo',
  name: '카이로',
  name_en: 'Cairo',
  country: '이집트',
  country_en: 'Egypt',
  lat: 30.0444,
  lng: 31.2357,
};

const YANGGU_HUB = { slug: 'yanggu', hubId: 'yanggu', name: '양구', country: '한국' };

const YANGGU_SUB = {
  slug: 'yanggu-korean-peninsula-island',
  hubId: 'yanggu',
  name: '한반도섬',
  country: '한국',
  lat: 38.25,
  lng: 127.55,
};

const HWASEONG_PEXELS = {
  id: 'pexels-hwaseong',
  source: 'pexels',
  alt: 'Suwon Hwaseong fortress wall at sunset',
  links: { html: 'https://www.pexels.com/photo/suwon-hwaseong-fortress-wall-999/' },
  urls: { small: 'https://images.pexels.com/h.jpg' },
};

const BUSAN_YANGGU_PHOTOGRAPHER = {
  id: 'pexels-busan',
  source: 'pexels',
  alt: 'Busan beach sunset',
  links: { html: 'https://www.pexels.com/photo/busan-beach-sunset-888/' },
  user: { name: 'Yanggu Kim' },
  urls: { small: 'https://images.pexels.com/i.jpg' },
};

const NAMHAN_MATCH = {
  id: 'pexels-namhan',
  source: 'pexels',
  alt: 'Namhansanseong wall trail',
  links: { html: 'https://www.pexels.com/photo/namhansanseong-fortress-trail-777/' },
  urls: { small: 'https://images.pexels.com/j.jpg' },
};

const TOUR_IMG = { id: 'tourapi-detail-1', source: 'tourapi', urls: { small: 'https://tong.visitkorea.or.kr/x.jpg' } };

test('normalizeFullPlaceNameToken drops generic words but keeps full place key', () => {
  assert.equal(normalizeFullPlaceNameToken('Namhansanseong Fortress'), 'namhansanseong');
  assert.equal(normalizeFullPlaceNameToken('한반도섬'), '한반도섬');
  assert.equal(normalizeGalleryRelevanceToken('Yang-gu, South'), 'yanggusouth');
});

test('Korea detection — inland hub and sub-spot; Cairo excluded', () => {
  assert.equal(isKoreanPlaceForGalleryStockPolicy(YANGGU_HUB), true);
  assert.equal(isKoreanPlaceForGalleryStockPolicy(YANGGU_SUB), true);
  assert.equal(isKoreanPlaceForGalleryStockPolicy(CAIRO), false);
  assert.equal(isKoreanGallerySubSpot(YANGGU_HUB), false);
  assert.equal(isKoreanGallerySubSpot(YANGGU_SUB), true);
});

test('fortress alone does not match Namhansanseong; full name does', () => {
  const tokens = buildGalleryStockRelevanceTokens({
    koreanName: '남한산성',
    englishName: 'Namhansanseong Fortress',
  });
  assert.deepEqual([...tokens], ['남한산성', 'namhansanseong']);
  assert.equal(isStockImageRelevantToPlace(HWASEONG_PEXELS, tokens), false);
  assert.equal(isStockImageRelevantToPlace(NAMHAN_MATCH, tokens), true);
});

test('haystack ignores photographer name and generic page URL', () => {
  const tokens = buildGalleryStockRelevanceTokens({ koreanName: '양구', englishName: 'Yanggu' });
  const hay = stockGalleryImageRelevanceHaystack(BUSAN_YANGGU_PHOTOGRAPHER);
  assert.match(hay, /busan/);
  assert.doesNotMatch(hay, /yanggu/);
  assert.equal(isStockImageRelevantToPlace(BUSAN_YANGGU_PHOTOGRAPHER, tokens), false);
});

test('sub-spot drops parent hub token — Yanggu beach cannot match 한반도섬', () => {
  const tokens = buildGalleryStockRelevanceTokens({
    koreanName: '한반도섬',
    englishName: 'Korean Peninsula Island',
    parentPlaceTokens: ['yanggu', 'Yanggu'],
  });
  assert.equal(tokens.has('yanggu'), false);
  const yangguBeach = {
    id: 'pexels-yanggu-beach',
    source: 'pexels',
    alt: 'Yanggu county scenic view',
    links: { html: 'https://www.pexels.com/photo/yanggu-gangwon-scenic-555/' },
    urls: { small: 'https://x' },
  };
  assert.equal(isStockImageRelevantToPlace(yangguBeach, tokens), false);
});

test('filterGalleryStockForKoreaPolicy — foreign passthrough', () => {
  const foreign = filterGalleryStockForKoreaPolicy([BUSAN_YANGGU_PHOTOGRAPHER], {
    applyKoreanStockPolicy: false,
  });
  assert.equal(foreign.length, 1);
});

test('shouldPersistKoreanGalleryToPlaceStats — filtered stock OK, mixed irrelevant blocked', () => {
  const ctx = buildGalleryStockRelevanceTokens({
    koreanName: '한반도섬',
    parentPlaceTokens: ['yanggu'],
  });
  const stockCtx = {
    relevanceTokens: ctx,
    koreanName: '한반도섬',
    parentPlaceTokens: ['yanggu'],
  };
  const hanbandoStock = {
    id: 'pexels-hanbando',
    source: 'pexels',
    alt: '한반도섬 전망',
    links: { html: 'https://www.pexels.com/photo/hanbando-island-view-444/' },
    urls: { small: 'https://x' },
  };
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([hanbandoStock], YANGGU_SUB, stockCtx),
    true,
  );
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([], YANGGU_SUB, stockCtx),
    true,
  );
  assert.equal(isStockOnlyGallery([BUSAN_YANGGU_PHOTOGRAPHER]), true);
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([BUSAN_YANGGU_PHOTOGRAPHER], YANGGU_SUB, stockCtx),
    false,
  );
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([TOUR_IMG, BUSAN_YANGGU_PHOTOGRAPHER], YANGGU_SUB, stockCtx),
    true,
  );
});

test('shouldRunTourApiLiveGalleryFetch — contentId, curated hub, homonym guard', () => {
  assert.equal(
    shouldRunTourApiLiveGalleryFetch(
      { photoKeyword: 'Random Place', curated: false },
      YANGGU_SUB,
      { hasOfficialTourContentId: true, koreanName: '한반도섬' },
    ),
    true,
  );
  assert.equal(
    shouldRunTourApiLiveGalleryFetch(
      { photoKeyword: '양구 전경', curated: true },
      YANGGU_HUB,
      { hasOfficialTourContentId: false, koreanName: '양구' },
    ),
    true,
  );
  assert.equal(
    shouldRunTourApiLiveGalleryFetch(
      { photoKeyword: 'Observatory Korea', curated: false },
      YANGGU_SUB,
      { hasOfficialTourContentId: false, koreanName: '한반도섬', englishName: 'Eulji Observatory' },
    ),
    false,
  );
  assert.equal(
    shouldRunTourApiLiveGalleryFetch(
      { photoKeyword: '한반도섬 전경', curated: false },
      YANGGU_SUB,
      { hasOfficialTourContentId: false, koreanName: '한반도섬' },
    ),
    true,
  );
});

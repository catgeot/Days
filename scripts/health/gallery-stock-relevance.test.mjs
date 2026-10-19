import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGalleryStockRelevanceTokens,
  filterGalleryStockForKoreaPolicy,
  isKoreanGallerySubSpot,
  isKoreanPlaceForGalleryStockPolicy,
  isStockImageRelevantToPlace,
  isStockOnlyGallery,
  normalizeGalleryRelevanceToken,
  shouldPersistKoreanGalleryToPlaceStats,
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

const BUSAN_PEXELS = {
  id: 'pexels-30210459',
  source: 'pexels',
  alt: 'scenic view of busan bridge',
  links: {
    html: 'https://www.pexels.com/photo/scenic-view-of-busan-bridge-and-seascape-30210459/',
  },
  urls: { small: 'https://images.pexels.com/a.jpg' },
};

const GOKSEONG_PEXELS = {
  id: 'pexels-gokseong',
  source: 'pexels',
  alt: 'Gokseong county green hills',
  links: { html: 'https://www.pexels.com/photo/gokseong-rural-landscape-123/' },
  urls: { small: 'https://images.pexels.com/b.jpg' },
};

const TOUR_IMG = { id: 'tourapi-detail-1', source: 'tourapi', urls: { small: 'https://tong.visitkorea.or.kr/x.jpg' } };

test('normalizeGalleryRelevanceToken folds case and separators', () => {
  assert.equal(normalizeGalleryRelevanceToken('Yang-gu, South'), 'yanggusouth');
  assert.equal(normalizeGalleryRelevanceToken('남한산성'), '남한산성');
});

test('Korea detection — inland hub and sub-spot; Cairo excluded', () => {
  assert.equal(isKoreanPlaceForGalleryStockPolicy(YANGGU_HUB), true);
  assert.equal(isKoreanPlaceForGalleryStockPolicy(YANGGU_SUB), true);
  assert.equal(isKoreanPlaceForGalleryStockPolicy(CAIRO), false);
  assert.equal(isKoreanGallerySubSpot(YANGGU_HUB), false);
  assert.equal(isKoreanGallerySubSpot(YANGGU_SUB), true);
});

test('stock relevance — Pexels slug/alt must contain place token', () => {
  const tokens = buildGalleryStockRelevanceTokens({
    koreanName: '양구',
    primaryQuery: 'Yanggu',
    englishName: 'Yanggu',
  });
  assert.equal(isStockImageRelevantToPlace(BUSAN_PEXELS, tokens), false);
  const yangguTokens = buildGalleryStockRelevanceTokens({
    koreanName: '양구',
    primaryQuery: 'Yanggu',
  });
  assert.equal(
    isStockImageRelevantToPlace(
      {
        id: 'pexels-yanggu',
        source: 'pexels',
        alt: 'Yanggu county valley',
        links: { html: 'https://www.pexels.com/photo/yanggu-gangwon-mountain-trail-123/' },
        urls: { small: 'https://x' },
      },
      yangguTokens,
    ),
    true,
  );
  assert.equal(isStockImageRelevantToPlace(TOUR_IMG, tokens), true);
  const hay = stockGalleryImageRelevanceHaystack(BUSAN_PEXELS);
  assert.match(hay, /busan/);
});

test('filterGalleryStockForKoreaPolicy drops drift; foreign policy passthrough', () => {
  const ctx = {
    applyKoreanStockPolicy: true,
    koreanName: '곡성',
    primaryQuery: 'Gokseong',
    relevanceTokens: buildGalleryStockRelevanceTokens({
      koreanName: '곡성',
      primaryQuery: 'Gokseong',
    }),
  };
  const filtered = filterGalleryStockForKoreaPolicy(
    [BUSAN_PEXELS, GOKSEONG_PEXELS, TOUR_IMG],
    ctx,
  );
  assert.deepEqual(filtered.map((img) => img.id), ['pexels-gokseong', 'tourapi-detail-1']);

  const foreign = filterGalleryStockForKoreaPolicy([BUSAN_PEXELS], {
    applyKoreanStockPolicy: false,
    koreanName: 'Cairo',
  });
  assert.equal(foreign.length, 1);
});

test('shouldPersistKoreanGalleryToPlaceStats blocks stock-only sub-spot', () => {
  assert.equal(isStockOnlyGallery([BUSAN_PEXELS]), true);
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([BUSAN_PEXELS], YANGGU_SUB),
    false,
  );
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([TOUR_IMG, BUSAN_PEXELS], YANGGU_SUB),
    true,
  );
  assert.equal(
    shouldPersistKoreanGalleryToPlaceStats([BUSAN_PEXELS], YANGGU_HUB),
    true,
  );
  assert.equal(shouldPersistKoreanGalleryToPlaceStats([BUSAN_PEXELS], CAIRO), true);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  galleryPersistReplaceSameAsStored,
  galleryPersistReplaceWouldShrinkStoredTailOnly,
  isStockGalleryImage,
  isTourApiDominantGallery,
  loadedStatsGalleryRefFromDbRow,
  resolveLoadedStatsPersistSnapshot,
  skipPersistPlaceGalleryReplaceReason,
} from '../../src/shared/api/placeGalleryPersist.js';

const tourA = {
  id: 'tourapi-1',
  source: 'tourapi',
  urls: { small: 'https://tong.visitkorea.or.kr/a.jpg' },
};
const tourB = {
  id: 'tourapi-2',
  source: 'tourapi',
  urls: { small: 'https://tong.visitkorea.or.kr/b.jpg' },
};
const tourBaseline = [tourA, tourB];
const stockOnly = [
  { id: 'vis-1', urls: { small: 'https://images.unsplash.com/vis-1/small' } },
  { id: 'pexels-1', source: 'pexels', urls: { small: 'https://images.pexels.com/1.jpg' } },
];

const tripleUrlRow = {
  id: 'tourapi-triple',
  source: 'tourapi',
  urls: {
    small: 'https://tong.visitkorea.or.kr/s.jpg',
    regular: 'https://tong.visitkorea.or.kr/r.jpg',
    full: 'https://tong.visitkorea.or.kr/f.jpg',
  },
};

test('loadedStatsGalleryRefFromDbRow clears on empty DB gallery (장소 전환·miss)', () => {
  assert.equal(loadedStatsGalleryRefFromDbRow(null), null);
  assert.equal(loadedStatsGalleryRefFromDbRow([]), null);
  assert.deepEqual(loadedStatsGalleryRefFromDbRow(tourBaseline), tourBaseline);
});

test('resolveLoadedStatsPersistSnapshot skips stale and applies DB row when fresh', () => {
  const row = {
    place_id: 'gyeongbokgung-palace',
    gallery_urls: tourBaseline,
  };
  assert.deepEqual(resolveLoadedStatsPersistSnapshot(row, true), { apply: false });
  assert.deepEqual(resolveLoadedStatsPersistSnapshot(row, false), {
    apply: true,
    loadedPlaceId: 'gyeongbokgung-palace',
    galleryBaseline: tourBaseline,
  });
  assert.deepEqual(resolveLoadedStatsPersistSnapshot({ gallery_urls: [] }, false), {
    apply: true,
    loadedPlaceId: '',
    galleryBaseline: null,
  });
});

test('replace unchanged requires matching id order and all URL fields', () => {
  assert.equal(galleryPersistReplaceSameAsStored(tourBaseline, tourBaseline), true);
  const httpsOnly = [
    {
      ...tourA,
      urls: { small: 'http://tong.visitkorea.or.kr/a.jpg' },
    },
    tourB,
  ];
  assert.equal(galleryPersistReplaceSameAsStored(tourBaseline, httpsOnly), false);
  assert.equal(
    skipPersistPlaceGalleryReplaceReason(tourBaseline, httpsOnly),
    null,
    'http→https on small must persist',
  );

  const tripleBaseline = [tripleUrlRow];
  assert.equal(galleryPersistReplaceSameAsStored(tripleBaseline, tripleBaseline), true);

  const regularOnlyChange = [
    {
      ...tripleUrlRow,
      urls: {
        ...tripleUrlRow.urls,
        regular: 'https://tong.visitkorea.or.kr/r-updated.jpg',
      },
    },
  ];
  assert.equal(galleryPersistReplaceSameAsStored(tripleBaseline, regularOnlyChange), false);
  assert.equal(skipPersistPlaceGalleryReplaceReason(tripleBaseline, regularOnlyChange), null);

  const fullOnlyChange = [
    {
      ...tripleUrlRow,
      urls: {
        ...tripleUrlRow.urls,
        full: 'https://tong.visitkorea.or.kr/f-updated.jpg',
      },
    },
  ];
  assert.equal(galleryPersistReplaceSameAsStored(tripleBaseline, fullOnlyChange), false);
  assert.equal(skipPersistPlaceGalleryReplaceReason(tripleBaseline, fullOnlyChange), null);
});

test('tour-dominant baseline blocks stock-only replace', () => {
  assert.equal(
    skipPersistPlaceGalleryReplaceReason(tourBaseline, stockOnly),
    'tour_to_stock_only',
  );
});

test('partial tour in payload is not blocked as tour_to_stock_only', () => {
  const mixed = [tourA, stockOnly[0]];
  assert.equal(skipPersistPlaceGalleryReplaceReason(tourBaseline, mixed), null);
  assert.equal(isTourApiDominantGallery(tourBaseline), true);
});

test('DB prefix id match with shorter payload skips replace (tail shrink)', () => {
  const stored = [
    { id: 'a', urls: { small: 'https://a/1' } },
    { id: 'b', urls: { small: 'https://b/1' } },
    { id: 'c', urls: { small: 'https://c/1' } },
  ];
  assert.equal(galleryPersistReplaceWouldShrinkStoredTailOnly(stored, stored.slice(0, 2)), true);
  assert.equal(skipPersistPlaceGalleryReplaceReason(stored, stored.slice(0, 2)), 'unchanged');
  assert.equal(
    skipPersistPlaceGalleryReplaceReason(stored, [stored[0], stored[2]]),
    null,
  );
});

test('non-stock mixed payload is not blocked as tour_to_stock_only', () => {
  const unknown = { id: 'legacy-db-1', urls: { small: 'https://cdn.example/photo.jpg' } };
  const payload = [stockOnly[0], unknown];
  assert.equal(isStockGalleryImage(unknown), false);
  assert.equal(skipPersistPlaceGalleryReplaceReason(tourBaseline, payload), null);
});

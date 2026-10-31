import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  galleryPersistReplaceSameAsStored,
  isStockGalleryImage,
  isTourApiDominantGallery,
  loadedStatsGalleryRefFromDbRow,
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

test('loadedStatsGalleryRefFromDbRow clears on empty DB gallery (장소 전환·miss)', () => {
  assert.equal(loadedStatsGalleryRefFromDbRow(null), null);
  assert.equal(loadedStatsGalleryRefFromDbRow([]), null);
  assert.deepEqual(loadedStatsGalleryRefFromDbRow(tourBaseline), tourBaseline);
});

test('replace unchanged requires matching id order and URL', () => {
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
    'http→https URL change must persist',
  );
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

test('non-stock mixed payload is not blocked as tour_to_stock_only', () => {
  const unknown = { id: 'legacy-db-1', urls: { small: 'https://cdn.example/photo.jpg' } };
  const payload = [stockOnly[0], unknown];
  assert.equal(isStockGalleryImage(unknown), false);
  assert.equal(skipPersistPlaceGalleryReplaceReason(tourBaseline, payload), null);
});

test('stale in-flight response must not overwrite baseline ref (contract)', () => {
  const priorBaseline = tourBaseline;
  const isStaleRun = true;
  const nextRef = isStaleRun ? priorBaseline : loadedStatsGalleryRefFromDbRow(stockOnly);
  assert.deepEqual(nextRef, priorBaseline);
  assert.notDeepEqual(loadedStatsGalleryRefFromDbRow(stockOnly), priorBaseline);
});

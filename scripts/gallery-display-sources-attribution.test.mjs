import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatGalleryDisplaySourcesAttribution,
  summarizeGalleryDisplaySources,
} from '../src/components/PlaceCard/common/galleryImageAttribution.js';

const tourImg = { id: 'tourapi-detail-1', source: 'tourapi' };
const unsplashImg = { id: 'u-1', urls: {}, user: {} };
const pexelsImg = { id: 'pexels-1', source: 'pexels' };

test('tour-only attribution — 사진: 한국관광공사', () => {
  assert.deepEqual(summarizeGalleryDisplaySources([tourImg, tourImg]), {
    tourapi: true,
    unsplash: false,
    pexels: false,
  });
  assert.equal(
    formatGalleryDisplaySourcesAttribution([tourImg, tourImg], 'ko'),
    '사진: 한국관광공사',
  );
});

test('stock-only keeps Unsplash · Pexels rate limit line', () => {
  assert.equal(
    formatGalleryDisplaySourcesAttribution([unsplashImg, pexelsImg], 'ko', {
      refreshCooldownSec: 30,
    }),
    'Unsplash · Pexels · 30초에 한 번',
  );
});

test('mixed tour and stock lists each source', () => {
  assert.equal(
    formatGalleryDisplaySourcesAttribution([tourImg, unsplashImg], 'ko', {
      refreshCooldownSec: 30,
    }),
    '사진: 한국관광공사 · Unsplash · 30초에 한 번',
  );
});

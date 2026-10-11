import assert from 'node:assert/strict';
import test from 'node:test';
import {
  placeGalleryScrollToRestore,
  rememberPlaceGalleryScroll,
} from '../../src/components/PlaceCard/common/placeScrollMemory.js';

test('back to a place restores its gallery scroll and a fresh open does not', () => {
  rememberPlaceGalleryScroll('cairo', 416);
  rememberPlaceGalleryScroll('grand-egyptian-museum', 0);
  assert.equal(placeGalleryScrollToRestore('cairo', 'POP'), 416);
  assert.equal(placeGalleryScrollToRestore('cairo', 'PUSH'), 0);
  assert.equal(placeGalleryScrollToRestore('grand-egyptian-museum', 'POP'), 0);
  assert.equal(placeGalleryScrollToRestore('missing', 'POP'), 0);
});

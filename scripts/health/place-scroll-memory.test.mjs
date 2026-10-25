import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  clearPlaceGalleryScrollBack,
  peekGalleryScrollForPlaceBack,
  placeGalleryScrollToRestore,
  rememberPlaceGalleryScroll,
  snapshotGalleryScrollForPlaceBack,
} from '../../src/components/PlaceCard/common/placeScrollMemory.js';

function withGalleryScrollDom(scrollTop) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  globalThis.document = dom.window.document;
  const el = dom.window.document.createElement('div');
  el.setAttribute('data-place-gallery-scroll', '');
  el.scrollTop = scrollTop;
  dom.window.document.body.appendChild(el);
  return dom;
}

test('back to a place restores its gallery scroll and a fresh open does not', () => {
  const dom = withGalleryScrollDom(416);
  snapshotGalleryScrollForPlaceBack('cairo');
  assert.equal(placeGalleryScrollToRestore('cairo', 'POP'), 416);
  clearPlaceGalleryScrollBack('cairo');
  assert.equal(peekGalleryScrollForPlaceBack('cairo'), 0);
  assert.equal(placeGalleryScrollToRestore('cairo', 'POP'), 0);
  assert.equal(placeGalleryScrollToRestore('cairo', 'PUSH'), 0);

  rememberPlaceGalleryScroll('grand-egyptian-museum', 0);
  assert.equal(placeGalleryScrollToRestore('grand-egyptian-museum', 'POP'), 0);
  assert.equal(placeGalleryScrollToRestore('missing', 'POP'), 0);
  dom.window.close();
});

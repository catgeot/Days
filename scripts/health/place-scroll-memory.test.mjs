import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  clearPlaceGalleryScrollBack,
  GALLERY_SCROLL_REALIGN_TIMEOUT_MS,
  isGalleryBackRestoreDue,
  peekGalleryScrollForPlaceBack,
  placeGalleryScrollToRestore,
  rememberPlaceGalleryScroll,
  scheduleOneGalleryScrollRealignAfterImages,
  snapshotGalleryScrollForPlaceBack,
} from '../../src/components/PlaceCard/common/placeScrollMemory.js';

function withGalleryScrollDom(scrollTop) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/cairo',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;
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

test('isGalleryBackRestoreDue is POP-only when back snapshot is armed', () => {
  const dom = withGalleryScrollDom(280);
  snapshotGalleryScrollForPlaceBack('cairo');
  assert.equal(peekGalleryScrollForPlaceBack('cairo'), 280);
  assert.equal(dom.window.sessionStorage.getItem('gateo:place-gallery-back-armed:cairo'), '1');
  assert.equal(isGalleryBackRestoreDue('cairo', 'POP'), true);
  assert.equal(isGalleryBackRestoreDue('cairo', 'PUSH'), false);
  assert.equal(isGalleryBackRestoreDue('cairo', 'REPLACE'), false);
  clearPlaceGalleryScrollBack('cairo');
  assert.equal(isGalleryBackRestoreDue('cairo', 'POP'), false);
  dom.window.close();
});

test('scheduleOneGalleryScrollRealignAfterImages re-applies scroll once after img load', async () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/cairo',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.requestAnimationFrame = (cb) => {
    cb();
    return 0;
  };
  const root = dom.window.document.createElement('div');
  root.scrollTop = 0;
  const img = dom.window.document.createElement('img');
  Object.defineProperty(img, 'complete', { value: false, configurable: true });
  root.appendChild(img);
  dom.window.document.body.appendChild(root);
  img.getBoundingClientRect = () => ({ top: 0, bottom: 100, left: 0, right: 100 });
  root.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 390 });

  let done = false;
  const cleanup = scheduleOneGalleryScrollRealignAfterImages(root, 412, () => {
    done = true;
  });
  assert.equal(root.scrollTop, 0);
  img.dispatchEvent(new dom.window.Event('load'));
  assert.equal(root.scrollTop, 412);
  assert.equal(done, true);
  cleanup();
  dom.window.close();
});

test('scheduleOneGalleryScrollRealignAfterImages cancels on wheel', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/cairo',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  const root = dom.window.document.createElement('div');
  root.scrollTop = 50;
  const img = dom.window.document.createElement('img');
  Object.defineProperty(img, 'complete', { value: false, configurable: true });
  root.appendChild(img);
  dom.window.document.body.appendChild(root);
  img.getBoundingClientRect = () => ({ top: 0, bottom: 100, left: 0, right: 100 });
  root.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 390 });

  let done = false;
  const cleanup = scheduleOneGalleryScrollRealignAfterImages(root, 412, () => {
    done = true;
  });
  dom.window.dispatchEvent(new dom.window.WheelEvent('wheel', { bubbles: true }));
  img.dispatchEvent(new dom.window.Event('load'));
  assert.equal(root.scrollTop, 50);
  assert.equal(done, true);
  cleanup();
  dom.window.close();
});

test('scheduleOneGalleryScrollRealignAfterImages ignores offscreen lazy images past timeout', async () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/cairo',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.performance = dom.window.performance;
  globalThis.requestAnimationFrame = (cb) => {
    cb();
    return 0;
  };
  const root = dom.window.document.createElement('div');
  root.scrollTop = 0;
  const offscreen = dom.window.document.createElement('img');
  Object.defineProperty(offscreen, 'complete', { value: false, configurable: true });
  root.appendChild(offscreen);
  dom.window.document.body.appendChild(root);
  offscreen.getBoundingClientRect = () => ({ top: 900, bottom: 1100, left: 0, right: 100 });
  root.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 390 });

  let done = false;
  scheduleOneGalleryScrollRealignAfterImages(root, 280, () => {
    done = true;
  });
  await new Promise((r) => setTimeout(r, GALLERY_SCROLL_REALIGN_TIMEOUT_MS + 40));
  assert.equal(root.scrollTop, 280);
  assert.equal(done, true);
  offscreen.dispatchEvent(new dom.window.Event('load'));
  assert.equal(root.scrollTop, 280);
  dom.window.close();
});

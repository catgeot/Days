import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  PLACE_REVIEW_ANCHOR_PREFIX,
  buildPlaceReviewsHref,
  parsePlaceReviewFocusId,
  placeReviewDomId,
  placeReviewFocusSearchWithoutReview,
  findPlaceReviewElement,
  measurePlaceReviewScrollHeaderOffset,
  startPlaceReviewFocusSession,
} from '../../src/utils/placeReviewFocus.js';
import { EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM } from '../../src/logbookOfficialReviews/constants.js';
import {
  clearPlaceGalleryScrollBack,
  peekGalleryScrollForPlaceBack,
  placeGalleryScrollToRestore,
  rememberPlaceGalleryScroll,
  snapshotGalleryScrollForPlaceBack,
} from '../../src/components/PlaceCard/common/placeScrollMemory.js';

test('placeReviewDomId is stable per review id', () => {
  assert.equal(placeReviewDomId('abc-123'), `${PLACE_REVIEW_ANCHOR_PREFIX}abc-123`);
  assert.equal(placeReviewDomId(''), null);
});

test('parsePlaceReviewFocusId reads review query param', () => {
  assert.equal(parsePlaceReviewFocusId('?review=42'), '42');
  assert.equal(parsePlaceReviewFocusId(new URLSearchParams('review=e2e-focus')), 'e2e-focus');
  assert.equal(parsePlaceReviewFocusId(''), null);
});

test('buildPlaceReviewsHref encodes review deep link', () => {
  assert.equal(buildPlaceReviewsHref('/place/cairo', '99'), '/place/cairo/reviews?review=99');
  assert.equal(buildPlaceReviewsHref('/place/cairo', ''), '/place/cairo/reviews');
});

test('placeReviewFocusSearchWithoutReview strips review param', () => {
  const next = placeReviewFocusSearchWithoutReview(
    new URLSearchParams(`${EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM}=x&lang=ko`),
  );
  assert.equal(next.get(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM), null);
  assert.equal(next.get('lang'), 'ko');
});

function stubVisibleRect(el, rect = { width: 120, height: 80, top: 120, bottom: 200, left: 0, right: 120 }) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ ...rect }),
  });
}

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/cairo/reviews',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Document = dom.window.Document;
  globalThis.CSS = dom.window.CSS;
  dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
  return dom;
}

test('findPlaceReviewElement prefers reviews scroll root over hub list items', () => {
  globalThis.__VITE_ENV__ = { VITE_GATEO_LOGBOOK_REVIEW_HUB: '1' };
  const dom = setupDom();
  const hubItem = dom.window.document.createElement('a');
  hubItem.setAttribute('data-review-id', 'hub-id');
  hubItem.setAttribute('data-testid', 'logbook-official-review-hub-item');
  dom.window.document.body.appendChild(hubItem);

  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-reviews-scroll-root', '');
  const card = dom.window.document.createElement('div');
  card.id = 'place-review-hub-id';
  card.setAttribute('data-review-id', 'hub-id');
  stubVisibleRect(card);
  root.appendChild(card);
  dom.window.document.body.appendChild(root);

  const found = findPlaceReviewElement('hub-id');
  assert.equal(found, card);
  dom.window.close();
});

test('measurePlaceReviewScrollHeaderOffset sums scroll chrome nodes', () => {
  globalThis.__VITE_ENV__ = { VITE_GATEO_LOGBOOK_REVIEW_HUB: '1' };
  const dom = setupDom();
  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-reviews-scroll-root', '');
  Object.defineProperty(root, 'getBoundingClientRect', {
    value: () => ({ height: 400, top: 0, bottom: 400, left: 0, right: 0, width: 100 }),
  });
  const chromeA = dom.window.document.createElement('div');
  chromeA.setAttribute('data-place-reviews-scroll-chrome', '');
  Object.defineProperty(chromeA, 'getBoundingClientRect', {
    value: () => ({ height: 40, top: 0, bottom: 40, left: 0, right: 0, width: 100 }),
  });
  const chromeB = dom.window.document.createElement('div');
  chromeB.setAttribute('data-place-reviews-scroll-chrome', '');
  Object.defineProperty(chromeB, 'getBoundingClientRect', {
    value: () => ({ height: 52, top: 40, bottom: 92, left: 0, right: 0, width: 100 }),
  });
  root.append(chromeA, chromeB);
  dom.window.document.body.appendChild(root);
  dom.window.matchMedia = () => ({ matches: true });
  assert.equal(measurePlaceReviewScrollHeaderOffset(root), 12 + 92);
  dom.window.close();
});

test('focus session timeout does not force scroll to top', async () => {
  const dom = setupDom();
  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-reviews-scroll-root', '');
  root.style.height = '400px';
  root.style.overflow = 'auto';
  Object.defineProperty(root, 'clientHeight', { value: 400 });
  root.scrollTop = 180;
  dom.window.document.body.appendChild(root);

  const { promise } = startPlaceReviewFocusSession('missing-id', root, {
    maxWaitMs: 120,
    pollMs: 30,
  });
  const result = await promise;
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'timeout');
  assert.equal(root.scrollTop, 180);
  dom.window.close();
});

test('focus session aborts on user wheel before review appears', async () => {
  const dom = setupDom();
  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-reviews-scroll-root', '');
  Object.defineProperty(root, 'clientHeight', { value: 400 });
  root.scrollTop = 95;
  dom.window.document.body.appendChild(root);

  const { promise } = startPlaceReviewFocusSession('later-id', root, {
    maxWaitMs: 800,
    pollMs: 40,
  });

  dom.window.setTimeout(() => {
    root.dispatchEvent(new dom.window.WheelEvent('wheel', { bubbles: true }));
  }, 60);

  const result = await promise;
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'user-interacted');
  assert.equal(root.scrollTop, 95);
  dom.window.close();
});

test('snapshotGalleryScrollForPlaceBack stores offset for POP restore', () => {
  const dom = setupDom();
  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-gallery-scroll', '');
  root.scrollTop = 340;
  dom.window.document.body.appendChild(root);
  snapshotGalleryScrollForPlaceBack('cairo');
  assert.equal(peekGalleryScrollForPlaceBack('cairo'), 340);
  assert.equal(placeGalleryScrollToRestore('cairo', 'POP'), 340);
  assert.equal(peekGalleryScrollForPlaceBack('cairo'), 340);
  clearPlaceGalleryScrollBack('cairo');
  assert.equal(peekGalleryScrollForPlaceBack('cairo'), 0);
  assert.equal(placeGalleryScrollToRestore('cairo', 'POP'), 0);
  assert.equal(placeGalleryScrollToRestore('cairo', 'PUSH'), 0);
  dom.window.close();
});

test('focus session release after found keeps highlight until timer ends', async () => {
  const dom = setupDom();
  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-reviews-scroll-root', '');
  Object.defineProperty(root, 'clientHeight', { value: 400 });
  root.scrollTo = () => {};
  const card = dom.window.document.createElement('div');
  card.id = 'place-review-hl-id';
  card.setAttribute('data-review-id', 'hl-id');
  stubVisibleRect(card);
  Object.defineProperty(card, 'offsetParent', { get: () => root });
  root.appendChild(card);
  dom.window.document.body.appendChild(root);

  const { promise, release, getResult } = startPlaceReviewFocusSession('hl-id', root, {
    maxWaitMs: 500,
    pollMs: 20,
  });
  const result = await promise;
  assert.equal(result.reason, 'found');
  assert.equal(card.classList.contains('place-review-focus-highlight'), true);
  release();
  assert.equal(getResult()?.reason, 'found');
  assert.equal(card.classList.contains('place-review-focus-highlight'), true);
  dom.window.close();
});

test('focus session abort clears pending work before late DOM insert', async () => {
  const dom = setupDom();
  const root = dom.window.document.createElement('div');
  root.setAttribute('data-place-reviews-scroll-root', '');
  Object.defineProperty(root, 'clientHeight', { value: 400 });
  dom.window.document.body.appendChild(root);

  const { promise, abort } = startPlaceReviewFocusSession('late-review', root, {
    maxWaitMs: 2000,
    pollMs: 40,
  });
  abort();

  const card = dom.window.document.createElement('div');
  card.id = 'place-review-late-review';
  card.setAttribute('data-review-id', 'late-review');
  root.appendChild(card);

  const result = await promise;
  assert.equal(result.reason, 'aborted');
  assert.equal(card.classList.contains('place-review-focus-highlight'), false);
  dom.window.close();
});

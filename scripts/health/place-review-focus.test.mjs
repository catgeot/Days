import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  PLACE_REVIEW_ANCHOR_PREFIX,
  PLACE_REVIEW_FOCUS_STATE_ID,
  buildPlaceReviewsHref,
  orderPlaceReviewsForDeepLink,
  parsePlaceReviewFocusId,
  placeReviewDomId,
  placeReviewFocusSearchWithoutReview,
  readPlaceReviewFocusIdFromBrowser,
  readPlaceReviewFocusIdFromHistory,
  startPlaceReviewFocusSession,
  withPlaceReviewFocusHistory,
} from '../../src/utils/placeReviewFocus.js';
import { EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM } from '../../src/logbookOfficialReviews/constants.js';
import { mediaModeFromPathname } from '../../src/components/PlaceCard/common/placeMediaTabRoutes.js';
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

test('orderPlaceReviewsForDeepLink puts the linked review first and keeps the rest', () => {
  const food = { id: 'food', persona_label: '미식갑니다', created_at: '2026-11-02T00:00:00Z' };
  const walk = { id: 'walk', persona_label: '느린산책', created_at: '2026-10-01T00:00:00Z' };
  const night = { id: 'night', persona_label: '야경렌즈', created_at: '2026-09-01T00:00:00Z' };
  const byDate = [food, walk, night];
  const ordered = orderPlaceReviewsForDeepLink(byDate, 'walk');
  assert.deepEqual(ordered.map((row) => row.id), ['walk', 'food', 'night']);
  assert.equal(orderPlaceReviewsForDeepLink(byDate, 'food'), byDate);
  assert.equal(orderPlaceReviewsForDeepLink(byDate, 'missing'), byDate);
  assert.equal(orderPlaceReviewsForDeepLink(byDate, ''), byDate);
});

test('review focus history is scoped to the place slug', () => {
  const state = withPlaceReviewFocusHistory(
    { returnTo: '/blog?tab=public&region=overseas', fromLogbookReviewHub: true },
    'walk-id',
    'rome',
  );
  assert.equal(state.returnTo, '/blog?tab=public&region=overseas');
  assert.equal(state.fromLogbookReviewHub, true);
  assert.equal(state[PLACE_REVIEW_FOCUS_STATE_ID], 'walk-id');
  assert.equal(readPlaceReviewFocusIdFromHistory(state, 'rome'), 'walk-id');
  assert.equal(readPlaceReviewFocusIdFromHistory(state, 'osaka'), null);
  assert.equal(readPlaceReviewFocusIdFromHistory(null, 'rome'), null);
});

test('browser history still names the linked review after the router state is empty', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/rome/reviews',
  });
  globalThis.window = dom.window;
  globalThis.history = dom.window.history;
  dom.window.history.replaceState({
    usr: withPlaceReviewFocusHistory(null, 'walk-id', 'rome'),
    idx: 1,
  }, '');
  assert.equal(readPlaceReviewFocusIdFromBrowser('rome'), 'walk-id');
  assert.equal(readPlaceReviewFocusIdFromBrowser('osaka'), null);
  assert.equal(mediaModeFromPathname('/place/rome/reviews'), 'REVIEWS');
  assert.equal(mediaModeFromPathname('/place/hwaseong-fortress'), 'GALLERY');
  assert.equal(mediaModeFromPathname('/blog'), null);
  dom.window.close();
});

test('placeReviewFocusSearchWithoutReview strips review param', () => {
  const next = placeReviewFocusSearchWithoutReview(
    new URLSearchParams(`${EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM}=x&lang=ko`),
  );
  assert.equal(next.get(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM), null);
  assert.equal(next.get('lang'), 'ko');
});

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.gateo.kr/place/cairo/reviews',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Document = dom.window.Document;
  dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
  return dom;
}

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

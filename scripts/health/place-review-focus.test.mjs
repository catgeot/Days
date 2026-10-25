import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLACE_REVIEW_ANCHOR_PREFIX,
  buildPlaceReviewsHref,
  parsePlaceReviewFocusId,
  placeReviewDomId,
} from '../../src/utils/placeReviewFocus.js';

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

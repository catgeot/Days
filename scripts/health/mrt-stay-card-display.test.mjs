import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveMrtStayReviewDisplay,
  resolveMrtStayStarCount,
} from '../../src/utils/mrtStayCardDisplay.js';

test('resolveMrtStayStarCount ignores missing and invalid', () => {
  assert.equal(resolveMrtStayStarCount(null), null);
  assert.equal(resolveMrtStayStarCount({ starRating: 0 }), null);
  assert.equal(resolveMrtStayStarCount({ starRating: 4.2 }), 4);
  assert.equal(resolveMrtStayStarCount({ starRating: 5.8 }), 5);
});

test('resolveMrtStayReviewDisplay uses reviewCount only when positive', () => {
  assert.deepEqual(resolveMrtStayReviewDisplay({}), { score: '', count: null });
  assert.deepEqual(resolveMrtStayReviewDisplay({ reviewScore: '4.7' }), {
    score: '4.7',
    count: null,
  });
  assert.deepEqual(resolveMrtStayReviewDisplay({ reviewScore: '4.7', reviewCount: 120 }), {
    score: '4.7',
    count: 120,
  });
  assert.deepEqual(resolveMrtStayReviewDisplay({ reviewScore: '4.7', reviewCount: 0 }), {
    score: '4.7',
    count: null,
  });
});

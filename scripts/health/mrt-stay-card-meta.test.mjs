import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatMrtStayStarRatingLabel,
  mrtStayCardMetaLines,
} from '../../src/utils/mrtStayCardMeta.js';

const t = (key, opts) => {
  if (key === 'home.stayStrip.hotelStars') return `${opts.count}성급`;
  return key;
};

test('star rating: integer starRating 1–5 only', () => {
  assert.equal(formatMrtStayStarRatingLabel(4, t), '4성급');
  assert.equal(formatMrtStayStarRatingLabel(5, t), '5성급');
  assert.equal(formatMrtStayStarRatingLabel(4.7, t), '');
  assert.equal(formatMrtStayStarRatingLabel(6, t), '');
  assert.equal(formatMrtStayStarRatingLabel(null, t), '');
});

test('meta lines ignore non-star fields', () => {
  assert.deepEqual(mrtStayCardMetaLines({ starRating: 4, categoryName: '호텔' }, t), {
    starLine: '4성급',
  });
  assert.deepEqual(mrtStayCardMetaLines({ itemName: 'Only name' }, t), { starLine: '' });
});

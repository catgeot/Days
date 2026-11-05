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

test('star rating label from starRating only', () => {
  assert.equal(formatMrtStayStarRatingLabel(4, t), '4성급');
  assert.equal(formatMrtStayStarRatingLabel(null, t), '');
  assert.equal(formatMrtStayStarRatingLabel(0, t), '');
});

test('detail line uses passthrough fields only', () => {
  assert.deepEqual(
    mrtStayCardMetaLines({ starRating: 5, categoryLabel: '호텔', address: 'Foz do Iguaçu' }, t),
    { starLine: '5성급', detailLine: '호텔 · Foz do Iguaçu' },
  );
  assert.deepEqual(mrtStayCardMetaLines({ itemName: 'Only name' }, t), {
    starLine: '',
    detailLine: '',
  });
});

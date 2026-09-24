import assert from 'node:assert/strict';
import {
  appendGateoReferralUtm,
  collectUniqueEditorialReviewImageCredits,
  resolveEditorialReviewImageCredit,
} from '../src/utils/editorialReviewImageCredit.js';

assert.equal(
  appendGateoReferralUtm('https://unsplash.com/@ada'),
  'https://unsplash.com/@ada?utm_source=gateo&utm_medium=referral',
);

assert.equal(
  appendGateoReferralUtm('https://unsplash.com/photos/x?utm_source=gateo&utm_medium=referral'),
  'https://unsplash.com/photos/x?utm_source=gateo&utm_medium=referral',
);

const linked = resolveEditorialReviewImageCredit({
  url: 'https://images.unsplash.com/photo-1',
  photographer: 'Ada Lovelace',
  photographer_url: 'https://unsplash.com/@ada',
  unsplash_url: 'https://unsplash.com/photos/abc',
});
assert.equal(linked?.type, 'unsplash');
assert.equal(linked?.photographerName, 'Ada Lovelace');
assert.match(linked?.photographerHref, /utm_source=gateo/);

const plain = resolveEditorialReviewImageCredit({
  credit: 'Photo by Ada on Unsplash',
});
assert.deepEqual(plain, { type: 'plain', text: 'Photo by Ada on Unsplash' });

const deduped = collectUniqueEditorialReviewImageCredits([
  { photographer: 'Ada', photographer_url: 'https://unsplash.com/@ada' },
  { photographer: 'Ada', photographer_url: 'https://unsplash.com/@ada' },
  { credit: '사진 출처: 한국관광공사' },
]);
assert.equal(deduped.length, 2);

console.log('smoke-editorial-review-image-credit: OK');

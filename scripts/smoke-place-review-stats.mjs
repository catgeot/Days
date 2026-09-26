import assert from 'node:assert/strict';
import { resolveReviewThumbnailSrc } from '../src/utils/placeReviewContentBlocks.js';
import {
  buildTravelerAggregateRatingSchema,
  computePlaceReviewStats,
} from '../src/utils/placeReviewStats.js';

const thumb = resolveReviewThumbnailSrc({
  url: 'https://images.unsplash.com/photo-1?auto=format',
});
assert.match(thumb, /w=120/);
assert.match(thumb, /fit=crop/);

const mixed = computePlaceReviewStats([
  { rating: 5, is_editorial: false },
  { rating: 3, is_editorial: false },
  { rating: 5, is_editorial: true },
]);
assert.equal(mixed.travelerCount, 2);
assert.equal(mixed.editorialCount, 1);
assert.equal(mixed.averageRating, 4);
assert.equal(mixed.averageRatingDisplay, '4.0');

const editorialOnly = computePlaceReviewStats([{ rating: 5, is_editorial: true }]);
assert.equal(editorialOnly.travelerCount, 0);
assert.equal(editorialOnly.editorialCount, 1);
assert.equal(editorialOnly.averageRating, null);
assert.equal(buildTravelerAggregateRatingSchema(editorialOnly), null);

const aggregate = buildTravelerAggregateRatingSchema(mixed);
assert.equal(aggregate?.reviewCount, 2);
assert.equal(aggregate?.ratingValue, 4);

console.log('smoke-place-review-stats: PASS');

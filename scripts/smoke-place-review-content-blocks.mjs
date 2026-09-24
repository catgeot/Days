import assert from 'node:assert/strict';
import {
  getCollapsedPreviewText,
  getGalleryImageEntries,
  getReferencedImageIndices,
  hasReviewContentBlocks,
  normalizeReviewContentBlocks,
  reviewHasHiddenMediaWhenCollapsed,
} from '../src/utils/placeReviewContentBlocks.js';

const blocks = [
  { type: 'text', text: '첫 문단' },
  { type: 'image', image_index: 0 },
  { type: 'text', text: '둘째 문단' },
  { type: 'image', image_id: 2 },
];

assert.equal(hasReviewContentBlocks(blocks), true);
assert.equal(hasReviewContentBlocks([]), false);

assert.deepEqual(normalizeReviewContentBlocks(blocks).map((b) => b.type), [
  'text',
  'image',
  'text',
  'image',
]);

assert.deepEqual([...getReferencedImageIndices(blocks)].sort(), [0, 2]);

const images = [{ url: 'a' }, { url: 'b' }, { url: 'c' }, { url: 'd' }];
const gallery = getGalleryImageEntries(images, blocks);
assert.deepEqual(gallery.map((e) => e.index), [1, 3]);

const review = { content: 'legacy', content_blocks: blocks, images };
assert.equal(getCollapsedPreviewText(review), '첫 문단\n\n둘째 문단');
assert.equal(reviewHasHiddenMediaWhenCollapsed(review), true);

assert.equal(getCollapsedPreviewText({ content: 'plain only' }), 'plain only');
assert.equal(reviewHasHiddenMediaWhenCollapsed({ content_blocks: [{ type: 'text', text: 'x' }] }), false);

console.log('smoke-place-review-content-blocks: OK');

import assert from 'node:assert/strict';
import {
  getCollapsedPreviewText,
  getGalleryImageEntries,
  getReferencedImageIndices,
  hasReviewContentBlocks,
  normalizeReviewContentBlocks,
  reviewHasHiddenMediaWhenCollapsed,
} from '../src/utils/placeReviewContentBlocks.js';
import {
  buildReviewSavePayload,
  collapseBlocksToLegacyIfNoInlineImages,
  countTextCharsInBlocks,
  initEditorBlocksFromReview,
  insertImageAtCursorInContent,
  insertImageInTextBlock,
  isImageReferencedInBlocks,
  repairBlocksAfterImageIndexSwap,
  repairBlocksAfterImageRemoved,
  removeInlineImageFromBlocks,
} from '../src/utils/reviewEditorContentBlocks.js';

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

const inserted = insertImageAtCursorInContent('hello world', 5, 1);
assert.deepEqual(inserted.map((b) => b.type), ['text', 'image', 'text']);
assert.equal(inserted[0].text, 'hello');
assert.equal(inserted[1].image_index, 1);
assert.equal(inserted[2].text, ' world');

const splitBlock = insertImageInTextBlock(
  [{ type: 'text', text: 'abcd' }],
  0,
  2,
  0
);
assert.deepEqual(splitBlock.map((b) => b.type), ['text', 'image', 'text']);

const afterRemove = repairBlocksAfterImageRemoved(
  [
    { type: 'text', text: 'a' },
    { type: 'image', image_index: 2 },
    { type: 'image', image_index: 3 },
  ],
  1
);
assert.deepEqual(
  afterRemove.filter((b) => b.type === 'image').map((b) => b.image_index),
  [1, 2]
);

const swapped = repairBlocksAfterImageIndexSwap(
  [{ type: 'image', image_index: 0 }, { type: 'image', image_index: 1 }],
  0,
  1
);
assert.deepEqual(swapped.map((b) => b.image_index), [1, 0]);

const stripped = removeInlineImageFromBlocks(
  [{ type: 'text', text: 'only' }, { type: 'image', image_index: 0 }],
  0
);
const legacy = collapseBlocksToLegacyIfNoInlineImages(stripped);
assert.equal(legacy.contentBlocks, null);
assert.equal(legacy.content, 'only');

const legacyPayload = buildReviewSavePayload({
  place_name: 'P',
  content: 'plain',
  contentBlocks: null,
  images: ['u1'],
  rating: 5,
  is_public: true,
});
assert.equal(legacyPayload.content_blocks, null);
assert.equal(legacyPayload.content, 'plain');

const blocksPayload = buildReviewSavePayload({
  place_name: 'P',
  content: '',
  contentBlocks: [{ type: 'text', text: 't' }, { type: 'image', image_index: 0 }],
  images: ['u1'],
  rating: 5,
  is_public: true,
});
assert.ok(Array.isArray(blocksPayload.content_blocks));
assert.equal(blocksPayload.content, 't');

assert.deepEqual(initEditorBlocksFromReview({ content_blocks: blocks }).length, 4);

console.log('smoke-place-review-content-blocks: OK');

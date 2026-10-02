import assert from 'node:assert/strict';
import {
  dedupeReviewLinkItems,
  getCollapsedPreviewText,
  getGalleryImageEntries,
  getReferencedImageIndices,
  hasReviewContentBlocks,
  normalizeReviewContentBlocks,
  reviewBodyLinkUrlKeys,
  reviewHasHiddenMediaWhenCollapsed,
  reviewLinkUrlKey,
  shouldShowReviewBottomGallery,
  shouldShowReviewExpandToggle,
  getReviewLeadThumbnailImageIndex,
} from '../src/utils/placeReviewContentBlocks.js';
import {
  applyAiTextToContentBlocks,
  applyAttachmentRemoval,
  buildReviewSavePayload,
  collapseBlocksToLegacyIfNoInlineImages,
  countTextCharsInBlocks,
  ensureEditorHasTextBlocks,
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

const legacyShortPhotos = {
  content: '짧은 본문',
  content_blocks: null,
  images: [{ url: 'https://cdn.example/a.jpg' }, { url: 'https://cdn.example/b.jpg' }],
};
assert.equal(shouldShowReviewExpandToggle(legacyShortPhotos), true);
assert.equal(shouldShowReviewBottomGallery(legacyShortPhotos, false), false);
assert.equal(shouldShowReviewBottomGallery(legacyShortPhotos, true), true);
assert.equal(getReviewLeadThumbnailImageIndex(legacyShortPhotos), 0);

const legacyLongPhotos = {
  content: 'x'.repeat(121),
  content_blocks: null,
  images: [{ url: 'https://cdn.example/a.jpg' }],
};
assert.equal(shouldShowReviewExpandToggle(legacyLongPhotos), true);
assert.equal(shouldShowReviewBottomGallery(legacyLongPhotos, false), false);

const blocksLead = {
  content: 'flat',
  content_blocks: [
    { type: 'text', text: 'intro' },
    { type: 'image', image_index: 2 },
  ],
  images: [{ url: 'a' }, { url: 'b' }, { url: 'c' }],
};
assert.equal(getReviewLeadThumbnailImageIndex(blocksLead), 2);

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

assert.equal(collapseBlocksToLegacyIfNoInlineImages(null).content, null);

const h1 = applyAttachmentRemoval(null, 'body text stays', 0);
assert.equal(h1.content, 'body text stays');
assert.equal(h1.contentBlocks, null);

const emptyInsert = insertImageAtCursorInContent('', 0, 0);
assert.deepEqual(
  emptyInsert.map((b) => b.type),
  ['text', 'image', 'text']
);
assert.ok(emptyInsert.every((b) => b.type !== 'text' || typeof b.text === 'string'));

const withImg = [
  { type: 'text', text: 'head' },
  { type: 'image', image_index: 0 },
  { type: 'text', text: 'tail' },
];
const afterAi = applyAiTextToContentBlocks(withImg, 'alpha\n\nbeta');
assert.deepEqual(
  afterAi.filter((b) => b.type === 'image').map((b) => b.image_index),
  [0]
);
assert.equal(
  afterAi
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('|'),
  'alpha|beta'
);

const mapChips = {
  type: 'links',
  items: [
    {
      label: '마하나콘 스카이워크 지도',
      url: 'https://www.google.com/maps/search/?api=1&query=King+Power+Mahanakhon+SkyWalk+Bangkok',
      kind: 'map',
    },
    {
      label: 'Asiatique The Riverfront 지도',
      url: 'https://www.google.com/maps/search/?api=1&query=Asiatique+The+Riverfront+Bangkok',
      kind: 'map',
    },
  ],
};
const longLabel = 'Octave Rooftop Lounge & Bar 지도';
assert.equal(longLabel.length, 30);
const withLong = normalizeReviewContentBlocks([
  { type: 'text', text: '본문' },
  {
    type: 'links',
    items: [
      ...mapChips.items,
      { label: longLabel, url: 'https://www.google.com/maps/search/?api=1&query=Octave', kind: 'map' },
      { label: 'bad http', url: 'http://evil.com', kind: 'official' },
      { label: 'bad js', url: 'javascript:alert(1)', kind: 'official' },
      { label: 'phone', url: 'tel:+66-2-123-4567', kind: 'phone' },
    ],
  },
]);
const linksBlock = withLong.find((block) => block.type === 'links');
assert.ok(linksBlock);
assert.equal(linksBlock.items.some((item) => item.label === longLabel), true);
assert.equal(linksBlock.items.some((item) => item.url.startsWith('http:')), false);
assert.equal(linksBlock.items.some((item) => item.url.includes('javascript')), false);
assert.equal(linksBlock.items.find((item) => item.kind === 'phone').url, 'tel:+6621234567');
assert.equal(getCollapsedPreviewText({ content_blocks: withLong }), '본문');
assert.equal(reviewHasHiddenMediaWhenCollapsed({ content_blocks: withLong, images: [] }), true);
assert.equal(
  shouldShowReviewExpandToggle({
    is_editorial: true,
    content_blocks: [{ type: 'text', text: '짧은 본문' }, mapChips],
    images: [],
  }),
  true,
);

const dedupedBlocks = normalizeReviewContentBlocks([
  {
    type: 'text',
    text: '**미즈노**([공식 사이트](https://www.mizuno-osaka.com/))',
  },
  {
    type: 'links',
    items: [
      { label: '공식', url: 'https://www.mizuno-osaka.com/', kind: 'official' },
      mapChips.items[0],
    ],
  },
]);
const kept = dedupeReviewLinkItems(
  dedupedBlocks.find((block) => block.type === 'links').items,
  reviewBodyLinkUrlKeys(dedupedBlocks),
);
assert.deepEqual(kept.map((item) => item.label), ['마하나콘 스카이워크 지도']);
assert.equal(
  reviewLinkUrlKey('https://www.Mizuno-osaka.com'),
  reviewLinkUrlKey('https://www.mizuno-osaka.com/'),
);

assert.equal(
  normalizeReviewContentBlocks([{ type: 'links', items: [{ label: 'x', url: 'http://nope', kind: 'map' }] }]).length,
  0,
);

const nine = Array.from({ length: 9 }, (_, index) => ({
  label: `지도 ${index}`,
  url: `https://www.google.com/maps/search/?api=1&query=${index}`,
  kind: 'map',
}));
assert.equal(
  normalizeReviewContentBlocks([{ type: 'links', items: nine }])[0].items.length,
  8,
);

console.log('smoke-place-review-content-blocks: OK');

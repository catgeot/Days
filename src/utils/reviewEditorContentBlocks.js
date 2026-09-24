import {
  getCollapsedPreviewText,
  getReferencedImageIndices,
  hasReviewContentBlocks,
  normalizeReviewContentBlocks,
} from './placeReviewContentBlocks.js';

/**
 * @param {unknown} review
 * @returns {Array<{ type: 'text', text: string } | { type: 'image', image_index: number }> | null}
 */
export function initEditorBlocksFromReview(review) {
  if (hasReviewContentBlocks(review?.content_blocks)) {
    return normalizeReviewContentBlocks(review.content_blocks);
  }
  return null;
}

/**
 * @param {Array<{ type: string }> | null | undefined} blocks
 * @returns {number}
 */
export function countTextCharsInBlocks(blocks) {
  if (!blocks) return 0;
  return normalizeReviewContentBlocks(blocks)
    .filter((b) => b.type === 'text')
    .reduce((sum, b) => sum + b.text.length, 0);
}

/**
 * @param {string} content
 * @param {number} cursorPos
 * @param {number} imageIndex
 */
export function insertImageAtCursorInContent(content, cursorPos, imageIndex) {
  const safePos = Math.max(0, Math.min(cursorPos, content.length));
  const before = content.slice(0, safePos);
  const after = content.slice(safePos);
  const blocks = [];
  if (before.length > 0) blocks.push({ type: 'text', text: before });
  blocks.push({ type: 'image', image_index: imageIndex });
  if (after.length > 0) blocks.push({ type: 'text', text: after });
  return normalizeReviewContentBlocks(blocks);
}

/**
 * @param {Array<{ type: string, text?: string }>} blocks
 * @param {number} blockIndex
 * @param {number} cursorPos
 * @param {number} imageIndex
 */
export function insertImageInTextBlock(blocks, blockIndex, cursorPos, imageIndex) {
  if (!Array.isArray(blocks) || blockIndex < 0 || blockIndex >= blocks.length) {
    return blocks;
  }
  const block = blocks[blockIndex];
  if (block.type !== 'text' || typeof block.text !== 'string') {
    return blocks;
  }
  const safePos = Math.max(0, Math.min(cursorPos, block.text.length));
  const before = block.text.slice(0, safePos);
  const after = block.text.slice(safePos);
  const newBlocks = [
    ...blocks.slice(0, blockIndex),
    ...(before.length > 0 ? [{ type: 'text', text: before }] : []),
    { type: 'image', image_index: imageIndex },
    ...(after.length > 0 ? [{ type: 'text', text: after }] : []),
    ...blocks.slice(blockIndex + 1),
  ];
  return normalizeReviewContentBlocks(newBlocks);
}

/**
 * @param {Array<{ type: string }> | null} blocks
 * @param {number} imageIndex
 */
export function removeInlineImageFromBlocks(blocks, imageIndex) {
  if (!blocks) return null;
  const filtered = blocks.filter(
    (b) => !(b.type === 'image' && b.image_index === imageIndex)
  );
  return normalizeReviewContentBlocks(filtered);
}

/**
 * When no image blocks remain, merge text back to legacy single-field editing.
 * @param {Array<{ type: string }> | null} blocks
 * @returns {{ contentBlocks: null, content: string } | { contentBlocks: Array, content: null }}
 */
export function collapseBlocksToLegacyIfNoInlineImages(blocks) {
  if (!blocks || blocks.length === 0) {
    return { contentBlocks: null, content: '' };
  }
  const normalized = normalizeReviewContentBlocks(blocks);
  if (getReferencedImageIndices(normalized).size > 0) {
    return { contentBlocks: normalized, content: null };
  }
  const text = getCollapsedPreviewText({ content_blocks: normalized });
  return { contentBlocks: null, content: text };
}

/**
 * @param {Array<{ type: string }> | null} blocks
 * @param {number} removedIndex
 */
export function repairBlocksAfterImageRemoved(blocks, removedIndex) {
  if (!blocks) return null;
  const repaired = [];
  for (const block of blocks) {
    if (block.type === 'image') {
      const idx = block.image_index;
      if (idx === removedIndex) continue;
      repaired.push({
        type: 'image',
        image_index: idx > removedIndex ? idx - 1 : idx,
      });
    } else {
      repaired.push(block);
    }
  }
  const normalized = normalizeReviewContentBlocks(repaired);
  if (normalized.length === 0) return null;
  return normalized;
}

/**
 * Swap two image indices in blocks when attachment order changes.
 * @param {Array<{ type: string }> | null} blocks
 * @param {number} indexA
 * @param {number} indexB
 */
export function repairBlocksAfterImageIndexSwap(blocks, indexA, indexB) {
  if (!blocks || indexA === indexB) return blocks;
  return blocks.map((block) => {
    if (block.type !== 'image') return block;
    let idx = block.image_index;
    if (idx === indexA) idx = indexB;
    else if (idx === indexB) idx = indexA;
    return { type: 'image', image_index: idx };
  });
}

/**
 * @param {Array<{ type: string }> | null} blocks
 * @param {number} imageIndex
 */
export function isImageReferencedInBlocks(blocks, imageIndex) {
  if (!blocks) return false;
  return getReferencedImageIndices(blocks).has(imageIndex);
}

/**
 * @param {{
 *   place_name: string,
 *   content: string,
 *   contentBlocks: Array | null,
 *   images: unknown[],
 *   rating: number,
 *   is_public: boolean,
 * }} params
 */
export function buildReviewSavePayload({
  place_name,
  content,
  contentBlocks,
  images,
  rating,
  is_public,
}) {
  const base = {
    place_name,
    images,
    rating,
    is_public,
  };

  const hasInline =
    contentBlocks &&
    getReferencedImageIndices(contentBlocks).size > 0;

  if (!hasInline) {
    return {
      ...base,
      content: (content || '').trim(),
      content_blocks: null,
    };
  }

  const normalized = normalizeReviewContentBlocks(contentBlocks);
  return {
    ...base,
    content: getCollapsedPreviewText({ content_blocks: normalized }),
    content_blocks: normalized,
  };
}

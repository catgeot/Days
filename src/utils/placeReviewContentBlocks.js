/**
 * @typedef {{ type: 'text', text: string }} TextBlock
 * @typedef {{ type: 'image', image_index: number }} ImageBlock
 */

function parseImageIndex(block) {
  if (!block || block.type !== 'image') return null;
  const raw = block.image_index ?? block.image_id;
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) return null;
  return raw;
}

/**
 * @param {unknown} blocks
 * @returns {boolean}
 */
export function hasReviewContentBlocks(blocks) {
  return Array.isArray(blocks) && blocks.length > 0;
}

/**
 * @param {unknown} blocks
 * @returns {Array<TextBlock|ImageBlock>}
 */
export function normalizeReviewContentBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];

  const normalized = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'text') {
      const text = typeof block.text === 'string' ? block.text : '';
      if (text.length > 0) {
        normalized.push({ type: 'text', text });
      }
      continue;
    }
    if (block.type === 'image') {
      const imageIndex = parseImageIndex(block);
      if (imageIndex !== null) {
        normalized.push({ type: 'image', image_index: imageIndex });
      }
    }
  }
  return normalized;
}

/**
 * @param {unknown} blocks
 * @returns {Set<number>}
 */
export function getReferencedImageIndices(blocks) {
  const indices = new Set();
  for (const block of normalizeReviewContentBlocks(blocks)) {
    if (block.type === 'image') {
      indices.add(block.image_index);
    }
  }
  return indices;
}

/**
 * @param {Array<unknown>|null|undefined} images
 * @param {unknown} blocks
 * @returns {Array<{ img: unknown, index: number }>}
 */
export function getGalleryImageEntries(images, blocks) {
  if (!Array.isArray(images) || images.length === 0) return [];

  const referenced = getReferencedImageIndices(blocks);
  const entries = [];
  images.forEach((img, index) => {
    if (referenced.has(index)) return;
    entries.push({ img, index });
  });
  return entries;
}

/**
 * @param {{ content?: string, content_blocks?: unknown }} review
 * @returns {string}
 */
export function getCollapsedPreviewText(review) {
  if (hasReviewContentBlocks(review?.content_blocks)) {
    return normalizeReviewContentBlocks(review.content_blocks)
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n');
  }
  return typeof review?.content === 'string' ? review.content : '';
}

/**
 * @param {{ content?: string, content_blocks?: unknown }} review
 * @returns {boolean}
 */
export function reviewHasHiddenMediaWhenCollapsed(review) {
  if (!hasReviewContentBlocks(review?.content_blocks)) return false;

  const blocks = normalizeReviewContentBlocks(review.content_blocks);
  if (blocks.some((b) => b.type === 'image')) return true;

  const gallery = getGalleryImageEntries(review.images, review.content_blocks);
  return gallery.length > 0;
}

export function resolveReviewImageSrc(img) {
  const src = img?.url || img?.publicUrl || img;
  return typeof src === 'string' && src.trim() ? src : null;
}

/**
 * @param {unknown} img
 * @param {{ width?: number, height?: number }} [opts]
 */
export function resolveReviewThumbnailSrc(img, opts = {}) {
  const src = resolveReviewImageSrc(img);
  if (!src) return null;
  const width = opts.width ?? 120;
  const height = opts.height ?? 120;
  if (!src.includes('images.unsplash.com')) return src;
  try {
    const parsed = new URL(src);
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('h', String(height));
    parsed.searchParams.set('fit', 'crop');
    if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', '80');
    if (!parsed.searchParams.has('auto')) parsed.searchParams.set('auto', 'format');
    return parsed.toString();
  } catch {
    return src;
  }
}

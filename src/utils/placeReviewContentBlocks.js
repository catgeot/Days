/**
 * @typedef {{ type: 'text', text: string }} TextBlock
 * @typedef {{ type: 'image', image_index: number }} ImageBlock
 */

import { stripReviewInlineMarkdown } from './reviewInlineMarkdown.js';

const REVIEW_LINK_KINDS = new Set([
  'booking',
  'menu',
  'official',
  'sns',
  'map',
  'phone',
  'gateo',
]);
const REVIEW_LINK_ITEM_LIMIT = 8;

function normalizeChipUrl(url) {
  const trimmed = String(url ?? '').trim();
  if (trimmed.startsWith('https://')) return trimmed;
  const tel = trimmed.replace(/[\s-]/g, '');
  if (/^tel:\+[0-9]{6,15}$/.test(tel)) return tel;
  return '';
}

function normalizeLinksBlock(block) {
  const items = Array.isArray(block?.items) ? block.items : [];
  const normalized = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const url = normalizeChipUrl(item.url);
    if (!label || !url || !REVIEW_LINK_KINDS.has(item.kind)) continue;
    normalized.push({ label, url, kind: item.kind });
    if (normalized.length >= REVIEW_LINK_ITEM_LIMIT) break;
  }
  if (normalized.length === 0) return null;
  return { type: 'links', items: normalized };
}

/**
 * Scheme and host are lowercased. One trailing slash is ignored.
 * @param {unknown} url
 */
export function reviewLinkUrlKey(url) {
  const raw = String(url ?? '').trim();
  if (/^tel:/i.test(raw)) return raw.replace(/[\s-]/g, '').toLowerCase();
  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.replace(/\/$/, '');
    return `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return raw.toLowerCase();
  }
}

/**
 * @param {Array<{ type?: string, text?: string }>} blocks
 */
export function reviewBodyLinkUrlKeys(blocks) {
  const keys = new Set();
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const block of blocks || []) {
    if (block?.type !== 'text' || typeof block.text !== 'string') continue;
    re.lastIndex = 0;
    let match = re.exec(block.text);
    while (match) {
      const key = reviewLinkUrlKey(match[1]);
      if (key) keys.add(key);
      match = re.exec(block.text);
    }
  }
  return keys;
}

/**
 * @param {Array<{ url: string }>} items
 * @param {Set<string>} bodyKeys
 */
export function dedupeReviewLinkItems(items, bodyKeys) {
  return (items || []).filter((item) => !bodyKeys.has(reviewLinkUrlKey(item.url)));
}

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
      continue;
    }
    if (block.type === 'links') {
      const links = normalizeLinksBlock(block);
      if (links) normalized.push(links);
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
  if (blocks.some((b) => b.type === 'image' || b.type === 'links')) return true;

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

/**
 * First image index shown when the review card is expanded (inline block, else legacy gallery order).
 * @param {{ images?: unknown[], content_blocks?: unknown }} review
 * @returns {number|null}
 */
export function getReviewLeadThumbnailImageIndex(review) {
  const images = review?.images;
  if (!Array.isArray(images) || images.length === 0) return null;

  if (hasReviewContentBlocks(review.content_blocks)) {
    for (const block of normalizeReviewContentBlocks(review.content_blocks)) {
      if (block.type === 'image' && block.image_index < images.length) {
        if (resolveReviewImageSrc(images[block.image_index])) {
          return block.image_index;
        }
      }
    }
    const gallery = getGalleryImageEntries(images, review.content_blocks);
    if (gallery.length > 0 && resolveReviewImageSrc(gallery[0].img)) {
      return gallery[0].index;
    }
    return null;
  }

  return resolveReviewImageSrc(images[0]) ? 0 : null;
}

/**
 * @param {{ content?: string, content_blocks?: unknown, images?: unknown[], is_editorial?: boolean }} review
 */
export function shouldShowReviewExpandToggle(review) {
  const imageCount = Array.isArray(review?.images) ? review.images.length : 0;
  const preview = hasReviewContentBlocks(review?.content_blocks)
    ? getCollapsedPreviewText(review)
    : (review?.content || '');
  const measured = review?.is_editorial === true
    ? stripReviewInlineMarkdown(preview).length
    : preview.length;
  if (hasReviewContentBlocks(review?.content_blocks)) {
    return measured > 120 || reviewHasHiddenMediaWhenCollapsed(review);
  }
  return measured > 120 || imageCount >= 1;
}

/**
 * Legacy bottom strip + gallery-only images (never while collapsed).
 * @param {{ content_blocks?: unknown, images?: unknown[] }} review
 * @param {boolean} isExpanded
 */
export function shouldShowReviewBottomGallery(review, isExpanded) {
  if (!isExpanded) return false;
  const images = review?.images;
  if (!Array.isArray(images) || images.length === 0) return false;

  if (hasReviewContentBlocks(review.content_blocks)) {
    return getGalleryImageEntries(images, review.content_blocks).length > 0;
  }
  return images.some((img) => resolveReviewImageSrc(img));
}

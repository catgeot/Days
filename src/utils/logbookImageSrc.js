import { resolveReviewImageSrc } from './placeReviewContentBlocks.js';

export function resolveLogbookImageSrc(img) {
  return resolveReviewImageSrc(img);
}

const UNSPLASH_HOST = 'images.unsplash.com';

function isUnsplashSrc(src) {
  return typeof src === 'string' && src.includes(UNSPLASH_HOST);
}

/**
 * @param {string} src
 * @param {{ width: number, fit?: string, quality?: number, forceWidth?: boolean }} opts
 */
function withUnsplashSizing(src, { width, fit = 'crop', quality = 80, forceWidth = false }) {
  if (!isUnsplashSrc(src)) return src;
  try {
    const parsed = new URL(src);
    const hasWidth = parsed.searchParams.has('w');

    if (!forceWidth && hasWidth) {
      if (!parsed.searchParams.has('auto')) parsed.searchParams.set('auto', 'format');
      if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    }

    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', fit);
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('q', String(quality));
    return parsed.toString();
  } catch {
    return src;
  }
}

/** In-page body / gallery: cap Unsplash at w=1200 when `w` is absent. */
export function resolveLogbookDisplaySrc(img, opts = {}) {
  const src = resolveLogbookImageSrc(img);
  if (!src) return null;

  if (opts.role === 'thumb') {
    return withUnsplashSizing(src, { width: 400, fit: 'crop', quality: 80, forceWidth: true });
  }

  const width = opts.maxWidth ?? 1200;
  return withUnsplashSizing(src, {
    width,
    fit: 'crop',
    quality: opts.quality ?? 80,
    forceWidth: Boolean(opts.forceWidth),
  });
}

export function logbookHeroImageUrl(images, opts = {}) {
  if (!Array.isArray(images) || images.length === 0) return null;
  if (opts.thumbnail || opts.role === 'thumb') {
    return resolveLogbookDisplaySrc(images[0], { role: 'thumb' });
  }
  return resolveLogbookDisplaySrc(images[0], { maxWidth: 1200 });
}

export function logbookImageUrlList(images, opts = {}) {
  if (!Array.isArray(images)) return [];
  const maxWidth = opts.maxWidth ?? 1200;
  return images
    .map((img) => resolveLogbookDisplaySrc(img, { maxWidth }))
    .filter(Boolean);
}

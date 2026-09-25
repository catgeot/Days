import { resolveReviewImageSrc } from './placeReviewContentBlocks.js';

export function resolveLogbookImageSrc(img) {
  return resolveReviewImageSrc(img);
}

function withUnsplashDisplayParams(src, { maxWidth = 960, quality = 80 } = {}) {
  if (!src.includes('images.unsplash.com')) return src;
  try {
    const parsed = new URL(src);
    parsed.searchParams.set('w', String(maxWidth));
    parsed.searchParams.set('fit', 'max');
    if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', String(quality));
    if (!parsed.searchParams.has('auto')) parsed.searchParams.set('auto', 'format');
    return parsed.toString();
  } catch {
    return src;
  }
}

/** Sized URL for in-page logbook images (reduces mobile Safari memory pressure). */
export function resolveLogbookDisplaySrc(img, opts = {}) {
  const src = resolveLogbookImageSrc(img);
  if (!src) return null;
  const maxWidth = opts.maxWidth ?? 960;
  return withUnsplashDisplayParams(src, { maxWidth, quality: opts.quality ?? 80 });
}

export function logbookHeroImageUrl(images, opts = {}) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const maxWidth = opts.thumbnail ? 640 : 960;
  return resolveLogbookDisplaySrc(images[0], { maxWidth });
}

export function logbookImageUrlList(images, opts = {}) {
  if (!Array.isArray(images)) return [];
  const maxWidth = opts.maxWidth ?? 960;
  return images
    .map((img) => resolveLogbookDisplaySrc(img, { maxWidth }))
    .filter(Boolean);
}

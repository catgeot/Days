import { resolveReviewImageSrc } from './placeReviewContentBlocks.js';

export function resolveLogbookImageSrc(img) {
  return resolveReviewImageSrc(img);
}

export function logbookHeroImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return resolveLogbookImageSrc(images[0]);
}

export function logbookImageUrlList(images) {
  if (!Array.isArray(images)) return [];
  return images.map((img) => resolveLogbookImageSrc(img)).filter(Boolean);
}

import {
  getGalleryImageEntries,
  resolveReviewImageSrc,
} from '../utils/placeReviewContentBlocks.js';
import { optimizeLogbookReviewCardThumbUrl } from './logbookReviewCardThumbUrl.js';

function editorialReviewHubThumbCandidates(review) {
  const images = review?.images;
  if (!Array.isArray(images) || images.length === 0) return [];
  const candidates = [...images];
  for (const { img } of getGalleryImageEntries(images, review?.content_blocks)) {
    if (!candidates.includes(img)) candidates.push(img);
  }
  return candidates;
}

/** Same image pick rule as LogBook review hub cards (Wikimedia 960px thumb when applicable). */
export function pickEditorialReviewHubThumb(review) {
  for (const img of editorialReviewHubThumbCandidates(review)) {
    const raw = resolveReviewImageSrc(img);
    if (!raw) continue;
    const optimized = optimizeLogbookReviewCardThumbUrl(raw);
    if (optimized.src) return optimized;
  }
  return null;
}

/** @returns {{ thumb: ReturnType<typeof optimizeLogbookReviewCardThumbUrl>, img: unknown } | null} */
export function pickEditorialReviewHubThumbPair(review) {
  for (const img of editorialReviewHubThumbCandidates(review)) {
    const raw = resolveReviewImageSrc(img);
    if (!raw) continue;
    const optimized = optimizeLogbookReviewCardThumbUrl(raw);
    if (optimized.src) return { thumb: optimized, img };
  }
  return null;
}
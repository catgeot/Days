import { resolveGalleryPhotoNoteText } from '../components/PlaceCard/common/galleryPhotoNote.js';

/**
 * Human-authored editorial review photo note (DB `caption`, `photo_note`, etc.).
 * Stock provider auto alt is never surfaced as a note (#848 parity).
 */
export function resolveEditorialReviewPhotoNoteText(image) {
  return resolveGalleryPhotoNoteText(image);
}
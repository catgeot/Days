import { getGalleryImageSource } from './galleryImageAttribution';

const MANUAL_IMAGE_SOURCES = new Set(['korea-scenic-ssot', 'local-scenic-official', 'wikimedia']);

const STOCK_NOTE_SOURCES = new Set(['unsplash', 'pexels', 'unknown']);

function capitalizeNote(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Accessible alt for <img> — includes provider auto captions.
 */
export function resolveGalleryImageAltText(image) {
  if (!image) return '';
  const raw = String(
    image.alt_description || image.description || image.alt || image.tourApi?.title || '',
  ).trim();
  return capitalizeNote(raw);
}

/**
 * Human-authored lightbox note only (SSOT, Wikimedia, TourAPI/CMS, catalog fields).
 */
export function resolveGalleryPhotoNoteText(image) {
  if (!image || typeof image !== 'object') return '';

  const catalogNote = String(
    image.photo_note || image.photoNote || image.catalogCaption || image.caption || '',
  ).trim();
  if (catalogNote) return capitalizeNote(catalogNote);

  const declaredSource = String(image.source || '').trim();
  if (MANUAL_IMAGE_SOURCES.has(declaredSource)) {
    return capitalizeNote(image.alt_description || image.description || image.alt);
  }

  const provider = getGalleryImageSource(image);
  if (provider === 'tourapi') {
    return capitalizeNote(image.tourApi?.title || image.alt_description || image.description);
  }
  if (provider === 'wikimedia') {
    return capitalizeNote(image.alt_description || image.description || image.alt);
  }
  if (STOCK_NOTE_SOURCES.has(provider)) {
    return '';
  }

  return '';
}
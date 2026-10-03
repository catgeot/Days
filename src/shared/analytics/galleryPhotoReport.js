import { trackEvent } from './trackEvent.js';

export function trackGalleryPhotoReport({ placeId, imageId, source } = {}) {
  if (!placeId || !imageId) return;
  trackEvent('gallery_photo_report', {
    place_id: String(placeId),
    image_id: String(imageId),
    ...(source ? { source: String(source) } : {}),
  });
}

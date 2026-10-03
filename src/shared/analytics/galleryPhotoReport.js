export function trackGalleryPhotoReport({ placeId, imageId, source } = {}) {
  if (!placeId || !imageId) {
    return { sent: false, reason: 'missing_ids' };
  }
  const params = {
    place_id: String(placeId),
    image_id: String(imageId),
    ...(source ? { source: String(source) } : {}),
  };
  try {
    if (typeof window === 'undefined') return { sent: false, reason: 'no_window' };
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return { sent: false, reason: 'no_gtag', params };
    gtag('event', 'gallery_photo_report', params);
    return { sent: true, params };
  } catch {
    return { sent: false, reason: 'gtag_error', params };
  }
}

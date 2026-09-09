const LIST_PHOTO_CACHE_KEY = 'gateo-world-event-list-photo-v1';

/**
 * @param {{ url?: string, source?: string } | null | undefined} image
 */
export function isUnsplashListPhoto(image) {
  if (!image) return false;
  if (String(image.source || '').toLowerCase() === 'unsplash') return true;
  const url = String(image.url || '').toLowerCase();
  return url.includes('images.unsplash.com');
}

/**
 * List cards use Unsplash only — Wikimedia seeds stay on the detail page.
 * @param {Array<{ url?: string, source?: string, captionKo?: string, captionEn?: string, photographer?: string }>} images
 * @returns {{ url: string, source: 'unsplash', captionKo?: string, captionEn?: string, photographer?: string } | null}
 */
export function pickWorldEventListPhoto(images) {
  if (!Array.isArray(images)) return null;

  for (const image of images) {
    const url = String(image?.url || '').trim();
    if (!url.startsWith('http')) continue;
    if (!isUnsplashListPhoto(image)) continue;
    return {
      url,
      source: 'unsplash',
      captionKo: image.captionKo,
      captionEn: image.captionEn,
      photographer: image.photographer,
    };
  }

  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} photo
 */
export function mapUnsplashPhotoToListImage(photo) {
  if (!photo || typeof photo !== 'object') return null;
  const urls = photo.urls && typeof photo.urls === 'object' ? photo.urls : {};
  const url = String(urls.regular || urls.small || '').trim();
  if (!url.startsWith('http')) return null;
  const caption = String(photo.alt_description || photo.description || '').trim();
  const photographer = String(photo.user?.name || '').trim();
  return {
    url,
    source: 'unsplash',
    captionKo: caption,
    captionEn: caption,
    photographer: photographer || undefined,
  };
}

/**
 * @returns {Record<string, { url: string, source: string, photographer?: string }>}
 */
export function readWorldEventListPhotoCache() {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(sessionStorage.getItem(LIST_PHOTO_CACHE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, { url: string, source: string, photographer?: string }>} photosById
 */
export function writeWorldEventListPhotoCache(photosById) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(LIST_PHOTO_CACHE_KEY, JSON.stringify(photosById || {}));
  } catch {
    // quota / private mode
  }
}

/**
 * @param {string} eventId
 */
export function removeWorldEventListPhotoCacheEntry(eventId) {
  const id = String(eventId || '').trim();
  if (!id) return;
  const cache = readWorldEventListPhotoCache();
  if (!cache[id]) return;
  const next = { ...cache };
  delete next[id];
  writeWorldEventListPhotoCache(next);
}

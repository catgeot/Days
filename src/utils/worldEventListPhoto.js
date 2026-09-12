const LIST_PHOTO_CACHE_KEY = 'gateo-world-event-list-photo-v3-color';

const BLACK_AND_WHITE_CAPTION =
  /\b(black and white|black-and-white|b&w|b\/w|monochrome|grayscale|greyscale)\b/i;

/**
 * HSL saturation of Unsplash `color` hex. Gray average ≈ 0.
 * @param {string | null | undefined} hex
 * @returns {number | null}
 */
export function unsplashColorSaturation(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;
  const lightness = (max + min) / 2;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

/**
 * @param {{ captionKo?: string, captionEn?: string } | null | undefined} image
 */
export function isCaptionBlackAndWhite(image) {
  const text = `${image?.captionEn || ''} ${image?.captionKo || ''}`;
  return BLACK_AND_WHITE_CAPTION.test(text);
}

/**
 * Unsplash average color is a perfect gray (common for B&W / vintage scans).
 * @param {string | null | undefined} hex
 */
export function isLikelyGrayscaleColor(hex) {
  const saturation = unsplashColorSaturation(hex);
  return saturation != null && saturation < 0.12;
}

/**
 * @param {{ captionKo?: string, captionEn?: string, color?: string } | null | undefined} image
 */
export function isBlackAndWhitePhoto(image) {
  if (!image) return false;
  if (isCaptionBlackAndWhite(image)) return true;
  return isLikelyGrayscaleColor(image.color);
}

/**
 * List thumbs need a known colorful Unsplash swatch. Missing color = old cache, skip.
 * @param {{ url?: string, captionKo?: string, captionEn?: string, color?: string } | null | undefined} image
 */
export function isUsableColorListPhoto(image) {
  if (!image || !String(image.url || '').startsWith('http')) return false;
  if (isCaptionBlackAndWhite(image)) return false;
  if (!image.color) return false;
  if (isLikelyGrayscaleColor(image.color)) return false;
  return true;
}

/**
 * Prefer photos whose Unsplash average color is not gray. Night color shots with a gray
 * average stay available when every hit is gray — except caption-labelled B&W.
 * @param {Array<{ color?: string, captionKo?: string, captionEn?: string }>} images
 */
export function preferColorListPhotos(images) {
  const list = Array.isArray(images) ? images : [];
  const notCaptionBw = list.filter((image) => !isCaptionBlackAndWhite(image));
  const pool = notCaptionBw.length ? notCaptionBw : list;
  const colorful = pool.filter((image) => !isLikelyGrayscaleColor(image.color));
  return colorful.length ? colorful : pool;
}

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
 * @param {Array<{ url?: string, source?: string, captionKo?: string, captionEn?: string, photographer?: string, color?: string }>} images
 * @returns {{ url: string, source: 'unsplash', captionKo?: string, captionEn?: string, photographer?: string, color?: string } | null}
 */
export function pickWorldEventListPhoto(images) {
  if (!Array.isArray(images)) return null;

  for (const image of images) {
    const url = String(image?.url || '').trim();
    if (!url.startsWith('http')) continue;
    if (!isUnsplashListPhoto(image)) continue;
    const item = {
      url,
      source: 'unsplash',
      captionKo: image.captionKo,
      captionEn: image.captionEn,
      photographer: image.photographer,
      color: image.color,
    };
    if (isUsableColorListPhoto(item)) return item;
  }

  return null;
}

/**
 * @param {{ captionKo?: string, captionEn?: string } | null | undefined} image
 * @param {string[]} keywords
 */
export function scoreListPhotoRelevance(image, keywords) {
  if (!image || !Array.isArray(keywords) || keywords.length === 0) return 0;
  const text = `${image.captionEn || ''} ${image.captionKo || ''}`.toLowerCase();
  if (!text.trim()) return 0;
  let score = 0;
  for (const keyword of keywords) {
    if (keyword && text.includes(String(keyword).toLowerCase())) score += 1;
  }
  return score;
}

/**
 * Prefer a caption that mentions the event; otherwise keep Unsplash relevance order.
 * @param {Array<Record<string, unknown>>} photos
 * @param {string[]} [keywords]
 */
export function pickMappedUnsplashListPhoto(photos, keywords = []) {
  const mapped = Array.isArray(photos)
    ? photos.map(mapUnsplashPhotoToListImage).filter(Boolean)
    : [];
  if (!mapped.length) return null;
  const pool = preferColorListPhotos(mapped);
  if (!pool.length) return null;
  if (!keywords.length) return pool[0];

  let best = pool[0];
  let bestScore = scoreListPhotoRelevance(best, keywords);
  for (const image of pool.slice(1)) {
    const score = scoreListPhotoRelevance(image, keywords);
    if (score > bestScore) {
      best = image;
      bestScore = score;
    }
  }
  return best;
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
  const color = String(photo.color || '').trim();
  return {
    url,
    source: 'unsplash',
    captionKo: caption,
    captionEn: caption,
    photographer: photographer || undefined,
    color: color || undefined,
  };
}

/**
 * @returns {Record<string, { url: string, source: string, photographer?: string, color?: string }>}
 */
export function readWorldEventListPhotoCache() {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(sessionStorage.getItem(LIST_PHOTO_CACHE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const next = {};
    for (const [eventId, photo] of Object.entries(parsed)) {
      if (!photo?.url || !String(photo.url).startsWith('http')) continue;
      if (isCaptionBlackAndWhite(photo)) continue;
      next[eventId] = photo;
    }
    return next;
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, { url: string, source: string, photographer?: string, color?: string }>} photosById
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

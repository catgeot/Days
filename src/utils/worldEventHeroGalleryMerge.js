import { isHangulPhotoQuery } from './worldEventMedia.js';
import { isBlackAndWhitePhoto } from './worldEventListPhoto.js';

const REJECTED_GALLERY_CAPTION =
  /\b(pdf|svg|djvu|manuscript|document|letterhead|commission to|coat of arms|flag of|map of|logo of|scan of|libretto|title page|stamp of)\b/i;

const ATMOSPHERE_POS =
  /\b(festival|parade|carnival|crowd|celebration|lantern|firework|concert|performance|audience|orchestra|stage|auditorium|theater|theatre|tent|beer|costume|dancer|illuminat|sakura|blossom|marathon|running|runner|yoga|fitness|fairground|ferris|carousel|samba|mask|ballet|chandelier|float|interior|group exercise|cycling|peloton)\b/i;
const ATMOSPHERE_NEG =
  /\b(skyline|cityscape|facade|aerial view|camel|traffic|office tower|empty street|concrete building|stamp of|libretto|title page)\b/i;
const REJECTED_GALLERY_FILE = /\.(pdf|svg|tif|tiff|djvu)$/i;

/**
 * Wikimedia/Unsplash filler often includes scans, documents, or near-identical crops.
 * @param {{ url?: string, captionKo?: string, captionEn?: string } | null | undefined} image
 */
export function isRejectedGalleryFillerImage(image) {
  const url = String(image?.url || '').trim().toLowerCase();
  const caption = `${image?.captionEn || ''} ${image?.captionKo || ''}`.trim();
  if (REJECTED_GALLERY_FILE.test(url) || REJECTED_GALLERY_FILE.test(caption)) return true;
  if (REJECTED_GALLERY_CAPTION.test(caption)) return true;
  return false;
}

/**
 * Collapse same-file crops (…20120906a / _93 / (1)) so consecutive thumbs are not the same shot.
 * @param {string} url
 */
export function galleryNearDupKey(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('unsplash.com')) {
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    }
    let file = decodeURIComponent(parsed.pathname.split('/').pop() || '');
    file = file.replace(/^\d+px-/i, '').replace(/\.[a-z0-9]+$/i, '');
    file = file.replace(/(\d)[a-z]$/i, '$1');
    file = file.replace(/[_-][a-z]$/i, '');
    file = file.replace(/[_-]\d{1,3}$/i, '');
    file = file.replace(/[_-]\(\d+\)$/i, '');
    return `${parsed.hostname}/${file}`.toLowerCase();
  } catch {
    return String(url || '').toLowerCase();
  }
}

export function isUnsplashGalleryImage(image) {
  if (!image) return false;
  if (String(image.source || '').toLowerCase() === 'unsplash') return true;
  const url = String(image.url || '').toLowerCase();
  return url.includes('images.unsplash.com');
}

/**
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} seed
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} fetched
 */
export function mergeWorldEventHeroGalleryImages(seed, fetched) {
  const seen = new Set();
  const nearSeen = new Set();
  const unsplash = [];
  const others = [];

  const push = (image, { allowRejected = false, nearDup = false } = {}) => {
    const url = String(image?.url || '').trim();
    if (!url.startsWith('http')) return;
    const key = imageDedupeKey(url);
    if (seen.has(key)) return;
    if (!allowRejected && isRejectedGalleryFillerImage(image)) return;
    const nearKey = galleryNearDupKey(url);
    if (nearDup && nearSeen.has(nearKey)) return;
    seen.add(key);
    nearSeen.add(nearKey);
    const item = {
      url,
      captionKo: image.captionKo,
      captionEn: image.captionEn,
      source: image.source || (isUnsplashGalleryImage(image) ? 'unsplash' : undefined),
      color: image.color,
    };
    if (isUnsplashGalleryImage(item)) {
      unsplash.push(item);
    } else {
      others.push(item);
    }
  };

  for (const image of Array.isArray(seed) ? seed : []) {
    push(image, { allowRejected: true, nearDup: false });
  }
  for (const image of Array.isArray(fetched) ? fetched : []) {
    push(image, { allowRejected: false, nearDup: true });
  }

  return rankWorldEventHeroGalleryImages([...unsplash, ...others]);
}

/**
 * Higher = more event/festival atmosphere. Used so building/skyline fillers sink.
 * @param {{ url?: string, captionKo?: string, captionEn?: string, source?: string } | null | undefined} image
 */
export function scoreHeroGalleryAtmosphere(image) {
  if (!image) return 0;
  const text = `${image.captionEn || ''} ${image.captionKo || ''} ${image.url || ''}`;
  let score = 0;
  if (isUnsplashGalleryImage(image)) score += 2;
  if (ATMOSPHERE_POS.test(text)) score += 6;
  if (ATMOSPHERE_NEG.test(text)) score -= 6;
  if (isBlackAndWhitePhoto(image)) score -= 8;
  return score;
}

/**
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} images
 */
export function rankWorldEventHeroGalleryImages(images) {
  if (!Array.isArray(images) || images.length < 2) return Array.isArray(images) ? images : [];
  return images
    .map((image, index) => ({ image, index, score: scoreHeroGalleryAtmosphere(image) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.image);
}

/**
 * Wiki-only city/building caches should be fetched again with atmosphere queries.
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} images
 */
export function galleryNeedsAtmosphereRefresh(images) {
  if (!Array.isArray(images) || images.length === 0) return true;
  let positive = 0;
  let negative = 0;
  for (const image of images) {
    const score = scoreHeroGalleryAtmosphere(image);
    if (score >= 6) positive += 1;
    if (score < 0) negative += 1;
  }
  return positive === 0 && negative >= 2;
}

/**
 * @param {string} url
 */
export function heroGalleryImageKey(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname
      .replace(/\/thumb\//, '/')
      .replace(/\/\d+px-[^/]+$/, '')
      .replace(/\/\d+x\d+\//, '/')
      .replace(/w=\d+/, 'w=0');
    return `${parsed.hostname}${path}`.toLowerCase();
  } catch {
    return String(url || '').toLowerCase();
  }
}

/**
 * @param {Array<{ url?: string }>} cachedImages
 * @param {Array<{ url?: string }>} seedImages
 */
export function heroGallerySeedCacheMatches(cachedImages, seedImages) {
  if (!Array.isArray(seedImages) || seedImages.length === 0) return true;
  if (!Array.isArray(cachedImages) || cachedImages.length < seedImages.length) return false;

  const cachedKeys = new Set(
    cachedImages
      .map((image) => heroGalleryImageKey(String(image?.url || '')))
      .filter(Boolean),
  );

  return seedImages.every((seed) => {
    const seedUrl = String(seed?.url || '').trim();
    if (!seedUrl) return false;
    return cachedKeys.has(heroGalleryImageKey(seedUrl));
  });
}

/**
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} seedImages
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} cachedImages
 * @param {number} [limit]
 */
export function buildHeroGalleryFromCache(seedImages, cachedImages, limit = 12) {
  return mergeWorldEventHeroGalleryImages(seedImages, cachedImages).slice(0, limit);
}

/**
 * @param {string} url
 */
function imageDedupeKey(url) {
  return heroGalleryImageKey(url);
}

const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

/**
 * @param {string} searchQuery
 * @param {number} [limit]
 */
export async function fetchWikimediaGalleryImages(searchQuery, limit = 10) {
  const q = String(searchQuery || '').trim();
  if (!q) return [];

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(Math.min(20, limit + 4)),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '1280',
  });

  const response = await fetch(`${WIKIMEDIA_API}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wikimedia API ${response.status}`);
  }

  const data = await response.json();
  const pages = data?.query?.pages;
  if (!pages || typeof pages !== 'object') return [];

  const images = [];
  for (const page of Object.values(pages)) {
    const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null;
    const url = String(info?.thumburl || info?.url || '').trim();
    if (!url.startsWith('http')) continue;
    const title = String(page.title || '').replace(/^File:/, '').replace(/_/g, ' ').trim();
    const candidate = {
      url,
      captionKo: title,
      captionEn: title,
      source: 'wikimedia',
    };
    if (isRejectedGalleryFillerImage(candidate)) continue;
    images.push(candidate);
    if (images.length >= limit) break;
  }

  return images;
}

/**
 * @param {string[]} queries
 * @param {number} [limit]
 */
export async function fetchWikimediaGalleryFromQueries(queries, limit = 10) {
  const fetched = [];
  for (const query of queries) {
    if (fetched.length >= limit) break;
    if (isHangulPhotoQuery(query)) continue;
    try {
      const batch = await fetchWikimediaGalleryImages(query, limit - fetched.length);
      fetched.push(...batch);
    } catch (err) {
      console.warn('[fetchWikimediaGalleryFromQueries]', query, err?.message || err);
    }
  }
  return fetched;
}

/**
 * @param {Array<Record<string, unknown>>} photos
 */
export function mapUnsplashPhotosToGalleryImages(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((photo) => {
      const urls = photo.urls && typeof photo.urls === 'object' ? photo.urls : {};
      const url = String(urls.regular || urls.small || '').trim();
      if (!url.startsWith('http')) return null;
      const caption = String(photo.alt_description || photo.description || '').trim();
      const color = String(photo.color || '').trim();
      return {
        url,
        captionKo: caption,
        captionEn: caption,
        source: 'unsplash',
        color: color || undefined,
      };
    })
    .filter(Boolean);
}

/**
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} seed
 * @param {Array<{ url?: string, captionKo?: string, captionEn?: string, source?: string }>} fetched
 */
export function mergeWorldEventHeroGalleryImages(seed, fetched) {
  const seen = new Set();
  const merged = [];

  for (const image of [...seed, ...fetched]) {
    const url = String(image?.url || '').trim();
    if (!url.startsWith('http')) continue;
    const key = imageDedupeKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      url,
      captionKo: image.captionKo,
      captionEn: image.captionEn,
      source: image.source,
    });
  }

  return merged;
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

  return seedImages.every((seed, index) => {
    const cachedUrl = String(cachedImages[index]?.url || '').trim();
    const seedUrl = String(seed?.url || '').trim();
    if (!cachedUrl || !seedUrl) return false;
    return heroGalleryImageKey(cachedUrl) === heroGalleryImageKey(seedUrl);
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
    gsrsearch: q,
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
    images.push({
      url,
      captionKo: title,
      captionEn: title,
      source: 'wikimedia',
    });
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
      return {
        url,
        captionKo: caption,
        captionEn: caption,
        source: 'unsplash',
      };
    })
    .filter(Boolean);
}

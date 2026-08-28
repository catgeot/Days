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
function imageDedupeKey(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/\d+x\d+\//, '/').replace(/w=\d+/, 'w=0');
    return `${parsed.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
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

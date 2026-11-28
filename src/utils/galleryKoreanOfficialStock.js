import {
  isOfficialGalleryImage,
  isStockGalleryImage,
  isTourApiGalleryImage,
} from '../shared/api/placeGalleryPersist.js';

/** Korean scenic / Tour galleries: skip Unsplash·Pexels fill when official count reaches this. */
export const KOREAN_SCENIC_GALLERY_OFFICIAL_STOCK_THRESHOLD = 8;

export function isGalleryWikimediaImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'wikimedia') return true;
  return String(img.id ?? '').startsWith('commons-');
}

export function isGalleryOfficialForStockPolicy(img) {
  return (
    isTourApiGalleryImage(img) ||
    isOfficialGalleryImage(img) ||
    isGalleryWikimediaImage(img)
  );
}

export function countGalleryOfficialImages(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  return list.filter(isGalleryOfficialForStockPolicy).length;
}

export function shouldSuppressKoreanScenicGalleryStock(images, allowTourApiGallery) {
  if (!allowTourApiGallery) return false;
  return (
    countGalleryOfficialImages(images) >= KOREAN_SCENIC_GALLERY_OFFICIAL_STOCK_THRESHOLD
  );
}

export function galleryImageDisplayUrl(img) {
  return String(img?.urls?.regular || img?.urls?.small || '').trim();
}

export function scenicSsotUrlIsSelfHosted(url) {
  const src = String(url || '').trim();
  return src.startsWith('/site/scenic/');
}

export function galleryCacheHasScenicSsotUrl(images, scenicUrls) {
  const urls = new Set(
    (Array.isArray(scenicUrls) ? scenicUrls : [])
      .map((u) => String(u || '').trim())
      .filter(Boolean),
  );
  if (!urls.size) return true;
  const list = Array.isArray(images) ? images : [];
  return list.some((img) => urls.has(galleryImageDisplayUrl(img)));
}

export function buildKoreaScenicSsotGalleryImage(url, opts = {}) {
  const src = String(url || '').trim();
  if (!src) return null;
  const {
    stablePlaceKey = 'place',
    idx = 0,
    koreanName = '',
    scenicSpot = null,
    idSuffix = '',
  } = opts;
  const credit = String(
    scenicSpot?.imageCredit || scenicSpot?.image_credit || '',
  ).trim();
  const isWikimedia = /wikimedia\.org|wikipedia\.org/i.test(src);
  const note = credit || (isWikimedia ? koreanName : '');
  const id = `korea-scenic-ssot-${stablePlaceKey}${idSuffix}-${idx}`;
  if (isWikimedia) {
    return {
      id: id.startsWith('commons-') ? id : `commons-${id}`,
      urls: { small: src, regular: src },
      alt_description: koreanName,
      source: 'wikimedia',
      photo_note: note || undefined,
      user: { name: credit || koreanName || 'Wikimedia Commons' },
      links: { html: src },
      sourceUrl: src,
    };
  }
  return {
    id,
    urls: { small: src, regular: src },
    alt_description: koreanName,
    source: 'korea-scenic-ssot',
    photo_note: credit || undefined,
  };
}

export function prependScenicSsotHeroes(existingImages, scenicUrls, opts = {}) {
  const base = Array.isArray(existingImages) ? existingImages.filter(Boolean) : [];
  const urls = Array.isArray(scenicUrls) ? scenicUrls : [];
  if (!urls.length) return base;
  const seen = new Set(
    base.map((img) => galleryImageDisplayUrl(img)).filter(Boolean),
  );
  const prepend = [];
  for (let idx = 0; idx < urls.length; idx += 1) {
    const url = String(urls[idx] || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const row = buildKoreaScenicSsotGalleryImage(url, { ...opts, idx });
    if (row) prepend.push(row);
  }
  if (!prepend.length) return base;
  return [...prepend, ...base];
}

export function partitionGalleryOfficialBeforeStock(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length < 2) return list;
  const official = [];
  const stock = [];
  const other = [];
  for (const img of list) {
    if (isStockGalleryImage(img)) stock.push(img);
    else if (isGalleryOfficialForStockPolicy(img)) official.push(img);
    else other.push(img);
  }
  if (!stock.length) return list;
  return [...official, ...other, ...stock];
}

export function stripGalleryStockImages(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  return list.filter((img) => !isStockGalleryImage(img));
}
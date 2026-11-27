import { filterOutSinglePersonPortraits } from './galleryPortraitFilter.js';
import { unsplashGallerySearchPage } from './gallerySaveGuard.js';

export function galleryLoadFailedAfterEmptyFetch({ sourceHadError, imageCount }) {
  if (imageCount > 0) return false;
  return Boolean(sourceHadError);
}

export async function fetchUnsplashStockForGallery(accessKey, query, page) {
  const allowedPage = unsplashGallerySearchPage(page);
  if (!accessKey || !query || !allowedPage) {
    return { images: [], hadError: false, attempted: false };
  }
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?page=${allowedPage}&query=${encodeURIComponent(query)}&per_page=30&order_by=relevant`,
      { headers: { Authorization: `Client-ID ${accessKey}` } },
    );
    if (!response.ok) {
      return { images: [], hadError: true, attempted: true };
    }
    const data = await response.json();
    return {
      images: filterOutSinglePersonPortraits(data.results || []),
      hadError: false,
      attempted: true,
    };
  } catch {
    return { images: [], hadError: true, attempted: true };
  }
}
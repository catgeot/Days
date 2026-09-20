import { supabase } from '../shared/api/supabase';
import { apiClient } from '../pages/Home/lib/apiClient';
import { getWorldEventHeroImages } from './worldEventGlossary';
import {
  buildWorldEventHeroGalleryQueries,
  isHangulPhotoQuery,
} from './worldEventMedia';
import { isUnsplashListPhoto } from './worldEventListPhoto';
import {
  mapUnsplashPhotosToGalleryImages,
  mergeWorldEventHeroGalleryImages,
  fetchWikimediaGalleryFromQueries,
  heroGallerySeedCacheMatches,
  buildHeroGalleryFromCache,
  galleryNeedsAtmosphereRefresh,
  rankWorldEventHeroGalleryImages,
} from './worldEventHeroGalleryMerge';

const INVOKE_TIMEOUT_MS = 18_000;
const MIN_GALLERY_COUNT = 6;
const TARGET_GALLERY_COUNT = 12;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 */
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * @param {Array<{ url?: string, source?: string }>} images
 */
function galleryCacheHasUnsplash(images) {
  return Array.isArray(images) && images.some((image) => isUnsplashListPhoto(image));
}

async function fetchClientUnsplashGallery(queries) {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const list = (Array.isArray(queries) ? queries : [])
    .map((query) => String(query || '').trim())
    .filter((query, index, all) => query && !isHangulPhotoQuery(query) && all.indexOf(query) === index)
    .slice(0, 4);
  if (!accessKey || !list.length) return [];

  let photos = [];
  const seen = new Set();
  for (const query of list) {
    if (photos.length >= TARGET_GALLERY_COUNT) break;
    const batch = await apiClient.fetchUnsplashImages(accessKey, query, 1);
    for (const photo of batch) {
      if (!photo?.id || seen.has(photo.id)) continue;
      seen.add(photo.id);
      photos.push(photo);
    }
  }

  return mapUnsplashPhotosToGalleryImages(photos);
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 * @returns {Promise<{ ok: boolean, images: Array<{ url: string, captionKo?: string, captionEn?: string }>, fromCache?: boolean, error?: string }>}
 */
export async function fetchEventHeroGallery(event, locale = 'ko') {
  const eventId = String(event?.id || '').trim();
  if (!eventId) {
    return { ok: false, images: [], error: 'eventId required' };
  }

  const seedImages = getWorldEventHeroImages(event);
  const { primary, fallbackEn, wikimediaQueries } = buildWorldEventHeroGalleryQueries(event, locale);
  const unsplashQueries = [primary, fallbackEn, ...(Array.isArray(wikimediaQueries) ? wikimediaQueries : [])];

  let cachedImages = [];
  try {
    const { data: cached } = await supabase
      .from('event_hero_gallery')
      .select('images')
      .eq('event_id', eventId)
      .maybeSingle();
    cachedImages = Array.isArray(cached?.images) ? cached.images : [];
  } catch (err) {
    console.warn('[fetchEventHeroGallery] cache select:', err?.message || err);
  }

  const cacheUsable = cachedImages.length >= MIN_GALLERY_COUNT;
  const cacheSeedsMatch = heroGallerySeedCacheMatches(cachedImages, seedImages);
  const cacheHasUnsplash = galleryCacheHasUnsplash(cachedImages);
  const cacheNeedsAtmosphere = galleryNeedsAtmosphereRefresh(cachedImages);

  if (cacheUsable && cacheSeedsMatch && cacheHasUnsplash && !cacheNeedsAtmosphere) {
    return {
      ok: true,
      images: buildHeroGalleryFromCache(seedImages, cachedImages, TARGET_GALLERY_COUNT),
      fromCache: true,
    };
  }

  let edgeImages = [];
  let edgeFromCache = false;
  let invokeError = '';
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('fetch-event-hero-gallery', {
        body: {
          eventId,
          searchQuery: primary,
          fallbackSearchQuery: fallbackEn,
          wikimediaQueries,
          seedImages,
          force: cacheUsable && (!cacheSeedsMatch || !cacheHasUnsplash || cacheNeedsAtmosphere),
        },
      }),
      INVOKE_TIMEOUT_MS,
      'event-hero-gallery',
    );
    if (error) {
      invokeError = error.message || String(error);
      console.warn('[fetchEventHeroGallery] invoke error:', invokeError);
    } else if (data?.success && Array.isArray(data.images)) {
      edgeImages = data.images;
      edgeFromCache = Boolean(data.fromCache);
    } else if (data?.error) {
      invokeError = String(data.error);
    }
  } catch (err) {
    invokeError = err?.message || 'invoke failed';
    console.warn('[fetchEventHeroGallery] invoke:', invokeError);
  }

  let merged = buildHeroGalleryFromCache(seedImages, edgeImages, TARGET_GALLERY_COUNT);
  const edgeReady =
    merged.length >= MIN_GALLERY_COUNT &&
    galleryCacheHasUnsplash(merged) &&
    !galleryNeedsAtmosphereRefresh(merged);

  if (!edgeReady) {
    try {
      const unsplashImages = await fetchClientUnsplashGallery(unsplashQueries);
      merged = mergeWorldEventHeroGalleryImages(merged, unsplashImages);

      if (merged.length < MIN_GALLERY_COUNT && wikimediaQueries?.length) {
        const wikiImages = await fetchWikimediaGalleryFromQueries(
          wikimediaQueries,
          TARGET_GALLERY_COUNT,
        );
        merged = mergeWorldEventHeroGalleryImages(merged, wikiImages);
      }
    } catch (err) {
      console.warn('[fetchEventHeroGallery] client fallback:', err?.message || err);
    }
  }

  merged = rankWorldEventHeroGalleryImages(merged).slice(0, TARGET_GALLERY_COUNT);

  if (merged.length >= MIN_GALLERY_COUNT) {
    return { ok: true, images: merged, fromCache: edgeFromCache && edgeReady };
  }

  return {
    ok: merged.length > 0,
    images: merged.length ? merged : seedImages,
    error: invokeError || 'gallery fetch failed',
  };
}

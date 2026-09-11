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

async function fetchClientUnsplashGallery(primary, fallbackEn) {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const queries = [primary, fallbackEn]
    .map((query) => String(query || '').trim())
    .filter((query, index, list) => query && !isHangulPhotoQuery(query) && list.indexOf(query) === index);
  if (!accessKey || !queries.length) return [];

  let photos = await apiClient.fetchUnsplashImages(accessKey, queries[0], 1);
  if (photos.length < MIN_GALLERY_COUNT && queries[1]) {
    const more = await apiClient.fetchUnsplashImages(accessKey, queries[1], 1);
    const seen = new Set(photos.map((photo) => photo.id));
    photos = [...photos, ...more.filter((photo) => !seen.has(photo.id))];
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

  try {
    const { data: cached } = await supabase
      .from('event_hero_gallery')
      .select('images')
      .eq('event_id', eventId)
      .maybeSingle();

    const cachedImages = Array.isArray(cached?.images) ? cached.images : [];
    const cacheUsable = cachedImages.length >= MIN_GALLERY_COUNT;
    const cacheSeedsMatch = heroGallerySeedCacheMatches(cachedImages, seedImages);
    const cacheHasUnsplash = galleryCacheHasUnsplash(cachedImages);

    if (cacheUsable && cacheSeedsMatch && cacheHasUnsplash) {
      return {
        ok: true,
        images: buildHeroGalleryFromCache(seedImages, cachedImages, TARGET_GALLERY_COUNT),
        fromCache: true,
      };
    }

    const { data, error } = await withTimeout(
      supabase.functions.invoke('fetch-event-hero-gallery', {
        body: {
          eventId,
          searchQuery: primary,
          fallbackSearchQuery: fallbackEn,
          wikimediaQueries,
          seedImages,
          force: cacheUsable && (!cacheSeedsMatch || !cacheHasUnsplash),
        },
      }),
      INVOKE_TIMEOUT_MS,
      'event-hero-gallery',
    );

    if (error) {
      console.warn('[fetchEventHeroGallery] invoke error:', error.message || error);
    } else if (data?.success && Array.isArray(data.images) && data.images.length > 0) {
      const images = buildHeroGalleryFromCache(seedImages, data.images, TARGET_GALLERY_COUNT);
      return { ok: true, images, fromCache: Boolean(data.fromCache) };
    }

    const unsplashImages = await fetchClientUnsplashGallery(primary, fallbackEn);
    let merged = mergeWorldEventHeroGalleryImages(seedImages, unsplashImages);

    if (merged.length < MIN_GALLERY_COUNT && wikimediaQueries?.length) {
      const wikiImages = await fetchWikimediaGalleryFromQueries(
        wikimediaQueries,
        TARGET_GALLERY_COUNT,
      );
      merged = mergeWorldEventHeroGalleryImages(merged, wikiImages).slice(0, TARGET_GALLERY_COUNT);
    } else {
      merged = merged.slice(0, TARGET_GALLERY_COUNT);
    }

    if (merged.length >= MIN_GALLERY_COUNT) {
      return { ok: true, images: merged, fromCache: false };
    }

    if (data?.success && Array.isArray(data.images) && data.images.length > 0) {
      return { ok: true, images: data.images, fromCache: Boolean(data.fromCache) };
    }

    return {
      ok: false,
      images: merged.length ? merged : seedImages,
      error: error?.message || data?.error || 'gallery fetch failed',
    };
  } catch (err) {
    console.warn('[fetchEventHeroGallery] failed:', err?.message || err);
    return { ok: false, images: seedImages, error: err?.message || 'failed' };
  }
}

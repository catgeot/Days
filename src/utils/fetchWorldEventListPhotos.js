import { supabase } from '../shared/api/supabase';
import { apiClient } from '../pages/Home/lib/apiClient';
import { buildWorldEventHeroGalleryQueries } from './worldEventMedia';
import {
  mapUnsplashPhotoToListImage,
  pickWorldEventListPhoto,
  readWorldEventListPhotoCache,
  writeWorldEventListPhotoCache,
} from './worldEventListPhoto';

const FETCH_CONCURRENCY = 3;

/**
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<void>} worker
 */
async function runPool(items, limit, worker) {
  let cursor = 0;
  const size = Math.max(1, Math.min(limit, items.length));
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await worker(items[index]);
      }
    }),
  );
}

/**
 * @param {string} primary
 * @param {string} fallbackEn
 */
async function fetchOneUnsplashListPhoto(primary, fallbackEn) {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const queries = [primary, fallbackEn].filter(
    (query, index, list) => query && list.indexOf(query) === index,
  );

  for (const query of queries) {
    const photos = await apiClient.fetchUnsplashImages(accessKey, query, 1);
    const mapped = Array.isArray(photos)
      ? photos.map(mapUnsplashPhotoToListImage).find(Boolean)
      : null;
    if (mapped) return mapped;
  }

  return null;
}

/**
 * Hub list thumbs — Unsplash first (DB cache, then live search). Wikimedia seeds are not used.
 * @param {import('./worldEvents').WorldEvent[]} events
 * @param {string} [locale]
 * @returns {Promise<Record<string, { url: string, source: string, photographer?: string }>>}
 */
export async function fetchWorldEventListPhotos(events, locale = 'ko') {
  const photosById = { ...readWorldEventListPhotoCache() };
  const list = Array.isArray(events) ? events.filter((event) => event?.id) : [];
  const missing = list.filter((event) => !photosById[event.id]?.url);

  if (missing.length) {
    try {
      const { data, error } = await supabase
        .from('event_hero_gallery')
        .select('event_id, images')
        .in(
          'event_id',
          missing.map((event) => event.id),
        );

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const picked = pickWorldEventListPhoto(row?.images);
          if (!picked) continue;
          photosById[row.event_id] = picked;
        }
      }
    } catch (err) {
      console.warn('[fetchWorldEventListPhotos] cache', err?.message || err);
    }
  }

  const stillMissing = list.filter((event) => !photosById[event.id]?.url);
  if (stillMissing.length) {
    await runPool(stillMissing, FETCH_CONCURRENCY, async (event) => {
      try {
        const { primary, fallbackEn } = buildWorldEventHeroGalleryQueries(event, locale);
        const photo = await fetchOneUnsplashListPhoto(primary, fallbackEn);
        if (photo) photosById[event.id] = photo;
      } catch (err) {
        console.warn('[fetchWorldEventListPhotos]', event.id, err?.message || err);
      }
    });
  }

  writeWorldEventListPhotoCache(photosById);
  return photosById;
}

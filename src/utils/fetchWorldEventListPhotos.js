import { supabase } from '../shared/api/supabase';
import { apiClient } from '../pages/Home/lib/apiClient';
import { buildWorldEventListPhotoQueries } from './worldEventMedia';
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
 * @param {string[]} queries
 */
async function fetchOneUnsplashListPhoto(queries) {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const list = Array.isArray(queries)
    ? queries.map((query) => String(query || '').trim()).filter(Boolean)
    : [];

  for (const query of list) {
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
 * @param {{ onPhotos?: (photos: Record<string, { url: string, source: string, photographer?: string }>) => void }} [options]
 * @returns {Promise<Record<string, { url: string, source: string, photographer?: string }>>}
 */
export async function fetchWorldEventListPhotos(events, locale = 'ko', options = {}) {
  const onPhotos = typeof options?.onPhotos === 'function' ? options.onPhotos : null;
  const photosById = { ...readWorldEventListPhotoCache() };
  const emit = () => {
    if (onPhotos) onPhotos({ ...photosById });
  };
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
        emit();
      }
    } catch (err) {
      console.warn('[fetchWorldEventListPhotos] cache', err?.message || err);
    }
  }

  const stillMissing = list.filter((event) => !photosById[event.id]?.url);
  if (stillMissing.length) {
    await runPool(stillMissing, FETCH_CONCURRENCY, async (event) => {
      try {
        const queries = buildWorldEventListPhotoQueries(event, locale);
        const photo = await fetchOneUnsplashListPhoto(queries);
        if (photo) {
          photosById[event.id] = photo;
          emit();
        }
      } catch (err) {
        console.warn('[fetchWorldEventListPhotos]', event.id, err?.message || err);
      }
    });
  }

  writeWorldEventListPhotoCache(photosById);
  return photosById;
}

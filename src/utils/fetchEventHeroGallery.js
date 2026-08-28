import { supabase } from '../shared/api/supabase';
import { getWorldEventHeroImages } from './worldEventGlossary';
import { buildWorldEventSearchQuery } from './worldEventMedia';

const INVOKE_TIMEOUT_MS = 18_000;
const MIN_GALLERY_COUNT = 6;

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
  const searchQuery = buildWorldEventSearchQuery(event, locale);

  try {
    const { data: cached } = await supabase
      .from('event_hero_gallery')
      .select('images')
      .eq('event_id', eventId)
      .maybeSingle();

    if (cached && Array.isArray(cached.images) && cached.images.length >= MIN_GALLERY_COUNT) {
      return { ok: true, images: cached.images, fromCache: true };
    }

    const { data, error } = await withTimeout(
      supabase.functions.invoke('fetch-event-hero-gallery', {
        body: {
          eventId,
          searchQuery,
          seedImages,
        },
      }),
      INVOKE_TIMEOUT_MS,
      'event-hero-gallery',
    );

    if (error) {
      console.warn('[fetchEventHeroGallery] invoke error:', error.message || error);
      return { ok: false, images: seedImages, error: error.message || 'invoke failed' };
    }

    if (!data?.success) {
      return {
        ok: false,
        images: seedImages,
        error: data?.error || 'gallery fetch failed',
      };
    }

    const images = Array.isArray(data.images) && data.images.length ? data.images : seedImages;
    return { ok: true, images, fromCache: Boolean(data.fromCache) };
  } catch (err) {
    console.warn('[fetchEventHeroGallery] failed:', err?.message || err);
    return { ok: false, images: seedImages, error: err?.message || 'failed' };
  }
}

import { supabase } from '../shared/api/supabase';
import { buildWorldEventYoutubeSearchQuery } from './worldEventMedia';

const INVOKE_TIMEOUT_MS = 15_000;
export const WORLD_EVENT_VIDEOS_PAGE = 2;
export const WORLD_EVENT_VIDEOS_MAX = 10;

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
 * @param {string} eventId
 */
export function worldEventVideosPlaceId(eventId) {
  return `world-event:${String(eventId || '').trim()}`;
}

/**
 * @param {{ id?: string, title?: string }} video
 */
function normalizeVideo(video) {
  return {
    id: String(video?.id || '').trim(),
    title: String(video?.title || '').trim() || video?.id || '',
  };
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 * @returns {Promise<{
 *   ok: boolean,
 *   videos: Array<{ id: string, title: string }>,
 *   fromCache?: boolean,
 *   error?: string,
 * }>}
 */
export async function fetchWorldEventVideos(event, locale = 'ko') {
  const eventId = String(event?.id || '').trim();
  if (!eventId) {
    return { ok: false, videos: [], error: 'eventId required' };
  }

  const placeId = worldEventVideosPlaceId(eventId);
  const query = buildWorldEventYoutubeSearchQuery(event, locale);
  const fallbackQuery =
    locale === 'en'
      ? buildWorldEventYoutubeSearchQuery(event, 'ko')
      : buildWorldEventYoutubeSearchQuery(event, 'en');

  try {
    const { data: cached } = await supabase
      .from('place_videos')
      .select('videos')
      .eq('place_id', placeId)
      .limit(1)
      .maybeSingle();

    if (
      cached &&
      Array.isArray(cached.videos) &&
      cached.videos.length >= WORLD_EVENT_VIDEOS_MAX
    ) {
      return {
        ok: true,
        videos: cached.videos.slice(0, WORLD_EVENT_VIDEOS_MAX).map(normalizeVideo),
        fromCache: true,
      };
    }

    const { data, error } = await withTimeout(
      supabase.functions.invoke('fetch-place-videos', {
        body: {
          mode: 'festival',
          query,
          fallbackQuery,
          placeId,
          maxResults: WORLD_EVENT_VIDEOS_MAX,
          relevanceLanguage: locale === 'en' ? 'en' : 'ko',
          regionCode: locale === 'en' ? 'US' : 'KR',
        },
      }),
      INVOKE_TIMEOUT_MS,
      'world-event-videos',
    );

    if (error) {
      console.warn('[fetchWorldEventVideos] invoke error:', error.message || error);
      return { ok: false, videos: [], error: error.message || 'invoke failed' };
    }

    if (!data?.success) {
      return { ok: false, videos: [], error: data?.error || 'YouTube search failed' };
    }

    return {
      ok: true,
      videos: (Array.isArray(data.videos) ? data.videos : [])
        .slice(0, WORLD_EVENT_VIDEOS_MAX)
        .map(normalizeVideo),
      fromCache: false,
    };
  } catch (err) {
    console.warn('[fetchWorldEventVideos] failed:', err?.message || err);
    return { ok: false, videos: [], error: err?.message || 'failed' };
  }
}

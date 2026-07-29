import { supabase } from '../shared/api/supabase';

const INVOKE_TIMEOUT_MS = 15_000;
export const FESTIVAL_VIDEOS_PAGE = 5;
export const FESTIVAL_VIDEOS_MAX = 10;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
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
 * @param {{
 *   contentId: string | number,
 *   title: string,
 *   year?: string | number,
 *   maxResults?: number,
 *   skipCache?: boolean,
 * }} opts
 * @returns {Promise<{
 *   ok: boolean,
 *   videos: Array<{ id: string, title: string }>,
 *   fromCache?: boolean,
 *   error?: string,
 * }>}
 */
export async function fetchFestivalVideos(opts) {
  const contentId = String(opts?.contentId ?? '').trim();
  const title = String(opts?.title ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId) || !title) {
    return { ok: false, videos: [], error: 'contentId and title required' };
  }

  const placeId = `festival:${contentId}`;
  const yearRaw = opts?.year != null ? String(opts.year).trim() : '';
  const year = /^\d{4}$/.test(yearRaw) ? yearRaw : '';
  const query = year ? `${title} ${year} 축제` : `${title} 축제`;
  const fallbackQuery = `${title} festival`;
  const maxResults = Math.min(
    FESTIVAL_VIDEOS_MAX,
    Math.max(1, Math.floor(Number(opts?.maxResults) || FESTIVAL_VIDEOS_PAGE)),
  );
  const skipCache = Boolean(opts?.skipCache);

  try {
    if (!skipCache) {
      const { data: cached } = await supabase
        .from('place_videos')
        .select('videos')
        .eq('place_id', placeId)
        .limit(1)
        .maybeSingle();

      if (cached && Array.isArray(cached.videos) && cached.videos.length > 0) {
        return {
          ok: true,
          videos: cached.videos.slice(0, FESTIVAL_VIDEOS_MAX),
          fromCache: true,
        };
      }
    }

    const { data, error } = await withTimeout(
      supabase.functions.invoke('fetch-place-videos', {
        body: {
          mode: 'festival',
          query,
          fallbackQuery,
          placeId,
          maxResults,
        },
      }),
      INVOKE_TIMEOUT_MS,
      'festival-videos',
    );

    if (error) {
      console.warn('[festival-videos] invoke error:', error.message || error);
      return { ok: false, videos: [], error: error.message || 'invoke failed' };
    }
    if (!data?.success) {
      return {
        ok: false,
        videos: [],
        error: data?.error || 'YouTube search failed',
      };
    }
    return {
      ok: true,
      videos: Array.isArray(data.videos)
        ? data.videos.slice(0, FESTIVAL_VIDEOS_MAX)
        : [],
      fromCache: false,
    };
  } catch (err) {
    console.warn('[festival-videos] failed:', err?.message || err);
    return { ok: false, videos: [], error: err?.message || 'failed' };
  }
}

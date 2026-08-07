import { supabase } from '../shared/api/supabase';

const INVOKE_TIMEOUT_MS = 15_000;
export const SCENIC_VIDEOS_PAGE = 5;
export const SCENIC_VIDEOS_MAX = 10;

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
 * 명승/관광지 YouTube — place 모드(여행 브이로그) · DB 캐시.
 * @param {{
 *   contentId?: string | number | null,
 *   title: string,
 *   titleEn?: string | null,
 *   cacheKey?: string | null,
 * }} opts
 * @returns {Promise<{
 *   ok: boolean,
 *   videos: Array<{ id: string, title: string }>,
 *   fromCache?: boolean,
 *   error?: string,
 * }>}
 */
export async function fetchScenicSpotVideos(opts) {
  const title = String(opts?.title ?? '').trim();
  if (!title) {
    return { ok: false, videos: [], error: 'title required' };
  }

  const contentId = String(opts?.contentId ?? '').trim();
  const cacheKey = String(opts?.cacheKey ?? '').trim();
  const placeId = /^\d{1,32}$/.test(contentId)
    ? `scenic:${contentId}`
    : cacheKey
      ? `scenic:${cacheKey}`
      : '';
  if (!placeId) {
    return { ok: false, videos: [], error: 'contentId or cacheKey required' };
  }

  const titleEn = String(opts?.titleEn ?? '').trim();
  const fallbackQuery = titleEn
    ? `${titleEn} travel vlog`
    : `${title} travel vlog`;

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
      cached.videos.length >= SCENIC_VIDEOS_MAX
    ) {
      return {
        ok: true,
        videos: cached.videos.slice(0, SCENIC_VIDEOS_MAX),
        fromCache: true,
      };
    }

    const { data, error } = await withTimeout(
      supabase.functions.invoke('fetch-place-videos', {
        body: {
          query: title,
          fallbackQuery,
          placeId,
          maxResults: SCENIC_VIDEOS_MAX,
        },
      }),
      INVOKE_TIMEOUT_MS,
      'scenic-videos',
    );

    if (error) {
      console.warn('[scenic-videos] invoke error:', error.message || error);
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
        ? data.videos.slice(0, SCENIC_VIDEOS_MAX)
        : [],
      fromCache: false,
    };
  } catch (err) {
    console.warn('[scenic-videos] failed:', err?.message || err);
    return { ok: false, videos: [], error: err?.message || 'failed' };
  }
}

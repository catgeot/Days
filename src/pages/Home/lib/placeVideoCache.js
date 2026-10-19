import { filterBlockedPlaceVideos } from '../../../../supabase/functions/_shared/videoBlocklist.mjs';

const METADATA_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isMetadataExpired(lastUpdated, now = Date.now()) {
  if (!lastUpdated) return false;
  const t = Date.parse(lastUpdated);
  if (!Number.isFinite(t)) return false;
  return now - t > METADATA_TTL_MS;
}

/** Search backoff: next_retry_at in the future blocks refetch even when metadata expired. */
export function isRetryBlockingRefetch(row, now = Date.now()) {
  if (!row || row.next_retry_at == null || row.next_retry_at === '') return false;
  const retryAt = Date.parse(row.next_retry_at);
  return Number.isFinite(retryAt) && retryAt > now;
}

/**
 * 빈 결과·오류 행은 next_retry_at 이 지나야 엣지를 다시 부른다.
 * 그 시각 전에는 videos 가 [] 여도 빈 상태로 둔다.
 * last_updated 가 30일 초과면 메타데이터 만료로 재조회하나, next_retry_at 이 미래면 백오프 우선(0 YouTube 호출).
 * @param {{ videos?: unknown, next_retry_at?: string | null, last_updated?: string | null } | null | undefined} row
 * @param {number} [now]
 */
export function stripYoutubeDisplayMetadata(videos) {
  if (!Array.isArray(videos)) return [];
  return videos.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const { title, channelTitle, publishedAt, ...rest } = entry;
    return rest;
  });
}

/** Serve cached row videos with >30d metadata stripped (ToS), ids + GATEO fields kept. */
export function placeVideosForClient(row) {
  const videos = Array.isArray(row?.videos) ? row.videos : [];
  const base = !isMetadataExpired(row?.last_updated)
    ? videos
    : stripYoutubeDisplayMetadata(videos);
  return filterBlockedPlaceVideos(base);
}

export function shouldRefreshPlaceVideoCache(row, now = Date.now()) {
  if (!row || !Array.isArray(row.videos)) return true;
  if (isMetadataExpired(row.last_updated, now) && isRetryBlockingRefetch(row, now)) {
    return false;
  }
  if (isMetadataExpired(row.last_updated, now)) return true;
  if (row.next_retry_at == null || row.next_retry_at === '') return false;
  const retryAt = Date.parse(row.next_retry_at);
  if (!Number.isFinite(retryAt)) return false;
  return retryAt <= now;
}

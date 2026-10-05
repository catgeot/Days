/**
 * 빈 결과·오류 행은 next_retry_at 이 지나야 엣지를 다시 부른다.
 * 그 시각 전에는 videos 가 [] 여도 빈 상태로 둔다.
 * @param {{ videos?: unknown, next_retry_at?: string | null } | null | undefined} row
 * @param {number} [now]
 */
export function shouldRefreshPlaceVideoCache(row, now = Date.now()) {
  if (!row || !Array.isArray(row.videos)) return true;
  if (row.next_retry_at == null || row.next_retry_at === '') return false;
  const retryAt = Date.parse(row.next_retry_at);
  if (!Number.isFinite(retryAt)) return false;
  return retryAt <= now;
}

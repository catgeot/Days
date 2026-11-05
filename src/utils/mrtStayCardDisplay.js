/**
 * MRT 숙소 카드 — Edge `fetch-mrt-stays` 정규화 필드만 표시용.
 * @see supabase/functions/fetch-mrt-stays/index.ts StayItem
 */

/**
 * @param {{ starRating?: number | null } | null | undefined} item
 * @returns {number | null}
 */
export function resolveMrtStayStarCount(item) {
  const n = Number(item?.starRating);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/**
 * @param {{ reviewScore?: string | null, reviewCount?: number | null } | null | undefined} item
 * @returns {{ score: string, count: number | null }}
 */
export function resolveMrtStayReviewDisplay(item) {
  const score = String(item?.reviewScore ?? '').trim();
  if (!score) return { score: '', count: null };
  const count = Number(item?.reviewCount);
  return {
    score,
    count: Number.isFinite(count) && count > 0 ? count : null,
  };
}

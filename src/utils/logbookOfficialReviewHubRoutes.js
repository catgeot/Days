import { EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM } from '../logbookOfficialReviews/constants.js';

/** In-feed editorial review reader on `/blog` (stays on LogBook for browser back). */
export function buildLogbookOfficialReviewHref(reviewId) {
  const id = String(reviewId ?? '').trim();
  if (!id) return '/blog?tab=public';
  const params = new URLSearchParams({ tab: 'public' });
  params.set(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM, id);
  return `/blog?${params.toString()}`;
}

export function parseLogbookOfficialReviewId(searchParams) {
  const raw = searchParams?.get?.(EDITORIAL_REVIEW_DEEPLINK_QUERY_PARAM);
  const id = String(raw ?? '').trim();
  return id || null;
}

import { shouldSkipGateoAutomatedTraffic } from './analytics/gateoGaQa.js';

/**
 * @param {Parameters<typeof shouldSkipGateoAutomatedTraffic>[0]} [env]
 */
export function shouldAttemptPlaceReviewViewIncrement(env) {
  return !shouldSkipGateoAutomatedTraffic(env);
}

/**
 * Session-deduped single RPC for place review views (client only).
 *
 * @param {{
 *   reviewId: string,
 *   rpc: (fn: string, args: { review_id_param: string }) => Promise<{ error?: { message?: string } | null }>,
 *   sessionStorage: { getItem: (k: string) => string | null, setItem: (k: string, v: string) => void, removeItem?: (k: string) => void },
 *   env?: Parameters<typeof shouldSkipGateoAutomatedTraffic>[0],
 * }} input
 * @returns {Promise<{ rpcCalls: number, error?: string }>}
 */
export async function incrementPlaceReviewViewOnce(input) {
  const { reviewId, rpc, sessionStorage, env } = input;
  if (!shouldAttemptPlaceReviewViewIncrement(env)) {
    return { rpcCalls: 0 };
  }
  const viewedKey = `viewed_review_${reviewId}`;
  if (sessionStorage.getItem(viewedKey)) {
    return { rpcCalls: 0 };
  }
  sessionStorage.setItem(viewedKey, 'true');
  try {
    const { error } = await rpc('increment_review_view', { review_id_param: reviewId });
    if (error) throw error;
    return { rpcCalls: 1 };
  } catch (err) {
    sessionStorage.removeItem?.(viewedKey);
    const message = err?.message ?? String(err);
    return { rpcCalls: 0, error: message };
  }
}
import { incrementPlaceReviewViewOnce } from './placeReviewViewIncrement.js';

/**
 * @typedef {'mount' | 'deeplink' | 'expand'} PlaceReviewViewTrigger
 */

/**
 * @param {PlaceReviewViewTrigger} trigger
 */
export function shouldIncrementOnReviewItemTrigger(trigger) {
  return trigger === 'deeplink' || trigger === 'expand';
}

/**
 * @param {{
 *   reviewId: string,
 *   trigger: PlaceReviewViewTrigger,
 *   itemAlreadyCounted?: boolean,
 *   rpc: (fn: string, args: { review_id_param: string }) => Promise<{ error?: { message?: string } | null }>,
 *   sessionStorage: { getItem: (k: string) => string | null, setItem: (k: string, v: string) => void, removeItem?: (k: string) => void },
 *   env?: Parameters<typeof import('./analytics/gateoGaQa.js').shouldSkipGateoAutomatedTraffic>[0],
 * }} input
 */
export async function applyPlaceReviewViewTrigger(input) {
  const { reviewId, trigger, itemAlreadyCounted = false, rpc, sessionStorage, env } = input;
  if (!shouldIncrementOnReviewItemTrigger(trigger)) {
    return { rpcCalls: 0, itemCounted: itemAlreadyCounted };
  }
  if (itemAlreadyCounted) {
    return { rpcCalls: 0, itemCounted: true };
  }
  const res = await incrementPlaceReviewViewOnce({
    reviewId,
    rpc,
    sessionStorage,
    env,
  });
  return {
    rpcCalls: res.rpcCalls,
    itemCounted: res.rpcCalls > 0 || itemAlreadyCounted,
    error: res.error,
  };
}
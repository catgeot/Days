import { setPlaceReturnTo } from '../pages/Home/lib/placeReturnTo.js';
import { markLogbookEditorialReviewDetailLayoutFromHub } from './logbookEditorialReviewDetailLayout.js';
import {
  buildLogbookHubReturnTo,
  snapshotLogbookReviewHubSession,
} from './logbookReviewHubSession.js';

/**
 * Hub → place reviews 링크 직전: returnTo + 허브 UI 스냅샷.
 * @param {{
 *   pathname: string,
 *   search: string,
 *   expanded: boolean,
 *   visibleCount: number,
 *   scrollY?: number,
 * }} input
 */
export function prepareLogbookReviewHubNavigation(input) {
  const returnTo = buildLogbookHubReturnTo(input.pathname, input.search);
  setPlaceReturnTo(returnTo);
  snapshotLogbookReviewHubSession({
    returnTo,
    expanded: input.expanded,
    visibleCount: input.visibleCount,
    scrollY: typeof input.scrollY === 'number' ? input.scrollY : undefined,
  });
  markLogbookEditorialReviewDetailLayoutFromHub();
  return { returnTo, fromLogbookReviewHub: true };
}
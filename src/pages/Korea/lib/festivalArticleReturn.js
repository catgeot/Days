import { getAppHistoryPath } from '../../../shared/navigation/appHistoryPathIndex.js';
import {
  isArticleReaderPath,
  sameOriginAppPath,
} from '../../../shared/navigation/logbookDetailBack.js';

/**
 * Festival detail opened from an article body should pop back to that article.
 * Explore, search, the festival home, and a direct/external entry do not.
 *
 * @param {{
 *   historyIdx?: number | null,
 *   prevPath?: string | null,
 *   historyLength?: number | null,
 *   referrerPath?: string | null,
 * }} input
 * @returns {{ type: 'history' } | null}
 */
export function resolveFestivalArticleReturn(input) {
  const historyIdx = input?.historyIdx;
  const prevPath = typeof input?.prevPath === 'string' ? input.prevPath : null;
  if (typeof historyIdx === 'number' && historyIdx > 0) {
    return isArticleReaderPath(prevPath) ? { type: 'history' } : null;
  }
  const historyLength = input?.historyLength;
  const referrerPath = typeof input?.referrerPath === 'string' ? input.referrerPath : null;
  if (
    typeof historyLength === 'number' &&
    historyLength > 1 &&
    isArticleReaderPath(referrerPath)
  ) {
    return { type: 'history' };
  }
  return null;
}

/** @returns {{ type: 'history' } | null} */
export function readFestivalArticleReturnFromWindow() {
  if (typeof window === 'undefined') return null;
  const idx = window.history.state?.idx;
  const historyIdx = typeof idx === 'number' ? idx : null;
  return resolveFestivalArticleReturn({
    historyIdx,
    prevPath: historyIdx == null ? null : getAppHistoryPath(historyIdx - 1),
    historyLength: window.history.length,
    referrerPath: sameOriginAppPath(document.referrer, window.location.origin),
  });
}

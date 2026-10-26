import {
  clearFestivalSheetExternalReturnMark,
  clearFestivalSheetPendingDeeplink,
  peekFestivalSheetRestoreId,
} from './festivalHomepageProtocol.js';
import {
  festivalIdFromSearchParams,
  searchParamsWithFestival,
} from '../koreaFestivalDetailUrl.js';

/**
 * @param {(next: URLSearchParams, opts: { replace: boolean }) => void} applySearchParams
 * @returns {boolean} true if festival query was restored
 */
export function restoreFestivalSheetQueryIfNeeded(applySearchParams) {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    const stored = peekFestivalSheetRestoreId();
    if (!stored || !/^\d+$/.test(stored)) return false;
    const liveParams = new URLSearchParams(window.location.search);
    if (festivalIdFromSearchParams(liveParams) === stored) {
      clearFestivalSheetPendingDeeplink();
      clearFestivalSheetExternalReturnMark();
      return false;
    }
    applySearchParams(searchParamsWithFestival(liveParams, stored), { replace: true });
    clearFestivalSheetPendingDeeplink();
    clearFestivalSheetExternalReturnMark();
    return true;
  } catch {
    return false;
  }
}

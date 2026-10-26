import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  clearFestivalSheetExternalReturnMark,
  clearFestivalSheetPendingDeeplink,
  hasFestivalSheetExternalLeavePending,
  markFestivalSheetExternalReturn,
  peekFestivalSheetRestoreId,
} from './lib/festivalHomepageProtocol.js';
import { restoreFestivalSheetQueryIfNeeded } from './lib/restoreFestivalSheetQuery.js';
import { festivalIdFromSearchParams } from './koreaFestivalDetailUrl.js';

/**
 * @param {{
 *   festivalId: string,
 *   seededFestivalIdRef: import('react').RefObject<string>,
 * }} params
 */
export function useFestivalSheetExternalReturnGuard({
  festivalId,
  seededFestivalIdRef,
}) {
  const [, setSearchParams] = useSearchParams();
  const inAppHistoryBackRef = useRef(false);

  useEffect(() => {
    if (festivalId) return undefined;
    if (hasFestivalSheetExternalLeavePending()) return undefined;
    const timer = window.setTimeout(() => {
      if (hasFestivalSheetExternalLeavePending()) return;
      const liveParams = new URLSearchParams(window.location.search);
      if (festivalIdFromSearchParams(liveParams)) return;
      clearFestivalSheetPendingDeeplink();
      clearFestivalSheetExternalReturnMark();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [festivalId]);

  useEffect(() => {
    const onPageHide = () => {
      if (inAppHistoryBackRef.current) {
        inAppHistoryBackRef.current = false;
        return;
      }
      const id =
        String(festivalId || '').trim() ||
        String(seededFestivalIdRef.current || '').trim();
      if (!id || id === '__invalid__' || !/^\d+$/.test(id)) return;
      markFestivalSheetExternalReturn(id);
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [festivalId, seededFestivalIdRef]);

  useEffect(() => {
    const applySearchParams = (next, opts) => {
      setSearchParams(next, opts);
    };

    const tryRestoreAfterExternalReturn = (persisted) => {
      const leavePending = hasFestivalSheetExternalLeavePending();
      const hasRestoreHint = Boolean(peekFestivalSheetRestoreId());
      if (!leavePending && !(persisted && hasRestoreHint)) return;
      restoreFestivalSheetQueryIfNeeded(applySearchParams);
    };

    const onPageShow = (event) => {
      tryRestoreAfterExternalReturn(event.persisted);
    };

    const onPopState = () => {
      const liveParams = new URLSearchParams(window.location.search);
      if (festivalIdFromSearchParams(liveParams)) {
        inAppHistoryBackRef.current = false;
        return;
      }
      inAppHistoryBackRef.current = true;
      if (hasFestivalSheetExternalLeavePending()) {
        restoreFestivalSheetQueryIfNeeded(applySearchParams);
        return;
      }
      window.setTimeout(() => {
        if (hasFestivalSheetExternalLeavePending()) return;
        const laterParams = new URLSearchParams(window.location.search);
        if (festivalIdFromSearchParams(laterParams)) return;
        clearFestivalSheetPendingDeeplink();
        clearFestivalSheetExternalReturnMark();
      }, 100);
    };

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, [setSearchParams]);
}

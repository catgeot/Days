import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  markFestivalSheetExternalReturn,
  peekFestivalSheetRestoreId,
} from './lib/festivalHomepageProtocol.js';
import {
  festivalIdFromSearchParams,
  searchParamsWithFestival,
} from './koreaFestivalDetailUrl.js';

/**
 * Same-tab external leave (Safari HTTP interstitial) can restore a list URL without
 * `festival=` if the detail history push has not run yet. Persist + restore the id.
 *
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

  useEffect(() => {
    const onPageHide = () => {
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
    const restoreFestivalQuery = () => {
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return;
      }
      try {
        const stored = peekFestivalSheetRestoreId();
        if (!stored || !/^\d+$/.test(stored)) return;
        const liveParams = new URLSearchParams(window.location.search);
        if (festivalIdFromSearchParams(liveParams) === stored) return;
        setSearchParams(searchParamsWithFestival(liveParams, stored), {
          replace: true,
        });
      } catch {
        /* quota */
      }
    };
    window.addEventListener('pageshow', restoreFestivalQuery);
    window.addEventListener('popstate', restoreFestivalQuery);
    return () => {
      window.removeEventListener('pageshow', restoreFestivalQuery);
      window.removeEventListener('popstate', restoreFestivalQuery);
    };
  }, [setSearchParams]);
}

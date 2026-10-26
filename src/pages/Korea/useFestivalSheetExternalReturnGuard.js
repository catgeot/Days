import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FESTIVAL_SHEET_EXTERNAL_RETURN_KEY,
  markFestivalSheetExternalReturn,
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
  const [searchParams, setSearchParams] = useSearchParams();

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
      if (typeof sessionStorage === 'undefined') return;
      try {
        const stored = sessionStorage.getItem(FESTIVAL_SHEET_EXTERNAL_RETURN_KEY);
        if (!stored || !/^\d+$/.test(stored)) return;
        if (festivalIdFromSearchParams(searchParams) === stored) return;
        setSearchParams(searchParamsWithFestival(searchParams, stored), {
          replace: true,
        });
      } catch {
        /* quota */
      }
    };
    window.addEventListener('pageshow', restoreFestivalQuery);
    return () => window.removeEventListener('pageshow', restoreFestivalQuery);
  }, [searchParams, setSearchParams]);
}

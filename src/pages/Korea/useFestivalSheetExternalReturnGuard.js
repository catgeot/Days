import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { markFestivalSheetExternalReturn } from './lib/festivalHomepageProtocol.js';
import { restoreFestivalSheetQueryIfNeeded } from './lib/restoreFestivalSheetQuery.js';

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
      restoreFestivalSheetQueryIfNeeded((next, opts) => {
        setSearchParams(next, opts);
      });
    };
    window.addEventListener('pageshow', restoreFestivalQuery);
    window.addEventListener('popstate', restoreFestivalQuery);
    return () => {
      window.removeEventListener('pageshow', restoreFestivalQuery);
      window.removeEventListener('popstate', restoreFestivalQuery);
    };
  }, [setSearchParams]);
}

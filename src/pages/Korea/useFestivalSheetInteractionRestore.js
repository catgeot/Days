import { useEffect, useRef } from 'react';
import { maybeReloadBlankPersistedPage } from '../../shared/lib/persistedBlankPageReload.js';
import { runFestivalSheetInteractionRestore } from './lib/festivalSheetInteractionRestore.js';

/**
 * @param {{
 *   enabled: boolean,
 *   contentId: string,
 *   sheetScrollRef: import('react').RefObject<HTMLElement | null>,
 *   onResetUi: () => void,
 * }} params
 */
export function useFestivalSheetInteractionRestore({
  enabled,
  contentId,
  sheetScrollRef,
  onResetUi,
}) {
  const onResetRef = useRef(onResetUi);
  onResetRef.current = onResetUi;

  useEffect(() => {
    if (!enabled || !contentId) return undefined;

    const restore = (forceFull = false) => {
      runFestivalSheetInteractionRestore({
        contentId,
        sheetScrollRef,
        onResetUi: () => onResetRef.current(),
        forceFull,
      });
    };

    const onPageShow = (event) => {
      if (maybeReloadBlankPersistedPage(event)) return;
      restore(Boolean(event.persisted));
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') restore(false);
    };

    const onFocus = () => {
      restore(false);
    };

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    restore(false);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, contentId, sheetScrollRef]);
}

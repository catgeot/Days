import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LOGBOOK_FEED_VIEW_URL_PARAM,
  parseLogbookFeedView,
  readStoredLogbookFeedView,
  resolveLogbookFeedViewMode,
  writeStoredLogbookFeedView,
} from '../../../utils/logbookFeedViewMode.js';

const LG_MQ = '(min-width: 1024px)';

export function useLogbookFeedViewMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get(LOGBOOK_FEED_VIEW_URL_PARAM);
  const [storedView, setStoredView] = useState(() => readStoredLogbookFeedView());
  const [isLgUp, setIsLgUp] = useState(
    () => (typeof window !== 'undefined' ? window.matchMedia(LG_MQ).matches : true),
  );

  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setIsLgUp(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const resolved = useMemo(
    () => resolveLogbookFeedViewMode({ isLgUp, urlView, storedView }),
    [isLgUp, urlView, storedView],
  );

  const setViewMode = useCallback(
    (nextId) => {
      const parsed = parseLogbookFeedView(nextId);
      if (!parsed) return;
      setStoredView(parsed);
      writeStoredLogbookFeedView(parsed);
      if (urlView != null) {
        const next = new URLSearchParams(searchParams);
        next.set(LOGBOOK_FEED_VIEW_URL_PARAM, parsed);
        setSearchParams(next, { replace: true });
      }
    },
    [searchParams, setSearchParams, urlView],
  );

  return {
    viewMode: resolved.mode,
    viewModeSource: resolved.source,
    setViewMode,
    isLgUp,
  };
}

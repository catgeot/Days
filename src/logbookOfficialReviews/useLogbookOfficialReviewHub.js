import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../shared/api/supabase';
import { isGateoLogbookReviewHubEnabled } from '../shared/gateoFeatureFlags';
import { fetchEditorialReviewIndex } from './editorialReviewIndex.js';

/**
 * Loads official editorial reviews for the logbook hub card. No-op when flag is off (no network).
 */
export function useLogbookOfficialReviewHub() {
  const enabled = isGateoLogbookReviewHubEnabled();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const retry = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      setIsLoading(false);
      setLoadFailed(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadFailed(false);

    void fetchEditorialReviewIndex(supabase)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn(
            '[logbook-review-hub] fetch failed',
            error?.code || error?.message || error,
          );
        }
        if (!cancelled) {
          setRows([]);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadNonce]);

  return {
    enabled,
    rows,
    isLoading,
    loadFailed,
    totalCount: rows.length,
    retry,
  };
}

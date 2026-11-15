import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../shared/api/supabase';
import { isLogbookOfficialReviewHubActive } from '../utils/logbookReviewFilterFlag.js';
import { fetchEditorialReviewIndex } from './editorialReviewIndex.js';
import { LOGBOOK_REVIEW_FILTER_E2E_FIXTURE } from './logbookReviewFilterE2eFixture.js';
import {
  readLogbookReviewHubRows,
  rememberLogbookReviewHubRows,
} from './logbookReviewHubListCache.js';

const E2E_LIST_DELAY_KEY = 'gateo:e2e-logbook-hub-list-delay-ms';

function isLogbookReviewFilterE2eFixture() {
  const raw =
    import.meta.env?.VITE_GATEO_LOGBOOK_REVIEW_FILTER_E2E ??
    globalThis.__VITE_ENV__?.VITE_GATEO_LOGBOOK_REVIEW_FILTER_E2E;
  return String(raw || '') === '1';
}

function e2eListDelayMs() {
  if (!isLogbookReviewFilterE2eFixture() || typeof window === 'undefined') return 0;
  try {
    const n = Number(window.sessionStorage.getItem(E2E_LIST_DELAY_KEY));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(Math.round(n), 10_000);
  } catch {
    return 0;
  }
}

/** @param {Promise<unknown>} promise @param {number} delayMs */
function delayList(promise, delayMs) {
  if (!delayMs) return promise;
  return new Promise((resolve, reject) => {
    promise.then(
      (data) => {
        window.setTimeout(() => resolve(data), delayMs);
      },
      reject,
    );
  });
}

/**
 * Loads official editorial reviews for the logbook hub card. No-op when flag is off (no network).
 */
export function useLogbookOfficialReviewHub() {
  const enabled = isLogbookOfficialReviewHubActive();
  const [rows, setRows] = useState(() => (enabled ? readLogbookReviewHubRows() || [] : []));
  const [isLoading, setIsLoading] = useState(
    () => enabled && (readLogbookReviewHubRows()?.length || 0) === 0,
  );
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
    const cached = readLogbookReviewHubRows();
    if (!cached?.length) {
      setIsLoading(true);
      setLoadFailed(false);
    }

    const loadPromise = delayList(
      isLogbookReviewFilterE2eFixture()
        ? Promise.resolve(LOGBOOK_REVIEW_FILTER_E2E_FIXTURE)
        : fetchEditorialReviewIndex(supabase),
      e2eListDelayMs(),
    );

    void loadPromise
      .then((data) => {
        if (cancelled) return;
        rememberLogbookReviewHubRows(data);
        setRows(data);
        setLoadFailed(false);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn(
            '[logbook-review-hub] fetch failed',
            error?.code || error?.message || error,
          );
        }
        if (!cancelled && !readLogbookReviewHubRows()?.length) {
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

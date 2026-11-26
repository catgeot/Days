import { useCallback, useEffect, useRef, useState } from 'react';
import { STALE_BUNDLE_BANNER_EVENT } from '../lib/staleBundleRecovery.js';

const POLL_MS = 10 * 60 * 1000;

async function fetchBuildId() {
  const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.buildId ?? null;
}

/** PROD 배포 감지 전용. 릴리스 노트 자동 팝업은 쓰지 않음(FooterModal Updates). */
export function useSiteUpdateBanner() {
  const [refreshVisible, setRefreshVisible] = useState(false);
  const [staleBundleVisible, setStaleBundleVisible] = useState(
    () => typeof window !== 'undefined' && window.__GATEO_STALE_BUNDLE_BANNER__ === true,
  );
  const pageLoadBuildId = useRef(null);

  useEffect(() => {
    const onStaleBundle = () => setStaleBundleVisible(true);
    window.addEventListener(STALE_BUNDLE_BANNER_EVENT, onStaleBundle);
    if (window.__GATEO_STALE_BUNDLE_BANNER__ === true) setStaleBundleVisible(true);
    return () => window.removeEventListener(STALE_BUNDLE_BANNER_EVENT, onStaleBundle);
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    let cancelled = false;

    async function syncBuildId() {
      const buildId = await fetchBuildId();
      if (!buildId || cancelled) return;

      if (pageLoadBuildId.current === null) {
        pageLoadBuildId.current = buildId;
        return;
      }

      if (buildId !== pageLoadBuildId.current) {
        setRefreshVisible(true);
      }
    }

    syncBuildId();
    const intervalId = setInterval(syncBuildId, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const closeRefresh = useCallback(() => {
    setRefreshVisible(false);
    setStaleBundleVisible(false);
    if (typeof window !== 'undefined') window.__GATEO_STALE_BUNDLE_BANNER__ = false;
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    refreshVisible: refreshVisible || staleBundleVisible,
    staleBundleVisible,
    closeRefresh,
    reload,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const pageLoadBuildId = useRef(null);

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
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    refreshVisible,
    closeRefresh,
    reload,
  };
}

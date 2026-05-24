import { useCallback, useEffect, useRef, useState } from 'react';
import { getLatestRelease } from '../../data/releaseNotes';
import {
  setSeenReleaseId,
  setSessionSnoozedReleaseId,
  shouldShowRelease,
} from '../lib/siteUpdateStorage';

const POLL_MS = 10 * 60 * 1000;
const latestRelease = getLatestRelease();

async function fetchBuildId() {
  const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.buildId ?? null;
}

export function useSiteUpdateBanner() {
  const [releaseVisible, setReleaseVisible] = useState(() =>
    shouldShowRelease(latestRelease?.id),
  );
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
        setReleaseVisible(false);
      }
    }

    syncBuildId();
    const intervalId = setInterval(syncBuildId, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const closeRelease = useCallback(() => {
    if (latestRelease?.id) setSessionSnoozedReleaseId(latestRelease.id);
    setReleaseVisible(false);
  }, []);

  const dismissPermanent = useCallback(() => {
    if (latestRelease?.id) setSeenReleaseId(latestRelease.id);
    setReleaseVisible(false);
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  const mode = refreshVisible ? 'refresh' : releaseVisible ? 'release' : null;

  return {
    mode,
    release: latestRelease,
    closeRelease,
    dismissPermanent,
    reload,
  };
}

import { useEffect, useRef } from 'react';
import {
  queryGeolocationPermission,
  readLocationSuccess,
  shouldAttemptSilentGeolocation,
  writeLocationSuccess,
} from './festivalLocationHint.js';

const GEO_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 120_000,
};

/**
 * @param {object} p
 * @param {boolean} p.loading
 * @param {number} p.itemsLength
 * @param {boolean} p.hintDismissed
 * @param {(lat: number, lng: number, opts?: { boot?: boolean }) => boolean} p.applyUserLocation
 * @param {() => void} p.dismissLocHint
 * @param {Pick<Storage, 'getItem' | 'setItem'> | null} [p.storage]
 */
export function useFestivalLocationBoot({
  loading,
  itemsLength,
  hintDismissed,
  applyUserLocation,
  dismissLocHint,
  storage,
}) {
  const bootedRef = useRef(false);
  const storageRef =
    storage ??
    (typeof localStorage !== 'undefined' ? localStorage : null);

  useEffect(() => {
    if (loading || itemsLength === 0 || bootedRef.current) return undefined;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined;
    }

    let cancelled = false;
    bootedRef.current = true;

    const run = async () => {
      const recentSuccess = readLocationSuccess(storageRef);
      const permission = await queryGeolocationPermission();
      if (cancelled) return;

      if (recentSuccess) {
        applyUserLocation(recentSuccess.lat, recentSuccess.lng, { boot: true });
        dismissLocHint();
      }

      if (
        !shouldAttemptSilentGeolocation(
          permission,
          recentSuccess,
          hintDismissed,
        )
      ) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          writeLocationSuccess(storageRef, lat, lng);
          applyUserLocation(lat, lng, { boot: true });
          dismissLocHint();
        },
        (err) => {
          if (cancelled) return;
          if (err?.code === 1 && recentSuccess) {
            dismissLocHint();
          }
        },
        GEO_OPTIONS,
      );
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    loading,
    itemsLength,
    hintDismissed,
    applyUserLocation,
    dismissLocHint,
    storageRef,
  ]);
}

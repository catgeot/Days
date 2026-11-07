import { useEffect, useRef } from 'react';
import {
  clearLocationSuccess,
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
 * @param {(lat: number, lng: number, opts?: { boot?: boolean }) => boolean} p.applyUserLocation
 * @param {() => void} p.dismissLocHint
 * @param {() => boolean} [p.shouldApplyBootLocation]
 * @param {boolean} [p.skipBoot]
 * @param {Pick<Storage, 'getItem' | 'setItem'> | null} [p.storage]
 */
export function useFestivalLocationBoot({
  loading,
  itemsLength,
  applyUserLocation,
  dismissLocHint,
  shouldApplyBootLocation,
  skipBoot = false,
  storage,
}) {
  const bootedRef = useRef(false);
  const storageRef =
    storage ??
    (typeof localStorage !== 'undefined' ? localStorage : null);

  useEffect(() => {
    if (skipBoot || loading || itemsLength === 0 || bootedRef.current) return undefined;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined;
    }

    let cancelled = false;
    bootedRef.current = true;

    const canApply = () =>
      typeof shouldApplyBootLocation !== 'function' || shouldApplyBootLocation();

    const run = async () => {
      const recentSuccess = readLocationSuccess(storageRef);
      const permission = await queryGeolocationPermission();
      if (cancelled) return;

      if (recentSuccess && canApply()) {
        applyUserLocation(recentSuccess.lat, recentSuccess.lng, { boot: true });
        dismissLocHint();
      }

      if (!shouldAttemptSilentGeolocation(permission)) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled || !canApply()) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          writeLocationSuccess(storageRef, lat, lng);
          applyUserLocation(lat, lng, { boot: true });
          dismissLocHint();
        },
        (err) => {
          if (cancelled) return;
          if (err?.code === 1) {
            clearLocationSuccess(storageRef);
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
    applyUserLocation,
    dismissLocHint,
    shouldApplyBootLocation,
    skipBoot,
    storageRef,
  ]);
}

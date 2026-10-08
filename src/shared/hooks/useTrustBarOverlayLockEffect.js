import { useEffect } from 'react';
import { pushTrustBarOverlayLock } from '../lib/trustBarOverlayLock.js';

/** @param {boolean} active */
export function useTrustBarOverlayLockEffect(active) {
  useEffect(() => {
    if (!active) return undefined;
    return pushTrustBarOverlayLock();
  }, [active]);
}

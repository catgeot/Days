import { useEffect } from 'react';
import { pushGateoBodyScrollLock } from '../lib/gateoBodyScrollLock.js';

/** @param {boolean} active */
export function useGateoBodyScrollLockEffect(active) {
  useEffect(() => {
    if (!active) return undefined;
    return pushGateoBodyScrollLock();
  }, [active]);
}

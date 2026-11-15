import { lazy } from 'react';
import { trackLazyChunkLoad } from './staleBundleRecovery.js';

/**
 * Vite's preload helper preventDefault's vite:preloadError and then fulfills
 * the dynamic import with undefined. React.lazy stores that as a resolved
 * module and the next render throws reading `_result.default`
 * (WebKit: `y._result.default`), which unmounts the tree.
 * A missing default stays pending so Suspense holds and recovery can reload
 * or show the fallback without that throw.
 * @param {unknown} mod
 */
export function hasLazyDefault(mod) {
  return !!mod && (typeof mod === 'object' || typeof mod === 'function') && mod.default != null;
}

/**
 * @param {() => Promise<unknown>} loader
 * @returns {Promise<{ default: unknown }>}
 */
export function importLazyDefault(loader) {
  const tracked = Promise.resolve()
    .then(loader)
    .then((mod) => {
      if (hasLazyDefault(mod)) return mod;
      return new Promise(() => {});
    });
  trackLazyChunkLoad(tracked);
  return tracked;
}

/**
 * @param {() => Promise<unknown>} loader
 */
export function lazyDefault(loader) {
  return lazy(() => importLazyDefault(loader));
}

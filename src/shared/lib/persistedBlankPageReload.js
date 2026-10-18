const SESSION_RELOAD_GUARD_KEY = 'gateo:persisted-blank-reload-once';

/** @returns {boolean} */
export function isDocumentRootBlank() {
  if (typeof document === 'undefined') return false;
  const root = document.getElementById('root');
  if (root) return root.childElementCount === 0;
  return document.body?.childElementCount === 0;
}

/**
 * Safari bfcache: back from HTTP interstitial can restore a white document.
 * @param {PageTransitionEvent} event
 * @returns {boolean} true if reload was triggered
 */
export function maybeReloadBlankPersistedPage(event) {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return false;
  if (!event?.persisted) {
    try {
      if (!isDocumentRootBlank()) sessionStorage.removeItem(SESSION_RELOAD_GUARD_KEY);
    } catch {
      /* quota */
    }
    return false;
  }
  if (!isDocumentRootBlank()) return false;
  try {
    if (sessionStorage.getItem(SESSION_RELOAD_GUARD_KEY) === '1') return false;
    sessionStorage.setItem(SESSION_RELOAD_GUARD_KEY, '1');
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** @param {() => void} listener */
export function installPersistedBlankPageReload() {
  if (typeof window === 'undefined') return () => {};
  const onPageShow = (event) => {
    maybeReloadBlankPersistedPage(event);
  };
  window.addEventListener('pageshow', onPageShow);
  return () => window.removeEventListener('pageshow', onPageShow);
}

export const STALE_BUNDLE_RELOAD_COOLDOWN_MS = 30_000;
export const STALE_BUNDLE_GUARD_PREFIX = 'gateo:stale-bundle-reload:';

export function staleBundleGuardKey(bundleId) {
  return `${STALE_BUNDLE_GUARD_PREFIX}${bundleId}`;
}

/** @param {Document} [doc] */
export function getEntryBundleId(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return 'unknown';
  const scripts = doc.querySelectorAll('script[type="module"][src]');
  let fallback = 'unknown';
  for (const script of scripts) {
    const src = script.getAttribute('src') || '';
    if (src.includes('/assets/index-') || src.includes('/src/main')) {
      return src.split('?')[0];
    }
    if (src.includes('/assets/')) fallback = src.split('?')[0];
  }
  return fallback;
}

/**
 * @param {Storage} storage
 * @param {string} bundleId
 * @returns {{ at: number } | null}
 */
export function readStaleBundleReloadGuard(storage, bundleId) {
  try {
    const raw = storage.getItem(staleBundleGuardKey(bundleId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.at !== 'number') return null;
    return { at: parsed.at };
  } catch {
    return null;
  }
}

/**
 * @param {Storage} storage
 * @param {string} bundleId
 * @param {number} [now]
 */
export function markStaleBundleReloadAttempt(storage, bundleId, now = Date.now()) {
  storage.setItem(staleBundleGuardKey(bundleId), JSON.stringify({ at: now }));
}

/**
 * @param {Storage} storage
 * @param {string} bundleId
 */
export function clearStaleBundleReloadGuard(storage, bundleId) {
  try {
    storage.removeItem(staleBundleGuardKey(bundleId));
  } catch {
    /* quota */
  }
}

/**
 * @param {Storage} storage
 * @param {string} bundleId
 * @param {number} [now]
 * @returns {'reload' | 'fallback'}
 */
export function decideStaleBundleRecoveryAction(storage, bundleId, now = Date.now()) {
  const guard = readStaleBundleReloadGuard(storage, bundleId);
  if (!guard) return 'reload';
  if (now - guard.at < STALE_BUNDLE_RELOAD_COOLDOWN_MS) return 'fallback';
  return 'fallback';
}

/**
 * @param {Document} [doc]
 */
export function showStaleBundleFallback(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return;
  const existing = doc.getElementById('gateo-stale-bundle-fallback');
  if (existing) return;

  const root = doc.getElementById('root') || doc.body;
  const panel = doc.createElement('div');
  panel.id = 'gateo-stale-bundle-fallback';
  panel.setAttribute('role', 'alert');
  panel.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f172a;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;text-align:center;';
  panel.innerHTML = `
    <div style="max-width:320px;">
      <p style="margin:0 0 8px;font-size:17px;font-weight:600;line-height:1.4;">사이트가 업데이트됐어요</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;opacity:0.92;">새로고침하면 이어서 볼 수 있어요.</p>
      <button type="button" id="gateo-stale-bundle-fallback-btn" style="margin:0;padding:10px 18px;border:0;border-radius:999px;background:#38bdf8;color:#0f172a;font-size:15px;font-weight:600;cursor:pointer;">새로고침</button>
    </div>
  `;
  root.appendChild(panel);
  const btn = doc.getElementById('gateo-stale-bundle-fallback-btn');
  btn?.addEventListener('click', () => {
    if (typeof window !== 'undefined') window.location.reload();
  });
}

function isAssetScriptTarget(target) {
  if (!target || target.tagName !== 'SCRIPT') return false;
  const src = target.src || target.getAttribute?.('src') || '';
  return /\/assets\/[^/]+\.js(\?|$)/.test(src) || /\/src\/main\.jsx(\?|$)/.test(src);
}

function isChunkLoadMessage(message) {
  if (!message || typeof message !== 'string') return false;
  return (
    /Failed to fetch dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message)
    || /error loading dynamically imported module/i.test(message)
    || /Unable to preload CSS/i.test(message)
  );
}

/**
 * @param {unknown} reason
 * @param {Storage} storage
 * @param {string} bundleId
 * @param {{ reload?: () => void, now?: number }} [opts]
 * @returns {'reload' | 'fallback' | 'ignore'}
 */
export function handleStaleBundleLoadFailure(reason, storage, bundleId, opts = {}) {
  const reload = opts.reload ?? (() => {
    if (typeof window !== 'undefined') window.location.reload();
  });
  const now = opts.now ?? Date.now();
  const action = decideStaleBundleRecoveryAction(storage, bundleId, now);
  if (action === 'fallback') {
    if (typeof document !== 'undefined') showStaleBundleFallback(document);
    return 'fallback';
  }
  markStaleBundleReloadAttempt(storage, bundleId, now);
  reload();
  return 'reload';
}

/**
 * @param {{
 *   storage?: Storage,
 *   reload?: () => void,
 *   getBundleId?: () => string,
 * }} [opts]
 */
export function installStaleBundleRecovery(opts = {}) {
  if (typeof window === 'undefined') return () => {};
  const storage = opts.storage ?? window.sessionStorage;
  const getBundleId = opts.getBundleId ?? (() => getEntryBundleId(document));
  let handling = false;

  const onFailure = (reason) => {
    if (handling) return;
    handling = true;
    try {
      handleStaleBundleLoadFailure(reason, storage, getBundleId(), {
        reload: opts.reload,
      });
    } finally {
      handling = false;
    }
  };

  const onPreloadError = (event) => {
    event?.preventDefault?.();
    onFailure(event?.payload ?? event);
  };

  const onUnhandledRejection = (event) => {
    const reason = event?.reason;
    const message = reason?.message ?? String(reason ?? '');
    if (!isChunkLoadMessage(message)) return;
    event.preventDefault?.();
    onFailure(reason);
  };

  const onError = (event) => {
    if (!isAssetScriptTarget(event?.target)) return;
    onFailure(event.error ?? event.message);
  };

  window.addEventListener('vite:preloadError', onPreloadError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  window.addEventListener('error', onError, true);

  return () => {
    window.removeEventListener('vite:preloadError', onPreloadError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    window.removeEventListener('error', onError, true);
  };
}

/** Call after React root mounts successfully. */
export function notifyStaleBundleBootSuccess(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || typeof window === 'undefined') return;
  try {
    clearStaleBundleReloadGuard(window.sessionStorage, getEntryBundleId(doc));
  } catch {
    /* quota */
  }
}

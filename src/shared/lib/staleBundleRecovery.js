export const STALE_BUNDLE_RELOAD_COOLDOWN_MS = 30_000;
export const STALE_BUNDLE_BOOT_CLEAR_MS = 4_000;
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

  // React가 #root를 비워도 안내가 남게 body에 붙인다.
  const root = doc.body || doc.getElementById('root');
  if (!root) return;
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
 * WebKit emits vite:preloadError a few milliseconds after beforeunload when
 * location.assign aborts an in-flight import. The measured gap was ~10ms.
 * 2000ms covers that race, including a slow event loop, and still returns
 * recovery quickly when the document stays (tel:/mailto:, a download, or a
 * cancelled beforeunload prompt). An ignored signal is not replayed: at the
 * deadline a slow assign can still be this document, and reloading then would
 * cancel /place. The next failure after the window reloads.
 */
export const STALE_BUNDLE_LEAVE_WINDOW_MS = 2000;

let bootClearTimer = null;
let lazyPending = 0;
let lazyChunkSettled = false;

/** Tests only. */
export function resetLazyChunkTracking() {
  lazyPending = 0;
  lazyChunkSettled = false;
  cancelStaleBundleBootClear();
}

/**
 * A lazy import that never settles (Vite preventDefault → undefined module)
 * must not clear the one-reload guard. Clearing on root mount made a failed
 * place chunk reload /place forever.
 * @param {Promise<unknown>} promise
 * @param {Parameters<typeof scheduleStaleBundleBootClear>[0]} [opts]
 */
export function trackLazyChunkLoad(promise, opts = {}) {
  lazyPending += 1;
  cancelStaleBundleBootClear();
  let settled = false;
  const finish = (ok) => {
    if (settled) return;
    settled = true;
    lazyPending = Math.max(0, lazyPending - 1);
    if (!ok || lazyPending > 0) return;
    lazyChunkSettled = true;
    scheduleStaleBundleBootClear(opts);
  };
  Promise.resolve(promise).then(() => finish(true), () => finish(false));
}

/**
 * Root mount is not "the place chunk loaded". Clearing the reload guard there
 * makes a failed lazy route reload forever: boot clears the guard, the chunk
 * fails, we reload, boot clears it again.
 * @param {{
 *   storage?: Storage,
 *   bundleId?: string,
 *   doc?: Document | null,
 *   delayMs?: number,
 *   schedule?: (ms: number, fn: () => void) => unknown,
 *   cancel?: (id: unknown) => void,
 * }} [opts]
 */
export function scheduleStaleBundleBootClear(opts = {}) {
  const doc = opts.doc ?? (typeof document !== 'undefined' ? document : null);
  const storage = opts.storage ?? (typeof window !== 'undefined' ? window.sessionStorage : null);
  if (!storage) return;
  const bundleId = opts.bundleId ?? getEntryBundleId(doc);
  const delayMs = opts.delayMs ?? STALE_BUNDLE_BOOT_CLEAR_MS;
  const schedule = opts.schedule ?? ((ms, fn) => setTimeout(fn, ms));
  const cancel = opts.cancel ?? ((id) => clearTimeout(id));
  if (bootClearTimer) cancel(bootClearTimer.id);
  const id = schedule(delayMs, () => {
    bootClearTimer = null;
    clearStaleBundleReloadGuard(storage, bundleId);
  });
  bootClearTimer = { id, cancel };
}

export function cancelStaleBundleBootClear() {
  if (!bootClearTimer) return;
  bootClearTimer.cancel(bootClearTimer.id);
  bootClearTimer = null;
}

/**
 * @param {{ now?: number, leavingUntil?: number }} [signal]
 */
export function shouldIgnoreStaleBundleSignal(signal = {}) {
  const until = signal.leavingUntil;
  if (typeof until !== 'number' || until <= 0) return false;
  const at = typeof signal.now === 'number' ? signal.now : 0;
  return at < until;
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
  const target = opts.window ?? (typeof window !== 'undefined' ? window : undefined);
  if (!target || typeof target.addEventListener !== 'function') return () => {};
  const storage = opts.storage ?? target.sessionStorage;
  const getBundleId = opts.getBundleId ?? (() => getEntryBundleId(target.document));
  const now = opts.now ?? (() => Date.now());
  const schedule = opts.schedule ?? ((ms, fn) => target.setTimeout(fn, ms));
  const cancelTimer = opts.cancel ?? ((id) => target.clearTimeout(id));
  let handling = false;
  let leavingUntil = 0;
  let leaveTimer = null;

  const clearLeave = () => {
    leavingUntil = 0;
    if (leaveTimer != null) {
      cancelTimer(leaveTimer);
      leaveTimer = null;
    }
  };

  const armLeave = () => {
    leavingUntil = now() + STALE_BUNDLE_LEAVE_WINDOW_MS;
    if (leaveTimer != null) cancelTimer(leaveTimer);
    leaveTimer = schedule(STALE_BUNDLE_LEAVE_WINDOW_MS, () => {
      leaveTimer = null;
      leavingUntil = 0;
    });
  };

  const onFailure = (reason) => {
    if (shouldIgnoreStaleBundleSignal({ now: now(), leavingUntil })) return;
    // A chunk failed before the boot grace elapsed. Keep the one-reload guard.
    cancelStaleBundleBootClear();
    if (handling) return;
    handling = true;
    try {
      handleStaleBundleLoadFailure(reason, storage, getBundleId(), {
        reload: opts.reload,
        now: now(),
      });
    } finally {
      handling = false;
    }
  };

  // Vite 7 rethrows inside __vitePreload when this event is not cancelled, and
  // fulfills the import with undefined when it is. React.lazy then reads
  // _result.default and WebKit reports y._result.default. lazyDefault keeps that
  // undefined fulfillment pending. Cancel here and reload ourselves outside the
  // leave window so an abort during assign does not bounce /explore.
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

  target.addEventListener('beforeunload', armLeave, true);
  target.addEventListener('pageshow', clearLeave, true);
  target.addEventListener('vite:preloadError', onPreloadError);
  target.addEventListener('unhandledrejection', onUnhandledRejection);
  target.addEventListener('error', onError, true);

  return () => {
    clearLeave();
    target.removeEventListener('beforeunload', armLeave, true);
    target.removeEventListener('pageshow', clearLeave, true);
    target.removeEventListener('vite:preloadError', onPreloadError);
    target.removeEventListener('unhandledrejection', onUnhandledRejection);
    target.removeEventListener('error', onError, true);
  };
}

/** Call after React root mounts. The guard stays until tracked lazy chunks settle. */
export function notifyStaleBundleBootSuccess(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || typeof window === 'undefined') return;
  if (lazyPending > 0 || !lazyChunkSettled) return;
  try {
    scheduleStaleBundleBootClear({ doc, storage: window.sessionStorage });
  } catch {
    /* quota */
  }
}

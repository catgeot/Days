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

export const STALE_BUNDLE_BANNER_EVENT = 'gateo:stale-bundle-banner';

/**
 * Same-origin path + query. External or unparseable URLs are not navigation targets.
 * @param {string} url
 * @param {string} [baseHref]
 * @returns {string}
 */
export function canonicalAppTarget(url, baseHref = 'http://localhost/') {
  try {
    const base = new URL(baseHref);
    const parsed = new URL(String(url || ''), base);
    if (parsed.origin !== base.origin) return '';
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return '';
  }
}

/** @param {string} bundleId @param {string} target */
export function staleBundleAssignGuardId(bundleId, target) {
  return `${bundleId}|${target}`;
}

/** Pathname only. Query edits on the open screen are not a new document. */
export function appPathname(canon) {
  const value = String(canon || '');
  const q = value.indexOf('?');
  return q === -1 ? value : value.slice(0, q);
}

/**
 * Open tab (no target) shows the update banner. A navigation target is hard-loaded
 * once per bundle id + target; a repeated failure shows the banner instead of looping.
 * @param {Storage} storage
 * @param {string} bundleId
 * @param {number} [now]
 * @param {{ target?: string }} [opts]
 * @returns {'banner' | 'assign' | 'fallback'}
 */
export function decideStaleBundleRecoveryAction(storage, bundleId, now = Date.now(), opts = {}) {
  const target = String(opts?.target || '');
  if (!target) return 'banner';
  const guard = readStaleBundleReloadGuard(storage, staleBundleAssignGuardId(bundleId, target));
  if (!guard) return 'assign';
  if (now - guard.at < STALE_BUNDLE_RELOAD_COOLDOWN_MS) return 'fallback';
  return 'fallback';
}

/**
 * @param {Window | null | undefined} [win]
 */
export function requestStaleBundleBanner(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return;
  win.__GATEO_STALE_BUNDLE_BANNER__ = true;
  win.dispatchEvent?.(new Event(STALE_BUNDLE_BANNER_EVENT));
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
 * WebKit emits vite:preloadError a few milliseconds after pagehide when
 * a real document navigation aborts an in-flight import. The measured gap was ~10ms.
 * 2000ms covers that race. pagehide / visibility hidden arm this window so
 * bfcache is not blocked by beforeunload. An ignored signal is not replayed.
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
 * @param {Document | null | undefined} [doc]
 */
export function presentStaleBundleRecoveryUi(doc = typeof document !== 'undefined' ? document : null) {
  const win = doc?.defaultView || (typeof window !== 'undefined' ? window : null);
  requestStaleBundleBanner(win);
  if (doc && isRecoveryDocumentBlank(doc)) showStaleBundleFallback(doc);
}

function isRecoveryDocumentBlank(doc) {
  const root = doc.getElementById?.('root');
  if (root) return root.childElementCount === 0;
  return (doc.body?.childElementCount ?? 0) === 0;
}

/**
 * @param {unknown} reason
 * @param {Storage} storage
 * @param {string} bundleId
 * @param {{ assign?: (url: string) => void, showBanner?: () => void, now?: number, target?: string }} [opts]
 * @returns {'banner' | 'assign' | 'fallback'}
 */
export function handleStaleBundleLoadFailure(reason, storage, bundleId, opts = {}) {
  const now = opts.now ?? Date.now();
  const target = String(opts.target || '');
  const action = decideStaleBundleRecoveryAction(storage, bundleId, now, { target });
  if (action === 'assign') {
    markStaleBundleReloadAttempt(storage, staleBundleAssignGuardId(bundleId, target), now);
    const assign = opts.assign ?? ((url) => {
      if (typeof window !== 'undefined') window.location.assign(url);
    });
    assign(target);
    return 'assign';
  }
  const showBanner = opts.showBanner ?? (() => presentStaleBundleRecoveryUi());
  showBanner();
  return action;
}

/**
 * @param {{
 *   storage?: Storage,
 *   assign?: (url: string) => void,
 *   showBanner?: () => void,
 *   getBundleId?: () => string,
 *   getNavTarget?: () => string,
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
  const bootHref = target.location?.href || 'http://localhost/';
  const bootPath = canonicalAppTarget(bootHref, bootHref);
  let herePath = appPathname(bootPath);
  let pendingTarget = '';
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

  // Festival chips and other in-page filters use replaceState on the same pathname.
  // That must not become an assign target. Only a pathname change (pushState,
  // popstate, or a link click) hard-loads the next screen.
  const rememberPathChange = (url, base) => {
    const canon = canonicalAppTarget(url, base || target.location?.href || bootHref);
    const nextPath = appPathname(canon);
    if (!canon || !nextPath || nextPath === herePath) return '';
    herePath = nextPath;
    pendingTarget = canon;
    return canon;
  };

  const noteSameDocumentUrl = (url, base) => {
    const canon = canonicalAppTarget(url, base || target.location?.href || bootHref);
    const nextPath = appPathname(canon);
    if (nextPath && nextPath !== herePath) herePath = nextPath;
  };

  const resolveTarget = () => {
    if (typeof opts.getNavTarget === 'function') {
      const forced = canonicalAppTarget(opts.getNavTarget() || '', bootHref);
      if (forced) return forced;
    }
    return pendingTarget;
  };

  const onFailure = (reason) => {
    if (shouldIgnoreStaleBundleSignal({ now: now(), leavingUntil })) return;
    // A chunk failed before the boot grace elapsed. Keep the one-shot assign guard.
    cancelStaleBundleBootClear();
    if (handling) return;
    handling = true;
    try {
      handleStaleBundleLoadFailure(reason, storage, getBundleId(), {
        assign: opts.assign,
        showBanner: opts.showBanner,
        target: resolveTarget(),
        now: now(),
      });
    } finally {
      handling = false;
    }
  };

  const onPageShow = () => {
    clearLeave();
    pendingTarget = '';
    const landed = canonicalAppTarget(target.location?.href || bootHref, bootHref);
    const landedPath = appPathname(landed);
    if (landedPath) herePath = landedPath;
  };

  const onVisibility = () => {
    const state = typeof opts.getVisibilityState === 'function'
      ? opts.getVisibilityState()
      : target.document?.visibilityState;
    if (state === 'hidden') armLeave();
    else if (state === 'visible') clearLeave();
  };

  const onClick = (event) => {
    if (!event || event.defaultPrevented || event.button) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const node = event.target?.closest?.('a[href]');
    if (!node || node.target === '_blank' || node.hasAttribute?.('download')) return;
    rememberPathChange(node.href || node.getAttribute?.('href') || '', target.location?.href || bootHref);
  };

  const onPopState = () => {
    rememberPathChange(target.location?.href || '', bootHref);
  };

  const history = target.history;
  const originalPush = history?.pushState;
  const originalReplace = history?.replaceState;
  if (history && typeof originalPush === 'function' && !history.__gateoStaleNav) {
    history.__gateoStaleNav = true;
    history.pushState = function pushState(state, title, url) {
      const base = target.location?.href || bootHref;
      if (url != null) rememberPathChange(url, base);
      return originalPush.apply(this, arguments);
    };
    if (typeof originalReplace === 'function') {
      history.replaceState = function replaceState(state, title, url) {
        const base = target.location?.href || bootHref;
        const result = originalReplace.apply(this, arguments);
        if (url != null) noteSameDocumentUrl(url, base);
        return result;
      };
    }
  }

  // Vite 7 rethrows inside __vitePreload when this event is not cancelled, and
  // fulfills the import with undefined when it is. React.lazy then reads
  // _result.default and WebKit reports y._result.default. lazyDefault keeps that
  // undefined fulfillment pending. Cancel here. An open tab shows the update
  // banner; a navigation whose chunk 404s hard-loads that target once.
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

  const doc = target.document;
  target.addEventListener('pagehide', armLeave, true);
  target.addEventListener('pageshow', onPageShow, true);
  target.addEventListener('visibilitychange', onVisibility, true);
  target.addEventListener('popstate', onPopState);
  if (doc?.addEventListener) doc.addEventListener('click', onClick, true);
  target.addEventListener('vite:preloadError', onPreloadError);
  target.addEventListener('unhandledrejection', onUnhandledRejection);
  target.addEventListener('error', onError, true);

  return () => {
    clearLeave();
    target.removeEventListener('pagehide', armLeave, true);
    target.removeEventListener('pageshow', onPageShow, true);
    target.removeEventListener('visibilitychange', onVisibility, true);
    target.removeEventListener('popstate', onPopState);
    if (doc?.removeEventListener) doc.removeEventListener('click', onClick, true);
    target.removeEventListener('vite:preloadError', onPreloadError);
    target.removeEventListener('unhandledrejection', onUnhandledRejection);
    target.removeEventListener('error', onError, true);
    if (history && originalPush && history.pushState !== originalPush) {
      history.pushState = originalPush;
      if (originalReplace) history.replaceState = originalReplace;
      delete history.__gateoStaleNav;
    }
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

const RESTORE_READY_TIMEOUT_MS = 1000;
const USER_INTENT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

function isInteractiveEventTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [contenteditable="true"]',
    ),
  );
}

function clampScrollTop(el, targetTop) {
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollTop = Math.max(0, Math.min(targetTop, maxTop));
}

function scrollCanFitTarget(el, targetTop) {
  if (!el || typeof el.scrollHeight !== 'number') return true;
  if (typeof targetTop !== 'number' || targetTop <= 0) return true;
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  return maxTop + 1 >= targetTop;
}

/**
 * @param {HTMLElement | null} mainEl
 * @param {number} targetScrollTop
 * @param {{ onSuccess?: () => void; onFinalize?: () => void }} [options]
 * @returns {() => void} cancel (user input, timeout, unmount)
 */
export function restoreLogbookMainScrollWhenReady(mainEl, targetScrollTop, options = {}) {
  const onSuccess = options.onSuccess;
  const onFinalize = options.onFinalize;
  const canScroll =
    mainEl &&
    typeof mainEl.scrollTop === 'number' &&
    typeof mainEl.addEventListener === 'function';
  if (!canScroll || !Number.isFinite(targetScrollTop) || targetScrollTop <= 0) {
    onFinalize?.();
    return () => {};
  }

  const started = performance.now();
  let ro;
  let done = false;
  let applying = false;
  let ignoreScrollUntil = 0;
  let userIntentListenersActive = false;

  const removeListeners = () => {
    mainEl.removeEventListener('scroll', onScroll, true);
    if (typeof window !== 'undefined' && userIntentListenersActive) {
      for (const type of USER_INTENT_EVENTS) {
        window.removeEventListener(type, onUserIntent, true);
      }
      userIntentListenersActive = false;
    }
  };

  const finalize = () => {
    if (done) return;
    done = true;
    ro?.disconnect();
    removeListeners();
    onFinalize?.();
  };

  const abort = () => {
    finalize();
  };

  const finish = () => {
    if (done) return;
    applyRestore();
    requestAnimationFrame(() => {
      applyRestore();
      if (done) return;
      done = true;
      ro?.disconnect();
      removeListeners();
      onSuccess?.();
      onFinalize?.();
    });
  };

  const onUserIntent = (event) => {
    if (applying) return;
    if (event?.type === 'pointerdown' || event?.type === 'touchstart') {
      if (isInteractiveEventTarget(event.target)) return;
    }
    abort();
  };

  const onScroll = () => {
    if (applying || performance.now() < ignoreScrollUntil) return;
    abort();
  };

  const applyRestore = () => {
    applying = true;
    ignoreScrollUntil = performance.now() + 48;
    clampScrollTop(mainEl, targetScrollTop);
    requestAnimationFrame(() => {
      applying = false;
    });
  };

  const enableUserIntentListeners = () => {
    if (userIntentListenersActive || done || typeof window === 'undefined') return;
    userIntentListenersActive = true;
    for (const type of USER_INTENT_EVENTS) {
      window.addEventListener(type, onUserIntent, { capture: true, passive: true });
    }
  };

  const attempt = () => {
    if (done) return;
    if (scrollCanFitTarget(mainEl, targetScrollTop)) {
      finish();
      return;
    }
    if (performance.now() - started >= RESTORE_READY_TIMEOUT_MS) {
      abort();
      return;
    }
    requestAnimationFrame(attempt);
  };

  mainEl.addEventListener('scroll', onScroll, { capture: true, passive: true });
  requestAnimationFrame(() => {
    requestAnimationFrame(enableUserIntentListeners);
  });

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      if (done) return;
      if (scrollCanFitTarget(mainEl, targetScrollTop)) finish();
    });
    ro.observe(mainEl);
  }

  requestAnimationFrame(attempt);

  return abort;
}

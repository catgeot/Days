/** @param {Element | null | undefined} el */
export function clearLogbookHubScrollRestored(el) {
  if (!el || !(el instanceof HTMLElement)) return;
  delete el.dataset.logbookHubScrollRestored;
  delete el.dataset.logbookHubScrollTarget;
}

/**
 * @param {Element | null | undefined} el
 * @param {number} targetY
 */
export function applyLogbookHubScrollRestore(el, targetY) {
  if (!el || !(el instanceof HTMLElement) || !Number.isFinite(targetY)) return false;
  if (Math.abs(el.scrollTop - targetY) >= 6) {
    el.scrollTop = targetY;
  }
  const closeEnough = Math.abs(el.scrollTop - targetY) < 6;
  if (closeEnough) {
    el.dataset.logbookHubScrollRestored = '1';
    el.dataset.logbookHubScrollTarget = String(Math.round(targetY));
  }
  return closeEnough;
}

/**
 * Polls + bfcache/scroll tail for hub return scroll (DailyLayout main scroller).
 * @param {HTMLElement} el
 * @param {number} targetY
 * @returns {() => void}
 */
export function scheduleLogbookHubScrollRestore(el, targetY) {
  let cancelled = false;
  let ticks = 0;
  let tailTimer = null;

  const tryRestore = () => {
    if (cancelled) return;
    if (applyLogbookHubScrollRestore(el, targetY)) return;
    ticks += 1;
    if (ticks < 80) window.setTimeout(tryRestore, 100);
  };

  const onTransient = () => {
    if (cancelled) return;
    applyLogbookHubScrollRestore(el, targetY);
  };

  requestAnimationFrame(tryRestore);
  window.addEventListener('pageshow', onTransient);
  el.addEventListener('scroll', onTransient, { passive: true });
  tailTimer = window.setInterval(onTransient, 250);
  window.setTimeout(() => {
    if (tailTimer != null) window.clearInterval(tailTimer);
  }, 6_000);

  return () => {
    cancelled = true;
    if (tailTimer != null) window.clearInterval(tailTimer);
    window.removeEventListener('pageshow', onTransient);
    el.removeEventListener('scroll', onTransient);
  };
}
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
  el.scrollTop = targetY;
  const closeEnough = Math.abs(el.scrollTop - targetY) < 6;
  if (closeEnough) {
    el.dataset.logbookHubScrollRestored = '1';
    el.dataset.logbookHubScrollTarget = String(Math.round(targetY));
  }
  return closeEnough;
}
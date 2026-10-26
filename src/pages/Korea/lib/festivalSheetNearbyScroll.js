/**
 * After nearby load-more, the sheet may shift scrollTop when rows mount (scroll anchoring).
 * @param {number | null | undefined} plannedScrollTop
 * @param {number} measuredScrollTop
 */
export function resolveFestivalNearbyLoadMoreScrollTop(plannedScrollTop, measuredScrollTop) {
  if (plannedScrollTop == null || !Number.isFinite(plannedScrollTop)) {
    return measuredScrollTop;
  }
  return plannedScrollTop;
}

/** @param {number} planned @param {number} current @param {number} tolerancePx */
export function nearbyLoadMoreScrollWithinTolerance(planned, current, tolerancePx = 20) {
  if (!Number.isFinite(planned) || !Number.isFinite(current)) return false;
  return Math.abs(current - planned) <= tolerancePx;
}

/**
 * @param {number} planned
 * @param {number} currentScrollTop
 * @param {number} consecutiveStableFrames
 * @param {number} [requiredStableFrames]
 */
export function shouldEndNearbyLoadMoreScrollPin(
  planned,
  currentScrollTop,
  consecutiveStableFrames,
  requiredStableFrames = 5,
) {
  return (
    nearbyLoadMoreScrollWithinTolerance(planned, currentScrollTop, 2) &&
    consecutiveStableFrames >= requiredStableFrames
  );
}

/** @param {string} key */
export function isNearbyLoadMoreScrollPinInterruptKey(key) {
  return (
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'PageUp' ||
    key === 'PageDown' ||
    key === 'Home' ||
    key === 'End' ||
    key === ' ' ||
    key === 'Spacebar'
  );
}

/**
 * @param {HTMLElement} sheet
 * @param {() => void} release
 * @param {{ graceMs?: number, ignoreFromSelector?: string, startedAt?: number }} [opts]
 * @returns {() => void} detach
 */
export function attachNearbyLoadMoreScrollPinUserRelease(sheet, release, opts = {}) {
  const graceMs = opts.graceMs ?? 220;
  const ignoreFromSelector = opts.ignoreFromSelector ?? '[data-festival-near-scenic-more]';
  const startedAt = opts.startedAt ?? performance.now();
  const passive = { passive: true, capture: true };
  const shouldIgnoreEvent = (event) => {
    if (performance.now() - startedAt < graceMs) return true;
    const target = event?.target;
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(ignoreFromSelector));
  };
  const onUserIntent = (event) => {
    if (shouldIgnoreEvent(event)) return;
    release();
  };
  const onKey = (event) => {
    if (isNearbyLoadMoreScrollPinInterruptKey(event.key)) release();
  };

  sheet.addEventListener('wheel', onUserIntent, passive);
  sheet.addEventListener('touchstart', onUserIntent, passive);
  sheet.addEventListener('touchmove', onUserIntent, passive);
  sheet.addEventListener('pointerdown', onUserIntent, passive);
  sheet.addEventListener('keydown', onKey, true);

  return () => {
    sheet.removeEventListener('wheel', onUserIntent, passive);
    sheet.removeEventListener('touchstart', onUserIntent, passive);
    sheet.removeEventListener('touchmove', onUserIntent, passive);
    sheet.removeEventListener('pointerdown', onUserIntent, passive);
    sheet.removeEventListener('keydown', onKey, true);
  };
}

/**
 * @param {number} rowTop
 * @param {number} sheetTop
 */
export function captureNearbyListRowAnchorDelta(rowTop, sheetTop) {
  return rowTop - sheetTop;
}

/**
 * @param {number} rowTop
 * @param {number} sheetTop
 * @param {number} anchorDelta
 */
export function nearbyListRowAnchorDrift(rowTop, sheetTop, anchorDelta) {
  return rowTop - sheetTop - anchorDelta;
}

/**
 * @param {number} plannedScrollTop
 * @param {number | null} anchorDelta
 * @param {number} rowTop
 * @param {number} sheetTop
 */
export function computeNearbyLoadMorePinnedScrollTop(
  plannedScrollTop,
  anchorDelta,
  rowTop,
  sheetTop,
) {
  if (anchorDelta == null || !Number.isFinite(anchorDelta)) {
    return resolveFestivalNearbyLoadMoreScrollTop(plannedScrollTop, plannedScrollTop);
  }
  return plannedScrollTop + nearbyListRowAnchorDrift(rowTop, sheetTop, anchorDelta);
}

/**
 * @param {number} plannedScrollTop
 * @param {number} scrollHeightAtPin
 * @param {number} currentScrollHeight
 * @param {number} currentScrollTop
 */
export function correctNearbyLoadMoreScrollTopForHeightGrowth(
  plannedScrollTop,
  scrollHeightAtPin,
  currentScrollHeight,
  currentScrollTop,
) {
  if (!Number.isFinite(scrollHeightAtPin) || scrollHeightAtPin <= 0) {
    return plannedScrollTop;
  }
  const growth = currentScrollHeight - scrollHeightAtPin;
  if (growth <= 0) return plannedScrollTop;
  if (Math.abs(currentScrollTop - (plannedScrollTop + growth)) <= 64) {
    return plannedScrollTop;
  }
  return plannedScrollTop;
}

/**
 * @param {HTMLElement} sheet
 * @returns {{ anchorKey: string, anchorDelta: number } | null}
 */
export function captureNearbyLoadMoreScrollAnchor(sheet) {
  if (!sheet) return null;
  const list = sheet.querySelector('[data-nearby-list]');
  if (!(list instanceof HTMLElement)) return null;
  const sheetRect = sheet.getBoundingClientRect();
  const rows = list.querySelectorAll('[data-nearby-attraction-row]');
  let picked = null;
  for (const row of rows) {
    if (!(row instanceof HTMLElement)) continue;
    const rect = row.getBoundingClientRect();
    if (rect.bottom <= sheetRect.top + 4) continue;
    if (rect.top >= sheetRect.bottom - 4) continue;
    const anchorKey = row.getAttribute('data-nearby-row-key')?.trim() || '';
    if (!anchorKey) continue;
    picked = {
      anchorKey,
      anchorDelta: captureNearbyListRowAnchorDelta(rect.top, sheetRect.top),
    };
  }
  return picked;
}

/**
 * @param {HTMLElement} sheet
 * @param {string} anchorKey
 * @returns {HTMLElement | null}
 */
export function findNearbyListAnchorRow(sheet, anchorKey) {
  if (!sheet || !anchorKey) return null;
  const row = sheet.querySelector(
    `[data-nearby-list] [data-nearby-attraction-row][data-nearby-row-key="${CSS.escape(anchorKey)}"]`,
  );
  return row instanceof HTMLElement ? row : null;
}

/**
 * @param {HTMLElement} sheet
 * @param {number} plannedScrollTop
 * @param {{ anchorKey?: string, anchorDelta?: number | null, scrollHeightAtPin?: number }} [pin]
 */
export function resolveNearbyLoadMorePinTargetScrollTop(sheet, plannedScrollTop, pin = {}) {
  const { anchorKey = '', anchorDelta = null, scrollHeightAtPin = 0 } = pin;
  let target = correctNearbyLoadMoreScrollTopForHeightGrowth(
    plannedScrollTop,
    scrollHeightAtPin,
    sheet.scrollHeight,
    sheet.scrollTop,
  );
  if (anchorDelta == null || !Number.isFinite(anchorDelta)) {
    return target;
  }
  const row = findNearbyListAnchorRow(sheet, anchorKey);
  if (!row) return target;
  const sheetRect = sheet.getBoundingClientRect();
  const rowTarget = computeNearbyLoadMorePinnedScrollTop(
    plannedScrollTop,
    anchorDelta,
    row.getBoundingClientRect().top,
    sheetRect.top,
  );
  if (Math.abs(rowTarget - plannedScrollTop) > 2) {
    target = rowTarget;
  }
  return target;
}

/**
 * Brief layout pin (browser only). Ends on user scroll intent, stable frames, or timeout.
 * Does not listen to `scroll` — user wheel/touch must not be fought.
 * @param {HTMLElement} sheet
 * @param {number} plannedScrollTop
 * @param {{ maxMs?: number, scrollHeightAtPin?: number, anchorKey?: string, anchorDelta?: number | null, onEnd?: (ok: boolean) => void }} [opts]
 * @returns {() => void} cancel
 */
export function startNearbyLoadMoreScrollPin(sheet, plannedScrollTop, opts = {}) {
  const maxMs = opts.maxMs ?? 1200;
  const pin = {
    anchorKey: opts.anchorKey ?? '',
    anchorDelta: opts.anchorDelta ?? null,
    scrollHeightAtPin: opts.scrollHeightAtPin ?? sheet.scrollHeight,
  };
  const start = performance.now();
  let rafId = 0;
  let timeoutId = 0;
  let cancelled = false;
  let stableFrames = 0;
  let detachUserRelease = () => {};

  const targetScrollTop = () =>
    resolveNearbyLoadMorePinTargetScrollTop(sheet, plannedScrollTop, pin);

  const apply = () => {
    if (cancelled || !sheet) return;
    sheet.scrollTop = targetScrollTop();
  };

  const finish = (ok) => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    clearTimeout(timeoutId);
    ro?.disconnect();
    detachUserRelease();
    opts.onEnd?.(ok);
  };

  const releaseFromUser = () => finish(false);
  const pinStartedAt = performance.now();

  detachUserRelease = attachNearbyLoadMoreScrollPinUserRelease(sheet, releaseFromUser, {
    startedAt: pinStartedAt,
  });

  const tick = () => {
    if (cancelled) return;
    apply();
    const target = targetScrollTop();
    if (shouldEndNearbyLoadMoreScrollPin(target, sheet.scrollTop, stableFrames)) {
      finish(nearbyLoadMoreScrollWithinTolerance(target, sheet.scrollTop, 20));
      return;
    }
    if (nearbyLoadMoreScrollWithinTolerance(target, sheet.scrollTop, 2)) {
      stableFrames += 1;
    } else {
      stableFrames = 0;
    }
    if (performance.now() - start > maxMs) {
      finish(nearbyLoadMoreScrollWithinTolerance(target, sheet.scrollTop, 20));
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  apply();
  rafId = requestAnimationFrame(tick);

  const list = sheet.querySelector('[data-nearby-list]');
  let ro = null;
  if (list instanceof HTMLElement) {
    ro = new ResizeObserver(() => {
      if (cancelled) return;
      stableFrames = 0;
      apply();
    });
    ro.observe(list);
  }

  const onImageLoad = () => {
    if (cancelled) return;
    stableFrames = 0;
    apply();
  };
  if (list instanceof HTMLElement) {
    for (const img of list.querySelectorAll('img')) {
      if (!(img instanceof HTMLImageElement)) continue;
      if (!img.complete) img.addEventListener('load', onImageLoad, { once: true });
    }
  }

  timeoutId = window.setTimeout(() => {
    if (cancelled) return;
    apply();
    const target = targetScrollTop();
    finish(nearbyLoadMoreScrollWithinTolerance(target, sheet.scrollTop, 20));
  }, maxMs);

  return () => finish(false);
}

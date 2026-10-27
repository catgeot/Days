/**
 * Festival hub list scroll — mobile scrolls `<main>`, md+ scrolls `[data-festival-list-scroll]`.
 */

export function getFestivalHubListScrollContainers(mainEl) {
  if (!(mainEl instanceof HTMLElement)) return [];
  const listPane = mainEl.querySelector('[data-festival-list-scroll]');
  const md =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const primary =
    md && listPane instanceof HTMLElement ? listPane : mainEl;
  const set = new Set([primary]);
  if (listPane instanceof HTMLElement && listPane !== primary) set.add(listPane);
  if (mainEl !== primary) set.add(mainEl);
  return [...set];
}

function clampScrollToTop(el) {
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollTop = Math.min(el.scrollTop, maxTop);
  el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  el.scrollTop = 0;
}

function resetNestedScrollTops(root) {
  if (!(root instanceof HTMLElement)) return;
  root.querySelectorAll('[data-festival-list-scroll]').forEach((node) => {
    if (node instanceof HTMLElement && node.scrollTop > 0) node.scrollTop = 0;
  });
}

export function readFestivalHubListScrollOffsets(mainEl) {
  return getFestivalHubListScrollContainers(mainEl).map((el) => el.scrollTop);
}

export function restoreFestivalHubListScrollOffsets(mainEl, tops) {
  if (!tops?.length) return;
  const containers = getFestivalHubListScrollContainers(mainEl);
  containers.forEach((el, i) => {
    const top = tops[i];
    if (typeof top !== 'number') return;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollTop = Math.max(0, Math.min(top, maxTop));
  });
}

const RESTORE_READY_TIMEOUT_MS = 1000;

function isInteractiveEventTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [contenteditable="true"]',
    ),
  );
}

function listScrollCanFitTarget(el, targetTop) {
  if (!(el instanceof HTMLElement)) return true;
  if (typeof targetTop !== 'number' || targetTop <= 0) return true;
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  return maxTop + 1 >= targetTop;
}

function hubListScrollTargetsReady(mainEl, tops) {
  const containers = getFestivalHubListScrollContainers(mainEl);
  return containers.every((el, i) => listScrollCanFitTarget(el, tops[i]));
}

function restoreFestivalHubListScrollWhenReady(mainEl, tops) {
  if (!tops?.length || !(mainEl instanceof HTMLElement)) return () => {};

  const started = performance.now();
  let ro;
  let done = false;
  let applying = false;
  let ignoreScrollUntil = 0;

  let userIntentListenersActive = false;

  const removeListeners = () => {
    for (const el of getFestivalHubListScrollContainers(mainEl)) {
      el.removeEventListener('scroll', onScroll, true);
    }
    if (typeof window !== 'undefined' && userIntentListenersActive) {
      window.removeEventListener('wheel', onUserIntent, true);
      window.removeEventListener('touchstart', onUserIntent, true);
      window.removeEventListener('pointerdown', onUserIntent, true);
      window.removeEventListener('keydown', onUserIntent, true);
      userIntentListenersActive = false;
    }
  };

  const enableUserIntentListeners = () => {
    if (userIntentListenersActive || done || typeof window === 'undefined') return;
    userIntentListenersActive = true;
    window.addEventListener('wheel', onUserIntent, { capture: true, passive: true });
    window.addEventListener('touchstart', onUserIntent, { capture: true, passive: true });
    window.addEventListener('pointerdown', onUserIntent, { capture: true, passive: true });
    window.addEventListener('keydown', onUserIntent, { capture: true, passive: true });
  };

  const abort = () => {
    if (done) return;
    done = true;
    ro?.disconnect();
    removeListeners();
  };

  const finish = () => {
    if (done) return;
    done = true;
    ro?.disconnect();
    removeListeners();
    applyRestore();
    requestAnimationFrame(() => applyRestore());
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
    restoreFestivalHubListScrollOffsets(mainEl, tops);
    requestAnimationFrame(() => {
      applying = false;
    });
  };

  const attempt = () => {
    if (done) return;
    if (hubListScrollTargetsReady(mainEl, tops)) {
      finish();
      return;
    }
    if (performance.now() - started >= RESTORE_READY_TIMEOUT_MS) {
      abort();
      return;
    }
    requestAnimationFrame(attempt);
  };

  for (const el of getFestivalHubListScrollContainers(mainEl)) {
    el.addEventListener('scroll', onScroll, { capture: true, passive: true });
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(enableUserIntentListeners);
  });

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      if (done) return;
      if (hubListScrollTargetsReady(mainEl, tops)) finish();
    });
    for (const el of getFestivalHubListScrollContainers(mainEl)) {
      ro.observe(el);
    }
  }

  requestAnimationFrame(attempt);

  return abort;
}

export function scrollFestivalHubListToTop(mainEl) {
  const containers = getFestivalHubListScrollContainers(mainEl);
  if (!containers.length) return;

  const run = () => {
    for (const el of containers) clampScrollToTop(el);
    resetNestedScrollTops(mainEl);
  };

  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
}

/** @returns {() => void} cancel in-flight restore (user input or unmount) */
export function restoreFestivalHubListScroll(mainEl, tops) {
  if (!tops?.length) return () => {};
  return restoreFestivalHubListScrollWhenReady(mainEl, tops);
}

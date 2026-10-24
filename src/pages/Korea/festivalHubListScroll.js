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
  if (!tops?.length || !(mainEl instanceof HTMLElement)) return;

  const started = performance.now();
  let ro;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    ro?.disconnect();
    restoreFestivalHubListScrollOffsets(mainEl, tops);
    requestAnimationFrame(() => restoreFestivalHubListScrollOffsets(mainEl, tops));
  };

  const attempt = () => {
    if (done) return;
    restoreFestivalHubListScrollOffsets(mainEl, tops);
    if (hubListScrollTargetsReady(mainEl, tops)) {
      finish();
      return;
    }
    if (performance.now() - started >= RESTORE_READY_TIMEOUT_MS) {
      finish();
      return;
    }
    requestAnimationFrame(attempt);
  };

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      if (hubListScrollTargetsReady(mainEl, tops)) finish();
    });
    for (const el of getFestivalHubListScrollContainers(mainEl)) {
      ro.observe(el);
    }
  }

  requestAnimationFrame(attempt);
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

export function restoreFestivalHubListScroll(mainEl, tops) {
  if (!tops?.length) return;
  restoreFestivalHubListScrollWhenReady(mainEl, tops);
}

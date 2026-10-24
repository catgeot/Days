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

function runScrollRestore(mainEl, tops) {
  restoreFestivalHubListScrollOffsets(mainEl, tops);
  requestAnimationFrame(() => {
    restoreFestivalHubListScrollOffsets(mainEl, tops);
    requestAnimationFrame(() => restoreFestivalHubListScrollOffsets(mainEl, tops));
  });
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
  runScrollRestore(mainEl, tops);
}

export function getFestivalSheetScrollContainers(sheet) {
  if (!(sheet instanceof HTMLElement)) return [];
  const md =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const contentCol = sheet.querySelector('[data-festival-sheet-content]');
  const primary =
    md && contentCol instanceof HTMLElement ? contentCol : sheet;
  const set = new Set([sheet]);
  if (contentCol instanceof HTMLElement) set.add(contentCol);
  const rest = [...set].filter((el) => el !== primary);
  return [primary, ...rest];
}

function clampScrollToTop(el) {
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollTop = Math.min(el.scrollTop, maxTop);
  el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  el.scrollTop = 0;
}

function resetNestedScrollTops(root) {
  if (!(root instanceof HTMLElement)) return;
  root.querySelectorAll('*').forEach((node) => {
    if (node instanceof HTMLElement && node.scrollTop > 0) node.scrollTop = 0;
  });
}

function alignOverviewTopBand(sheet, primary) {
  if (!(sheet instanceof HTMLElement) || !(primary instanceof HTMLElement)) return;
  const md =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const hero = sheet.querySelector('[data-festival-photo-strip]');
  const title = document.getElementById('korea-festival-sheet-title');
  const marker = (md ? title : hero) || title;
  if (!marker || !primary.contains(marker)) return;

  const portRect = primary.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const desiredTop = portRect.top + (md ? 12 : 8);
  const delta = markerRect.top - desiredTop;
  if (Math.abs(delta) <= 2) return;

  const maxTop = Math.max(0, primary.scrollHeight - primary.clientHeight);
  primary.scrollTop = Math.max(0, Math.min(primary.scrollTop + delta, maxTop));
}

export function scrollFestivalOverviewToTop(sheet) {
  if (!(sheet instanceof HTMLElement)) return;

  const containers = getFestivalSheetScrollContainers(sheet);
  const primary = containers[0];
  if (!primary) return;

  const restores = containers.map((el) => {
    const prevOverflow = el.style.overflow;
    const prevTouch = el.style.getPropertyValue('-webkit-overflow-scrolling');
    el.style.overflow = 'hidden';
    el.style.setProperty('-webkit-overflow-scrolling', 'auto');
    return () => {
      el.style.overflow = prevOverflow;
      if (prevTouch) el.style.setProperty('-webkit-overflow-scrolling', prevTouch);
      else el.style.removeProperty('-webkit-overflow-scrolling');
    };
  });

  const run = () => {
    for (const el of containers) clampScrollToTop(el);
    resetNestedScrollTops(sheet);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    alignOverviewTopBand(sheet, primary);
  };

  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(() => {
      run();
      restores.forEach((restore) => restore());
    });
  });
}

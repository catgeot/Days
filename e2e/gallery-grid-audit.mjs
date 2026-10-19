/** @typedef {import('@playwright/test').Page} Page */

/**
 * @param {Page} page
 */
export async function runGalleryGridAudit(page) {
  return page.evaluate(() => {
    const column =
      document.querySelector('.custom-scrollbar-blue .columns-2') ||
      document.querySelector('.columns-2');
    const galleryRoot = column?.parentElement;
    if (!column) {
      return {
        cells: 0,
        painted: 0,
        broken: 0,
        empty: 0,
        orphanPulse: 0,
        rows: [],
        topRowL: '-',
        topRowR: '-',
        domTileCount: 0,
        hasInitialSkeletonGrid: false,
        capturedAt: performance.now(),
      };
    }
    const scroller = document.querySelector('.custom-scrollbar-blue');
    const scrollerRect = scroller?.getBoundingClientRect();
    const viewTop = scrollerRect?.top ?? 0;
    const viewBottom = scrollerRect?.bottom ?? window.innerHeight;
    const columnRect = column.getBoundingClientRect();
    const midX = columnRect.left + columnRect.width / 2;
    const tiles = [...column.children].filter((node) => node instanceof HTMLElement);
    const rows = tiles.map((tile, index) => {
      const rect = tile.getBoundingClientRect();
      const visible =
        rect.width > 4 &&
        rect.height > 4 &&
        rect.bottom > viewTop + 2 &&
        rect.top < viewBottom - 2;
      const side = rect.left + rect.width / 2 < midX ? 'L' : 'R';
      const paintState = tile.getAttribute('data-gallery-paint') || 'legacy';
      const img = tile.querySelector('img[alt^="place-img"]');
      const hasPulse = Boolean(tile.querySelector('.animate-pulse'));
      const nw = img?.naturalWidth ?? 0;
      const style = img ? getComputedStyle(img) : null;
      const opacity = style ? Number(style.opacity) : 0;
      const painted =
        (paintState === 'painted' || paintState === 'legacy') &&
        nw > 0 &&
        opacity > 0.05 &&
        !hasPulse;
      const broken =
        paintState === 'broken' ||
        (img && getComputedStyle(img).display === 'none') ||
        Boolean(img && img.complete && nw === 0 && (img.currentSrc || img.src));
      const empty = Boolean(
        visible &&
          !painted &&
          !broken &&
          (paintState === 'pending' || hasPulse || !img || nw === 0 || opacity <= 0.05),
      );
      return {
        index,
        side,
        top: Math.round(rect.top),
        visible,
        paintState,
        nw,
        opacity,
        painted,
        broken,
        empty,
        hasPulse,
      };
    });
    const vis = rows.filter((r) => r.visible);
    const topL = vis.filter((r) => r.side === 'L').sort((a, b) => a.top - b.top)[0];
    const topR = vis.filter((r) => r.side === 'R').sort((a, b) => a.top - b.top)[0];
    const tilePulse = tiles.reduce(
      (n, t) => n + (t.querySelectorAll('.animate-pulse').length > 0 ? 1 : 0),
      0,
    );
    const allPulse = galleryRoot ? galleryRoot.querySelectorAll('.animate-pulse').length : 0;
    return {
      cells: vis.length,
      painted: vis.filter((r) => r.painted).length,
      broken: vis.filter((r) => r.broken).length,
      empty: vis.filter((r) => r.empty).length,
      orphanPulse: Math.max(0, allPulse - tilePulse),
      hasInitialSkeletonGrid: Boolean(
        document.querySelector('.grid.grid-cols-2 .animate-pulse'),
      ),
      domTileCount: tiles.length,
      topRowL: topL ? (topL.painted ? 'P' : topL.broken ? 'B' : 'E') : '-',
      topRowR: topR ? (topR.painted ? 'P' : topR.broken ? 'B' : 'E') : '-',
      rows: vis,
      capturedAt: performance.now(),
    };
  });
}

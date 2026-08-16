import { useLayoutEffect, useState } from 'react';

const CHROME_SELECTOR = '[data-home-chrome-hit]';
const MOBILE_MQL = '(max-width: 767px)';
const CHROME_GAP_PX = 12;
/** HomeUI 좌상단 실드 `max-md:-bottom-14` — hit box 밖 클릭 가로채기 방지 */
const FACE_OPEN_CHROME_OVERLAP_PX = 56;
const MIN_LIST_PX = 112;

function capPxForSubregions(hasSubregions) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  if (hasSubregions) {
    return Math.min(vh * 0.5, 22 * 16);
  }
  return Math.min(vh * 0.58, 26 * 16);
}

/**
 * 모바일 — 좌상단 크롬과 하단 카테고리·보조 UI 사이 가용 높이로 나라 리스트 max-height 산출.
 * 리스트 하단 앵커(위치)는 유지하고 위로만 자라는 높이를 제한한다.
 */
export function useMobileFaceRegionListHeight({
  enabled,
  hasSubregionBar,
  chromeEpoch = 0,
  faceRegionsOpen = false,
  bottomAuxRef,
  categoryBarRef,
}) {
  const [maxHeightPx, setMaxHeightPx] = useState(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setMaxHeightPx(null);
      return undefined;
    }

    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(MOBILE_MQL);
    if (!mql.matches) {
      setMaxHeightPx(null);
      return undefined;
    }

    const update = () => {
      if (!mql.matches) {
        setMaxHeightPx(null);
        return;
      }

      const chrome = document.querySelector(CHROME_SELECTOR);
      const categoryBar = categoryBarRef?.current;
      if (!chrome || !categoryBar) {
        setMaxHeightPx(null);
        return;
      }

      const chromeBottom = chrome.getBoundingClientRect().bottom;
      const categoryTop = categoryBar.getBoundingClientRect().top;
      const auxHeight = bottomAuxRef?.current?.getBoundingClientRect().height ?? 0;
      const cap = capPxForSubregions(hasSubregionBar);
      const chromeOverlap = faceRegionsOpen ? FACE_OPEN_CHROME_OVERLAP_PX : 0;
      const available = categoryTop - chromeBottom - CHROME_GAP_PX - chromeOverlap - auxHeight;
      const next = Math.max(MIN_LIST_PX, Math.min(cap, Math.floor(available)));

      setMaxHeightPx(Number.isFinite(next) ? next : null);
    };

    update();

    const observer = new ResizeObserver(() => update());
    const chrome = document.querySelector(CHROME_SELECTOR);
    if (chrome) observer.observe(chrome);
    if (categoryBarRef?.current) observer.observe(categoryBarRef.current);
    if (bottomAuxRef?.current) observer.observe(bottomAuxRef.current);

    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    mql.addEventListener('change', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      mql.removeEventListener('change', update);
    };
  }, [enabled, hasSubregionBar, chromeEpoch, faceRegionsOpen, bottomAuxRef, categoryBarRef]);

  if (!enabled || maxHeightPx == null) return null;

  return {
    maxHeightPx,
    listHeightStyle: { height: `${maxHeightPx}px`, maxHeight: `${maxHeightPx}px` },
  };
}

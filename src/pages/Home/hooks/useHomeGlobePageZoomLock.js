import { useEffect } from 'react';
import {
  applyViewportPageZoomLock,
  isVisualViewportPageZoomed,
  releaseViewportPageZoomLock,
  resetVisualViewportPageZoom,
} from '../../../shared/lib/mobileViewport';

/**
 * 지구본 홈 — 크롬·우주 영역을 핀치하면 페이지가 확대되고
 * 지구본이 visualViewport를 채우면 축소 제스처가 캔버스에 먹혀 복귀가 막힌다.
 */
export function useHomeGlobePageZoomLock(enabled) {
  useEffect(() => {
    if (!enabled) {
      releaseViewportPageZoomLock();
      return undefined;
    }

    applyViewportPageZoomLock();

    const blockPageGesture = (event) => {
      event.preventDefault();
    };

    document.addEventListener('gesturestart', blockPageGesture, { capture: true, passive: false });
    document.addEventListener('gesturechange', blockPageGesture, { capture: true, passive: false });

    let resetting = false;
    const onViewportChange = () => {
      if (resetting) return;
      if (!isVisualViewportPageZoomed(window.visualViewport?.scale)) return;
      resetting = true;
      resetVisualViewportPageZoom({ keepLock: true });
      requestAnimationFrame(() => {
        resetting = false;
      });
    };

    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    onViewportChange();

    return () => {
      document.removeEventListener('gesturestart', blockPageGesture, true);
      document.removeEventListener('gesturechange', blockPageGesture, true);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('scroll', onViewportChange);
      releaseViewportPageZoomLock();
    };
  }, [enabled]);
}

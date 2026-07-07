/** iOS Safari 등 — visualViewport 우선, 키보드·페이지 줌 후 지도·UI 크기 SSOT */
export function readViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}

/** fixed portal·popover — offsetTop/Left 포함 (키보드·iOS 줌 후 좌표 SSOT) */
export function readVisualViewportLayout() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 };
  }
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
    offsetTop: Math.round(vv?.offsetTop ?? 0),
    offsetLeft: Math.round(vv?.offsetLeft ?? 0),
  };
}

/**
 * getBoundingClientRect → visualViewport 좌표 (iOS fixed·키보드 SSOT).
 * layout viewport rect에서 offsetTop/Left를 빼면 position:fixed top/left와 일치.
 */
export function anchorRectInVisualViewport(rect) {
  if (!rect) return null;
  const vp = readVisualViewportLayout();
  return {
    top: rect.top - vp.offsetTop,
    bottom: rect.bottom - vp.offsetTop,
    left: rect.left - vp.offsetLeft,
    right: rect.right - vp.offsetLeft,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * 로그인 폼 등 input 포커스 후 iOS가 페이지를 확대한 상태를 홈 복귀 전에 되돌린다.
 * (font-size 16px 미만 input 포커스 시 Safari 자동 줌)
 */
export function resetIosZoomAfterInput() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();

  window.scrollTo(0, 0);

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  const original = meta.getAttribute('content');
  if (!original || original.includes('maximum-scale')) return;

  meta.setAttribute('content', `${original}, maximum-scale=1.0`);
  requestAnimationFrame(() => {
    meta.setAttribute('content', original);
    window.dispatchEvent(new Event('resize'));
  });
}

let homeViewportSyncTimer = null;

/**
 * 홈 지구본 복귀 시 viewport·Mapbox 크기 재동기화.
 * 로그인 후 sessionStorage 플래그, MOONi 채팅·탐색 모달 닫기 등에서 공통 사용.
 */
export function syncHomeViewportAfterInput() {
  resetIosZoomAfterInput();

  if (typeof window === 'undefined') return;

  if (homeViewportSyncTimer != null) {
    window.clearTimeout(homeViewportSyncTimer);
  }

  homeViewportSyncTimer = window.setTimeout(() => {
    homeViewportSyncTimer = null;
    window.dispatchEvent(new Event('resize'));
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, 120);
}

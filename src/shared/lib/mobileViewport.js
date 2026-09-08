export const PAGE_ZOOM_SCALE_EPSILON = 0.02;
export const VIEWPORT_PAGE_ZOOM_LOCK_SUFFIX = 'maximum-scale=1.0, user-scalable=no';

let viewportPageZoomLockActive = false;
let unlockedViewportContentSnapshot = null;

function isIosWebKitBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isVisualViewportPageZoomed(scale, epsilon = PAGE_ZOOM_SCALE_EPSILON) {
  const value = Number(scale);
  return Number.isFinite(value) && Math.abs(value - 1) > epsilon;
}

export function stripViewportPageZoomLock(content) {
  return String(content || '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      const eq = part.indexOf('=');
      const key = (eq === -1 ? part : part.slice(0, eq)).trim().toLowerCase();
      const val = (eq === -1 ? '' : part.slice(eq + 1)).trim().toLowerCase();
      if (key === 'maximum-scale') return false;
      if (key === 'user-scalable' && (val === 'no' || val === '0')) return false;
      return true;
    })
    .join(', ');
}

export function withViewportPageZoomLock(content) {
  const base = stripViewportPageZoomLock(content);
  return base ? `${base}, ${VIEWPORT_PAGE_ZOOM_LOCK_SUFFIX}` : VIEWPORT_PAGE_ZOOM_LOCK_SUFFIX;
}

export function isViewportPageZoomLocked() {
  return viewportPageZoomLockActive;
}

export function applyViewportPageZoomLock() {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const current = meta.getAttribute('content') || '';
  if (!unlockedViewportContentSnapshot) {
    unlockedViewportContentSnapshot = stripViewportPageZoomLock(current);
  }
  viewportPageZoomLockActive = true;
  meta.setAttribute('content', withViewportPageZoomLock(unlockedViewportContentSnapshot));
}

export function releaseViewportPageZoomLock() {
  if (typeof document === 'undefined') return;
  viewportPageZoomLockActive = false;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const unlocked = unlockedViewportContentSnapshot
    || stripViewportPageZoomLock(meta.getAttribute('content') || '');
  unlockedViewportContentSnapshot = null;
  meta.setAttribute('content', unlocked);
}

/** 브라우저 페이지 줌(visualViewport.scale)을 1로 되돌린다. */
export function resetVisualViewportPageZoom({ keepLock = isViewportPageZoomLocked() } = {}) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  window.scrollTo(0, 0);

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  const unlocked = stripViewportPageZoomLock(meta.getAttribute('content') || '');
  const locked = withViewportPageZoomLock(unlocked);

  if (keepLock) {
    meta.setAttribute('content', unlocked);
    requestAnimationFrame(() => {
      meta.setAttribute('content', locked);
      window.dispatchEvent(new Event('resize'));
    });
    return;
  }

  meta.setAttribute('content', locked);
  requestAnimationFrame(() => {
    meta.setAttribute('content', unlocked);
    window.dispatchEvent(new Event('resize'));
  });
}

/** 입력 포커스·페이지 줌·iOS Safari — full viewport meta 리셋이 필요할 때 */
export function needsHomeViewportInputSync() {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    return true;
  }
  const vv = window.visualViewport;
  if (vv && isVisualViewportPageZoomed(vv.scale)) return true;
  return isIosWebKitBrowser();
}

/** Chrome+WebGL: resize·viewport sync 후 fixed chrome paint/hit 어긋남 완화 */
export function scheduleRecalibrateFixedChromeHits() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const run = () => {
    document
      .querySelectorAll('[data-home-chrome-hit], [data-place-chrome-hit], [data-summary-chrome]')
      .forEach((el) => {
        void el.getBoundingClientRect();
      });
  };

  requestAnimationFrame(() => requestAnimationFrame(run));
}

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

/** layout viewport bottom → visual viewport bottom (키보드 높이). fixed `bottom` SSOT */
export function readVisualViewportBottomInset(pad = 0) {
  if (typeof window === 'undefined') return pad;
  const vp = readVisualViewportLayout();
  const layoutHeight = window.innerHeight;
  const keyboardInset = Math.max(0, layoutHeight - vp.height - vp.offsetTop);
  return keyboardInset + pad;
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

  const zoomed = isVisualViewportPageZoomed(window.visualViewport?.scale);
  if (!isIosWebKitBrowser() && !zoomed) return;

  resetVisualViewportPageZoom();
}

let homeViewportSyncTimer = null;

/**
 * 홈 지구본 복귀 시 viewport·Mapbox 크기 재동기화.
 * 로그인 후 sessionStorage 플래그, MOONi 채팅·탐색 모달 닫기 등에서 공통 사용.
 */
export function syncHomeViewportAfterInput() {
  if (needsHomeViewportInputSync()) {
    resetIosZoomAfterInput();
  } else if (typeof window !== 'undefined') {
    window.scrollTo(0, 0);
  }

  if (typeof window === 'undefined') return;

  if (homeViewportSyncTimer != null) {
    window.clearTimeout(homeViewportSyncTimer);
  }

  homeViewportSyncTimer = window.setTimeout(() => {
    homeViewportSyncTimer = null;
    window.dispatchEvent(new Event('resize'));
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      scheduleRecalibrateFixedChromeHits();
    });
  }, 120);
}

/** 홈·/place 왕복 — 입력 없을 때 meta 줌·window resize 생략(Chrome WebGL hit 누적 어긋남 방지) */
export function syncHomeChromeAfterNavigation() {
  if (typeof window === 'undefined') return;

  window.scrollTo(0, 0);
  scheduleRecalibrateFixedChromeHits();
}

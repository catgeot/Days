function isIosWebKitBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** 입력 포커스·페이지 줌·iOS Safari — full viewport meta 리셋이 필요할 때 */
export function needsHomeViewportInputSync() {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    return true;
  }
  const vv = window.visualViewport;
  if (vv && Math.abs(vv.scale - 1) > 0.02) return true;
  return isIosWebKitBrowser();
}

export const HOME_VIEWPORT_LOCK_CLASS = 'gateo-home-lock-viewport';

/** Chrome+WebGL: resize·viewport sync 후 fixed chrome paint/hit 어긋남 완화 */
export function scheduleRecalibrateFixedChromeHits() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const run = () => {
    document
      .querySelectorAll('[data-home-chrome-top], [data-home-chrome-hit], [data-place-chrome-hit], [data-summary-chrome]')
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

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  const original = meta.getAttribute('content');
  if (!original || original.includes('maximum-scale')) return;
  if (!isIosWebKitBrowser()) return;

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

export const HOME_CHROME_TOP_VAR = '--gateo-home-chrome-top';

/** iOS Chrome 주소창이 웹뷰 위에 덮일 때 — 새로고침 후엔 웹뷰가 이미 내려가 0 */
export const CHROME_IOS_URLBAR_INSET_PX = 56;

export function lockHomeViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add(HOME_VIEWPORT_LOCK_CLASS);
}

export function unlockHomeViewport() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(HOME_VIEWPORT_LOCK_CLASS);
}

export function applyHomeChromeTopPx(px) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(HOME_CHROME_TOP_VAR, `${Math.max(0, Math.round(px))}px`);
}

export function clearHomeChromeTop() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.removeProperty(HOME_CHROME_TOP_VAR);
}

export function resolveHomeChromeTopPx({
  offsetTop = 0,
  pageTop = 0,
  dvhSvhGap = 0,
  allowFallback = false,
  fallbackPx = CHROME_IOS_URLBAR_INSET_PX,
} = {}) {
  const measured = Math.max(0, offsetTop, pageTop, dvhSvhGap);
  if (allowFallback) return Math.max(measured, fallbackPx);
  return measured;
}

/** CriOS first navigate (not reload / back_forward) — 56px floor for the whole session. */
export function isCriosFirstNavigateSession({ crios = false, navType = '' } = {}) {
  return Boolean(crios && navType !== 'reload' && navType !== 'back_forward');
}

/**
 * Apply policy for `--gateo-home-chrome-top`.
 * visualViewport height drop (globe / 100dvh / Mapbox) is not a webview inset
 * and must not clear the first-navigate 56px floor.
 */
export function resolveSessionHomeChromeTopPx({
  crios = false,
  navType = '',
  measuredPx = 0,
  visualViewportHeightDelta = 0,
} = {}) {
  void visualViewportHeightDelta;
  return resolveHomeChromeTopPx({
    offsetTop: measuredPx,
    allowFallback: isCriosFirstNavigateSession({ crios, navType }),
  });
}

function isChromeIos() {
  return typeof navigator !== 'undefined' && /CriOS/i.test(navigator.userAgent);
}

function readNavigationType() {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return '';
  }
  return performance.getEntriesByType('navigation')[0]?.type ?? '';
}

function readDvhSvhGapPx() {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100dvh;pointer-events:none;visibility:hidden';
  document.documentElement.appendChild(probe);
  const dvh = probe.offsetHeight;
  probe.style.height = '100svh';
  const svh = probe.offsetHeight;
  probe.remove();
  if (!dvh || !svh) return 0;
  return Math.max(0, dvh - svh);
}

function readMeasuredHomeChromeTopPx() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  return resolveHomeChromeTopPx({
    offsetTop: Math.round(vv?.offsetTop ?? 0),
    pageTop: Math.round(vv?.pageTop ?? 0),
    dvhSvhGap: readDvhSvhGapPx(),
    allowFallback: false,
  });
}

/**
 * Chrome iOS 첫 진입: 웹뷰가 주소창 뒤에 깔린 채 페인트 → 새로고침이면 웹뷰가 이미 내려감.
 * 이른 scrollTo(0,0)·즉시 리마운트는 헤더를 더 밀어 넣음. fallback inset은 CriOS 첫 navigate만.
 * offsetTop을 세션 내내 resize 바인딩하지 않음 (#13/#15 칩 히트).
 * visualViewport 높이 감소는 지구본/100dvh/Mapbox shrink — 첫 navigate 56px를 해제하지 않음.
 */
export function syncHomeChromeOnFirstPaint({ onRemount, onSettled } = {}) {
  if (typeof window === 'undefined') return () => {};

  let stopped = false;
  let remountCount = 0;
  let lastApplied = -1;
  const crios = isChromeIos();
  const navType = readNavigationType();
  const timers = [];
  const visualViewport = window.visualViewport;
  let lastHeight = visualViewport?.height ?? window.innerHeight;

  const apply = (remount) => {
    if (stopped) return;
    const pageY = window.scrollY || window.pageYOffset || 0;
    const pageTop = visualViewport?.pageTop ?? 0;
    if (pageY > 8 || pageTop > 8) {
      window.scrollTo(0, 0);
    }
    const measured = readMeasuredHomeChromeTopPx();
    const heightDelta = (visualViewport?.height ?? lastHeight) - lastHeight;
    const px = resolveSessionHomeChromeTopPx({
      crios,
      navType,
      measuredPx: measured,
      visualViewportHeightDelta: heightDelta,
    });
    if (px !== lastApplied) {
      applyHomeChromeTopPx(px);
      lastApplied = px;
    }
    scheduleRecalibrateFixedChromeHits();
    if (remount && remountCount < 2 && typeof onRemount === 'function') {
      remountCount += 1;
      onRemount();
    }
  };

  apply(false);

  const onVisualResize = () => {
    lastHeight = visualViewport?.height ?? window.innerHeight;
    apply(true);
  };
  visualViewport?.addEventListener('resize', onVisualResize);

  timers.push(window.setTimeout(() => apply(true), 280));
  timers.push(window.setTimeout(() => apply(true), 700));
  timers.push(window.setTimeout(() => {
    apply(false);
    visualViewport?.removeEventListener('resize', onVisualResize);
    if (typeof onSettled === 'function') onSettled();
  }, 1200));

  return () => {
    stopped = true;
    timers.forEach((id) => window.clearTimeout(id));
    visualViewport?.removeEventListener('resize', onVisualResize);
    clearHomeChromeTop();
  };
}

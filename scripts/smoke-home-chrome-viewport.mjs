#!/usr/bin/env node
/**
 * 지구본 홈 Chrome 헤더 가림 — overlay일 때만 56px · 100dvh 잠금.
 * Usage: node scripts/smoke-home-chrome-viewport.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function parseAppliedPx(cssVar) {
  const n = Number.parseInt(String(cssVar || '0'), 10);
  return Number.isFinite(n) ? n : 0;
}

function runCriosMock({
  screenHeight = 844,
  startInnerHeight = 844,
  startVisualHeight = startInnerHeight,
  dropBy = 144,
  navType = 'navigate',
} = {}) {
  const styleMap = {};
  const listeners = new Map();
  const winListeners = new Map();
  const visualViewport = {
    width: 390,
    height: startVisualHeight,
    offsetTop: 0,
    pageTop: 0,
    scale: 1,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type) {
      listeners.get(type)?.forEach((fn) => fn());
    },
  };
  const header = {
    getBoundingClientRect() {
      const top = parseAppliedPx(styleMap[HOME_CHROME_TOP_VAR]);
      return { top, bottom: top + 56, left: 0, right: 390, width: 390, height: 56 };
    },
  };
  const prev = {
    window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    requestAnimationFrame: Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
    performanceGetEntries: globalThis.performance?.getEntriesByType,
  };

  const win = {
    visualViewport,
    innerWidth: 390,
    innerHeight: startInnerHeight,
    screen: { height: screenHeight },
    scrollY: 0,
    pageYOffset: 0,
    scrollTo() {},
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    requestAnimationFrame: (cb) => globalThis.setTimeout(cb, 0),
    addEventListener(type, fn) {
      if (!winListeners.has(type)) winListeners.set(type, new Set());
      winListeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      winListeners.get(type)?.delete(fn);
    },
  };
  Object.defineProperty(globalThis, 'window', { value: win, configurable: true, writable: true });
  globalThis.document = {
    documentElement: {
      style: {
        setProperty(k, v) { styleMap[k] = v; },
        removeProperty(k) { delete styleMap[k]; },
        getPropertyValue(k) { return styleMap[k] ?? ''; },
      },
      classList: { add() {}, remove() {} },
      clientHeight: startInnerHeight,
      appendChild() {},
    },
    querySelector: (sel) => (sel === '[data-home-chrome-top]' ? header : null),
    querySelectorAll: () => [],
    createElement: () => ({
      setAttribute() {},
      style: { cssText: '', height: '' },
      offsetHeight: visualViewport.height,
      remove() {},
    }),
    activeElement: null,
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.122 Mobile/15E148 Safari/604.1',
    },
    configurable: true,
  });
  const origGetEntries = globalThis.performance.getEntriesByType.bind(globalThis.performance);
  globalThis.performance.getEntriesByType = (type) => (
    type === 'navigation' ? [{ type: navType }] : origGetEntries(type)
  );
  globalThis.requestAnimationFrame = (cb) => globalThis.setTimeout(cb, 0);

  const readAppliedPx = () => parseAppliedPx(
    globalThis.document.documentElement.style.getPropertyValue(HOME_CHROME_TOP_VAR),
  );

  const stop = syncHomeChromeOnFirstPaint();
  const beforeSettlePx = readAppliedPx();

  return new Promise((resolve) => {
    globalThis.setTimeout(() => {
      const firstPx = readAppliedPx();
      const firstHeightPx = parseAppliedPx(styleMap[HOME_VIEWPORT_HEIGHT_VAR]);
      visualViewport.height = startVisualHeight - dropBy;
      win.innerHeight = startInnerHeight - dropBy;
      visualViewport.dispatch('resize');
      const afterDropPx = readAppliedPx();
      const result = {
        beforeSettlePx,
        firstPx,
        afterDropPx,
        dropDelta: visualViewport.height - startVisualHeight,
        headerRectTopAfterDrop: header.getBoundingClientRect().top,
        firstHeightPx,
        heightAfterDropPx: parseAppliedPx(styleMap[HOME_VIEWPORT_HEIGHT_VAR]),
      };
      stop();

      const restore = (key, desc, fallback) => {
        if (desc) Object.defineProperty(globalThis, key, desc);
        else if (fallback) Object.defineProperty(globalThis, key, fallback);
        else delete globalThis[key];
      };
      restore('window', prev.window);
      restore('document', prev.document);
      restore('navigator', prev.navigator);
      restore('requestAnimationFrame', prev.requestAnimationFrame, {
        value: () => 0,
        configurable: true,
        writable: true,
      });
      if (prev.performanceGetEntries) {
        globalThis.performance.getEntriesByType = prev.performanceGetEntries;
      }
      resolve(result);
    }, CRIOS_OVERLAY_SETTLE_MS + 20);
  });
}

const {
  HOME_VIEWPORT_LOCK_CLASS,
  HOME_CHROME_TOP_VAR,
  HOME_VIEWPORT_HEIGHT_VAR,
  CHROME_IOS_URLBAR_INSET_PX,
  CHROME_IOS_OVERLAY_MAX_SCREEN_GAP_PX,
  CRIOS_OVERLAY_SETTLE_MS,
  lockHomeViewport,
  unlockHomeViewport,
  syncHomeChromeOnFirstPaint,
  resolveHomeChromeTopPx,
  resolveSessionHomeChromeTopPx,
  isCriosChromeTopSession,
  isCriosUrlbarOverlay,
  clearHomeChromeTop,
} = await import(pathToFileURL(join(root, 'src/shared/lib/mobileViewport.js')).href);

assert(HOME_VIEWPORT_LOCK_CLASS === 'gateo-home-lock-viewport', 'lock class name');
assert(HOME_CHROME_TOP_VAR === '--gateo-home-chrome-top', 'chrome top CSS var');
assert(HOME_VIEWPORT_HEIGHT_VAR === '--gateo-home-viewport-height', 'viewport height CSS var');
assert(CHROME_IOS_URLBAR_INSET_PX === 56, 'CriOS urlbar fallback px');
assert(CHROME_IOS_OVERLAY_MAX_SCREEN_GAP_PX === 100, 'overlay screen-gap ceiling');
assert(CRIOS_OVERLAY_SETTLE_MS === 280, 'overlay settle delay');
assert(typeof lockHomeViewport === 'function', 'lockHomeViewport export');
assert(typeof unlockHomeViewport === 'function', 'unlockHomeViewport export');
assert(typeof clearHomeChromeTop === 'function', 'clearHomeChromeTop export');
assert(typeof resolveSessionHomeChromeTopPx === 'function', 'resolveSessionHomeChromeTopPx export');
assert(typeof isCriosChromeTopSession === 'function', 'isCriosChromeTopSession export');
assert(typeof isCriosUrlbarOverlay === 'function', 'isCriosUrlbarOverlay export');

assert(resolveHomeChromeTopPx({ allowFallback: true }) === 56, 'CriOS fallback when unmeasured');
assert(resolveHomeChromeTopPx({ allowFallback: false }) === 0, 'no fallback when disallowed');
assert(resolveHomeChromeTopPx({ offsetTop: 12, allowFallback: true }) === 56, 'fallback is a floor on first navigate');
assert(resolveHomeChromeTopPx({ offsetTop: 80, allowFallback: true }) === 80, 'larger measurement wins floor');
assert(resolveHomeChromeTopPx({ dvhSvhGap: 40, allowFallback: false }) === 40, 'gap used when no fallback');
assert(resolveHomeChromeTopPx({ pageTop: 8, offsetTop: 2 }) === 8, 'max of measurements');

assert(isCriosUrlbarOverlay({ crios: true, innerHeight: 844, screenHeight: 844 }) === true, 'full-screen innerHeight is overlay');
assert(isCriosUrlbarOverlay({ crios: true, innerHeight: 796, screenHeight: 844 }) === true, 'status+toolbar-sized gap still overlay');
assert(isCriosUrlbarOverlay({ crios: true, innerHeight: 720, screenHeight: 844 }) === false, 'urlbar-sized extra gap is inset');
assert(
  isCriosUrlbarOverlay({
    crios: true,
    innerHeight: 844,
    screenHeight: 844,
    visualViewportHeight: 720,
  }) === true,
  'layout-full is overlay even if visualViewport is smaller (Chrome relaunch)',
);
assert(isCriosUrlbarOverlay({ crios: false, innerHeight: 844, screenHeight: 844 }) === false, 'non-CriOS is never overlay');
assert(isCriosUrlbarOverlay({ crios: true, innerHeight: 0, screenHeight: 844 }) === false, 'unmeasured innerHeight is not overlay');

assert(isCriosChromeTopSession({ crios: true, overlay: true }) === true, 'CriOS overlay gets chrome floor');
assert(isCriosChromeTopSession({ crios: true, overlay: false }) === false, 'CriOS inset has no floor');
assert(isCriosChromeTopSession({ crios: true, navType: 'reload', overlay: true }) === true, 'reload overlay still gets floor');
assert(isCriosChromeTopSession({ crios: false, overlay: true }) === false, 'non-CriOS has no floor');

assert(
  resolveSessionHomeChromeTopPx({ crios: true, overlay: true, navType: 'navigate', measuredPx: 0 }) === 56,
  'overlay first-nav floor 56',
);
assert(
  resolveSessionHomeChromeTopPx({ crios: true, overlay: false, navType: 'navigate', measuredPx: 0 }) === 0,
  'inset first-nav is 0 (no black gap)',
);
assert(
  resolveSessionHomeChromeTopPx({ crios: true, overlay: false, measuredPx: 40 }) === 0,
  'inset ignores dvhSvh measured gap',
);
assert(
  resolveSessionHomeChromeTopPx({
    crios: true,
    overlay: true,
    navType: 'navigate',
    measuredPx: 0,
    visualViewportHeightDelta: -64,
  }) === 56,
  'height drop -64 must not clear overlay 56',
);
assert(
  resolveSessionHomeChromeTopPx({
    crios: true,
    overlay: true,
    navType: 'reload',
    measuredPx: 0,
    visualViewportHeightDelta: -64,
  }) === 56,
  'reload overlay keeps 56 after height drop',
);
assert(
  resolveSessionHomeChromeTopPx({ crios: false, overlay: true, navType: 'navigate', visualViewportHeightDelta: -64 }) === 0,
  'non-CriOS stays 0 after height drop',
);

const stop = syncHomeChromeOnFirstPaint();
assert(typeof stop === 'function', 'first-paint returns cleanup');
stop();

const overlayMock = await runCriosMock({
  screenHeight: 844,
  startInnerHeight: 844,
  dropBy: 144,
  navType: 'navigate',
});
assert(overlayMock.beforeSettlePx === 0, `overlay must not latch before settle, got ${overlayMock.beforeSettlePx}`);
assert(overlayMock.firstPx === 56, `overlay after settle is 56, got ${overlayMock.firstPx}`);
assert(overlayMock.dropDelta === -144, `overlay height delta is -144, got ${overlayMock.dropDelta}`);
assert(overlayMock.afterDropPx === 56, `overlay latch must keep 56 after inset-looking drop, got ${overlayMock.afterDropPx}`);
assert(overlayMock.headerRectTopAfterDrop >= 40, `headerRectTop after drop should not be <40, got ${overlayMock.headerRectTopAfterDrop}`);
assert(overlayMock.firstHeightPx === 844, `overlay viewport height uses visible height, got ${overlayMock.firstHeightPx}`);
assert(overlayMock.heightAfterDropPx === 700, `overlay height may follow visualViewport, got ${overlayMock.heightAfterDropPx}`);
console.log('crios-overlay-mock:', JSON.stringify(overlayMock));

const visualInsetMock = await runCriosMock({
  screenHeight: 844,
  startInnerHeight: 844,
  startVisualHeight: 720,
  dropBy: 40,
  navType: 'navigate',
});
assert(visualInsetMock.firstPx === 56, `Chrome relaunch layout-full is 56 even if vv is inset, got ${visualInsetMock.firstPx}`);
assert(visualInsetMock.afterDropPx === 56, `Chrome relaunch latch keeps 56 after vv drop, got ${visualInsetMock.afterDropPx}`);
assert(visualInsetMock.firstHeightPx === 720, `Chrome relaunch locks visible height, got ${visualInsetMock.firstHeightPx}`);
console.log('crios-visual-inset-mock:', JSON.stringify(visualInsetMock));

const insetMock = await runCriosMock({
  screenHeight: 844,
  startInnerHeight: 720,
  dropBy: 40,
  navType: 'navigate',
});
assert(insetMock.firstPx === 0, `inset first apply is 0 (no black gap), got ${insetMock.firstPx}`);
assert(insetMock.afterDropPx === 0, `inset stays 0 after height drop, got ${insetMock.afterDropPx}`);
console.log('crios-inset-mock:', JSON.stringify(insetMock));

const reloadOverlayMock = await runCriosMock({
  screenHeight: 844,
  startInnerHeight: 844,
  dropBy: 144,
  navType: 'reload',
});
assert(reloadOverlayMock.firstPx === 56, `reload overlay keeps 56, got ${reloadOverlayMock.firstPx}`);
assert(reloadOverlayMock.afterDropPx === 56, `reload overlay latch keeps 56, got ${reloadOverlayMock.afterDropPx}`);
assert(reloadOverlayMock.firstHeightPx === 844, `reload overlay uses visible height, got ${reloadOverlayMock.firstHeightPx}`);
console.log('crios-reload-overlay-mock:', JSON.stringify(reloadOverlayMock));

const css = read('src/index.css');
assert(
  css.includes(`html.${HOME_VIEWPORT_LOCK_CLASS}`),
  'index.css locks html with 100dvh class',
);
assert(css.includes('max-height: var(--gateo-home-viewport-height, 100dvh)'), 'index.css max-height uses innerHeight var');
assert(css.includes(HOME_CHROME_TOP_VAR), 'index.css binds header top to CSS var');
assert(css.includes(HOME_VIEWPORT_HEIGHT_VAR), 'index.css binds home height to CSS var');
assert(css.includes('data-home-viewport-root'), 'index.css sizes tagged home roots');

const home = read('src/pages/Home/index.jsx');
assert(home.includes('data-home-viewport-root'), 'Home root tagged for CriOS height lock');
assert(home.includes('onSettled: lockHomeViewport'), 'Home delays html lock until chrome settled');
assert(home.includes('syncHomeChromeOnFirstPaint'), 'Home first-paint chrome sync');
assert(home.includes('clearHomeChromeTop'), 'Home clears chrome top on unmount');
assert(!/\bh-screen\b/.test(home), 'Home must not use h-screen');

const layout = read('src/shared/layout/MainLayout.jsx');
assert(layout.includes('h-[100dvh]'), 'MainLayout uses 100dvh');
assert(layout.includes('data-home-viewport-root'), 'MainLayout tagged for CriOS height lock');
assert(!/\bh-screen\b/.test(layout), 'MainLayout must not use h-screen');

const homeUi = read('src/pages/Home/components/HomeUI.jsx');
assert(homeUi.includes('data-home-chrome-top'), 'HomeUI header tagged for remount/hit');
assert(homeUi.includes('home-chrome-top-${homeChromeEpoch}'), 'HomeUI header remounts with epoch');
assert(
  !homeUi.includes('fixed top-0 left-0 right-0 z-[100]'),
  'HomeUI header top comes from CSS var, not Tailwind top-0',
);

const viewportLib = read('src/shared/lib/mobileViewport.js');
assert(
  !viewportLib.includes('setTop(offsetTop'),
  'must not reintroduce continuous offsetTop binding in mobileViewport',
);
assert(
  viewportLib.includes('CHROME_IOS_URLBAR_INSET_PX'),
  'CriOS urlbar fallback exists',
);
assert(
  viewportLib.includes('CHROME_IOS_OVERLAY_MAX_SCREEN_GAP_PX'),
  'overlay screen-gap constant exists',
);
assert(
  viewportLib.includes('isCriosChromeTopSession'),
  'CriOS chrome session helper exists',
);
assert(
  viewportLib.includes('isCriosUrlbarOverlay'),
  'overlay detector exists',
);
assert(
  viewportLib.includes('overlayLatched'),
  'overlay latch must survive globe visualViewport drop',
);
assert(
  viewportLib.includes('overlayReady'),
  'overlay latch waits for Chrome URL bar settle',
);
assert(
  !viewportLib.includes('pageTop > 8'),
  'must not scrollTo on visualViewport.pageTop',
);
assert(
  viewportLib.includes('apply(false)'),
  'visualViewport resize must not remount header',
);
assert(
  viewportLib.includes('pageshow'),
  'pageshow re-applies after Chrome restore',
);
assert(
  !viewportLib.includes('navType !== \'reload\''),
  'must not skip CriOS floor on reload',
);
assert(
  viewportLib.includes('resolveSessionHomeChromeTopPx'),
  'session apply policy helper exists',
);
assert(
  !viewportLib.includes('firstNavigate && !sawWebviewInset'),
  'must not clear first-navigate fallback via sawWebviewInset',
);
assert(!viewportLib.includes('agentHomeChromeLog'), 'mobileViewport must not keep agent debug logger');
assert(!viewportLib.includes('__GATEO_HOME_CHROME_DBG'), 'mobileViewport must not keep debug session key');

const indexHtml = read('index.html');
assert(indexHtml.includes('--gateo-home-chrome-top'), 'index.html may set CriOS inset before paint');
assert(!indexHtml.includes('visualViewport'), 'index.html overlay uses layout innerHeight, not visualViewport');
assert(!indexHtml.includes('--gateo-home-viewport-height'), 'index.html must not lock height before Chrome settles');
assert(indexHtml.includes('CriOS'), 'index.html gates inset to iOS Chrome');
assert(indexHtml.includes('screen.height'), 'index.html detects overlay via screen vs innerHeight');
assert(indexHtml.includes('<= 100'), 'index.html overlay gap matches CHROME_IOS_OVERLAY_MAX_SCREEN_GAP_PX');
assert(!indexHtml.includes("nav.type === 'reload'"), 'index.html must not skip reload inset');
assert(!indexHtml.includes('__GATEO_HOME_CHROME_DBG'), 'index.html must not keep debug payload');
assert(!indexHtml.includes('__gateo_debug_log'), 'index.html must not post debug logs');

assert(!home.includes('agentHomeChromeLog'), 'Home effect must not keep agent logs');

const viteCfg = read('vite.config.js');
assert(!viteCfg.includes('__gateo_debug_log'), 'vite must not ingest debug logs');

console.log('smoke-home-chrome-viewport: PASS');

#!/usr/bin/env node
/**
 * 지구본 홈 Chrome 첫 로딩 헤더 가림 — 100dvh · CriOS inset SSOT.
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

function runCriosFirstNavigateHeightDropMock() {
  const logs = [];
  const styleMap = {};
  const listeners = new Map();
  const visualViewport = {
    width: 390,
    height: 844,
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
    getComputedStyle: Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle'),
    requestAnimationFrame: Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
    fetch: Object.getOwnPropertyDescriptor(globalThis, 'fetch'),
    performanceGetEntries: globalThis.performance?.getEntriesByType,
    sink: globalThis.__gateoAgentLogSink,
  };

  const win = {
    visualViewport,
    innerWidth: 390,
    innerHeight: 844,
    scrollY: 0,
    pageYOffset: 0,
    scrollTo() {},
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    requestAnimationFrame: (cb) => globalThis.setTimeout(cb, 0),
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
      clientHeight: 844,
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
  let navType = 'navigate';
  const origGetEntries = globalThis.performance.getEntriesByType.bind(globalThis.performance);
  globalThis.performance.getEntriesByType = (type) => (
    type === 'navigation' ? [{ type: navType }] : origGetEntries(type)
  );
  globalThis.getComputedStyle = () => ({ top: styleMap[HOME_CHROME_TOP_VAR] || '0px' });
  globalThis.requestAnimationFrame = (cb) => globalThis.setTimeout(cb, 0);
  globalThis.fetch = () => Promise.resolve({ ok: true });
  globalThis.__gateoAgentLogSink = (payload) => { logs.push(payload); };

  const stopNav = syncHomeChromeOnFirstPaint();
  const firstApply = logs.filter((l) => l.message === 'apply chrome top');
  const firstPx = firstApply[0]?.data?.px ?? parseAppliedPx(styleMap[HOME_CHROME_TOP_VAR]);
  visualViewport.height = 780;
  win.innerHeight = 780;
  visualViewport.dispatch('resize');
  const afterApply = logs.filter((l) => l.message === 'apply chrome top').at(-1);
  const dropLog = logs.find((l) => l.data?.drop === true);
  const afterDropPx = afterApply?.data?.px ?? parseAppliedPx(styleMap[HOME_CHROME_TOP_VAR]);
  const headerRectTopAfterDrop = afterApply?.data?.headerRectTop ?? header.getBoundingClientRect().top;
  const result = {
    firstPx,
    afterDropPx,
    dropDelta: dropLog?.data?.delta ?? null,
    sawWebviewInset: afterApply?.data?.sawWebviewInset ?? dropLog?.data?.sawWebviewInset,
    clearsFallback: dropLog?.data?.clearsFallback,
    willAllowFallback: dropLog?.data?.willAllowFallback,
    headerRectTopAfterDrop,
    h5: logs.some((l) => l.hypothesisId === 'H5'),
  };
  stopNav();

  navType = 'reload';
  styleMap[HOME_CHROME_TOP_VAR] = undefined;
  delete styleMap[HOME_CHROME_TOP_VAR];
  visualViewport.height = 844;
  win.innerHeight = 844;
  const stopReload = syncHomeChromeOnFirstPaint();
  result.reloadPx = parseAppliedPx(styleMap[HOME_CHROME_TOP_VAR]);
  visualViewport.height = 780;
  visualViewport.dispatch('resize');
  result.reloadAfterDropPx = parseAppliedPx(styleMap[HOME_CHROME_TOP_VAR]);
  stopReload();

  const restore = (key, desc, fallback) => {
    if (desc) Object.defineProperty(globalThis, key, desc);
    else if (fallback) Object.defineProperty(globalThis, key, fallback);
    else delete globalThis[key];
  };
  restore('window', prev.window);
  restore('document', prev.document);
  restore('navigator', prev.navigator);
  restore('getComputedStyle', prev.getComputedStyle);
  restore('requestAnimationFrame', prev.requestAnimationFrame, {
    value: () => 0,
    configurable: true,
    writable: true,
  });
  restore('fetch', prev.fetch);
  if (prev.performanceGetEntries) {
    globalThis.performance.getEntriesByType = prev.performanceGetEntries;
  }
  globalThis.__gateoAgentLogSink = prev.sink;
  return result;
}

const {
  HOME_VIEWPORT_LOCK_CLASS,
  HOME_CHROME_TOP_VAR,
  CHROME_IOS_URLBAR_INSET_PX,
  lockHomeViewport,
  unlockHomeViewport,
  syncHomeChromeOnFirstPaint,
  resolveHomeChromeTopPx,
  resolveSessionHomeChromeTopPx,
  isCriosFirstNavigateSession,
  clearHomeChromeTop,
} = await import(pathToFileURL(join(root, 'src/shared/lib/mobileViewport.js')).href);

assert(HOME_VIEWPORT_LOCK_CLASS === 'gateo-home-lock-viewport', 'lock class name');
assert(HOME_CHROME_TOP_VAR === '--gateo-home-chrome-top', 'chrome top CSS var');
assert(CHROME_IOS_URLBAR_INSET_PX === 56, 'CriOS urlbar fallback px');
assert(typeof lockHomeViewport === 'function', 'lockHomeViewport export');
assert(typeof unlockHomeViewport === 'function', 'unlockHomeViewport export');
assert(typeof clearHomeChromeTop === 'function', 'clearHomeChromeTop export');
assert(typeof resolveSessionHomeChromeTopPx === 'function', 'resolveSessionHomeChromeTopPx export');
assert(typeof isCriosFirstNavigateSession === 'function', 'isCriosFirstNavigateSession export');

assert(resolveHomeChromeTopPx({ allowFallback: true }) === 56, 'CriOS fallback when unmeasured');
assert(resolveHomeChromeTopPx({ allowFallback: false }) === 0, 'no fallback when disallowed');
assert(resolveHomeChromeTopPx({ offsetTop: 12, allowFallback: true }) === 56, 'fallback is a floor on first navigate');
assert(resolveHomeChromeTopPx({ offsetTop: 80, allowFallback: true }) === 80, 'larger measurement wins floor');
assert(resolveHomeChromeTopPx({ dvhSvhGap: 40, allowFallback: false }) === 40, 'gap used when no fallback');
assert(resolveHomeChromeTopPx({ pageTop: 8, offsetTop: 2 }) === 8, 'max of measurements');

assert(isCriosFirstNavigateSession({ crios: true, navType: 'navigate' }) === true, 'CriOS navigate is first-nav session');
assert(isCriosFirstNavigateSession({ crios: true, navType: '' }) === true, 'empty nav type is first-nav');
assert(isCriosFirstNavigateSession({ crios: true, navType: 'reload' }) === false, 'reload is not first-nav');
assert(isCriosFirstNavigateSession({ crios: true, navType: 'back_forward' }) === false, 'back_forward is not first-nav');
assert(isCriosFirstNavigateSession({ crios: false, navType: 'navigate' }) === false, 'non-CriOS has no floor');

assert(
  resolveSessionHomeChromeTopPx({ crios: true, navType: 'navigate', measuredPx: 0 }) === 56,
  'session policy first-nav floor 56',
);
assert(
  resolveSessionHomeChromeTopPx({
    crios: true,
    navType: 'navigate',
    measuredPx: 0,
    visualViewportHeightDelta: -64,
  }) === 56,
  'height drop -64 must not clear first-nav 56',
);
assert(
  resolveSessionHomeChromeTopPx({
    crios: true,
    navType: 'reload',
    measuredPx: 0,
    visualViewportHeightDelta: -64,
  }) === 0,
  'reload stays 0 after height drop',
);
assert(
  resolveSessionHomeChromeTopPx({ crios: false, navType: 'navigate', visualViewportHeightDelta: -64 }) === 0,
  'non-CriOS stays 0 after height drop',
);

const stop = syncHomeChromeOnFirstPaint();
assert(typeof stop === 'function', 'first-paint returns cleanup');
stop();

const criosMock = runCriosFirstNavigateHeightDropMock();
assert(criosMock.firstPx === 56, `CriOS mock first apply is 56, got ${criosMock.firstPx}`);
assert(criosMock.dropDelta === -64, `CriOS mock height delta is -64, got ${criosMock.dropDelta}`);
assert(criosMock.afterDropPx === 56, `CriOS mock 56 must survive height drop, got ${criosMock.afterDropPx}`);
assert(criosMock.sawWebviewInset === true, 'CriOS mock still records height drop');
assert(criosMock.clearsFallback === false, 'CriOS mock must not clear fallback on drop');
assert(criosMock.headerRectTopAfterDrop >= 40, `headerRectTop after drop should not be <40, got ${criosMock.headerRectTopAfterDrop}`);
assert(criosMock.reloadPx === 0, `reload mock stays 0, got ${criosMock.reloadPx}`);
assert(criosMock.reloadAfterDropPx === 0, `reload mock stays 0 after height drop, got ${criosMock.reloadAfterDropPx}`);
console.log('crios-mock:', JSON.stringify(criosMock));

const css = read('src/index.css');
assert(
  css.includes(`html.${HOME_VIEWPORT_LOCK_CLASS}`),
  'index.css locks html with 100dvh class',
);
assert(css.includes('max-height: 100dvh'), 'index.css max-height 100dvh');
assert(css.includes(HOME_CHROME_TOP_VAR), 'index.css binds header top to CSS var');

const home = read('src/pages/Home/index.jsx');
assert(home.includes('h-[100dvh]'), 'Home root uses 100dvh not 100vh');
assert(home.includes('onSettled: lockHomeViewport'), 'Home delays html lock until chrome settled');
assert(home.includes('syncHomeChromeOnFirstPaint'), 'Home first-paint chrome sync');
assert(home.includes('clearHomeChromeTop'), 'Home clears chrome top on unmount');
assert(!/\bh-screen\b/.test(home), 'Home must not use h-screen');

const layout = read('src/shared/layout/MainLayout.jsx');
assert(layout.includes('h-[100dvh]'), 'MainLayout uses 100dvh');
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
  'CriOS first-navigate fallback exists',
);
assert(
  viewportLib.includes('resolveSessionHomeChromeTopPx'),
  'session apply policy helper exists',
);
assert(
  !viewportLib.includes('firstNavigate && !sawWebviewInset'),
  'must not clear first-navigate fallback via sawWebviewInset',
);

const indexHtml = read('index.html');
assert(indexHtml.includes('--gateo-home-chrome-top'), 'index.html sets CriOS first-nav inset before paint');
assert(indexHtml.includes('CriOS'), 'index.html gates inset to iOS Chrome');

console.log('smoke-home-chrome-viewport: PASS');

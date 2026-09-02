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

const {
  HOME_VIEWPORT_LOCK_CLASS,
  HOME_CHROME_TOP_VAR,
  CHROME_IOS_URLBAR_INSET_PX,
  lockHomeViewport,
  unlockHomeViewport,
  syncHomeChromeOnFirstPaint,
  resolveHomeChromeTopPx,
  clearHomeChromeTop,
} = await import(pathToFileURL(join(root, 'src/shared/lib/mobileViewport.js')).href);

assert(HOME_VIEWPORT_LOCK_CLASS === 'gateo-home-lock-viewport', 'lock class name');
assert(HOME_CHROME_TOP_VAR === '--gateo-home-chrome-top', 'chrome top CSS var');
assert(CHROME_IOS_URLBAR_INSET_PX === 56, 'CriOS urlbar fallback px');
assert(typeof lockHomeViewport === 'function', 'lockHomeViewport export');
assert(typeof unlockHomeViewport === 'function', 'unlockHomeViewport export');
assert(typeof clearHomeChromeTop === 'function', 'clearHomeChromeTop export');
assert(typeof syncHomeChromeOnFirstPaint === 'function', 'syncHomeChromeOnFirstPaint export');

assert(resolveHomeChromeTopPx({ allowFallback: true }) === 56, 'CriOS fallback when unmeasured');
assert(resolveHomeChromeTopPx({ allowFallback: false }) === 0, 'no fallback when disallowed');
assert(resolveHomeChromeTopPx({ offsetTop: 12, allowFallback: true }) === 56, 'fallback is a floor on first navigate');
assert(resolveHomeChromeTopPx({ offsetTop: 80, allowFallback: true }) === 80, 'larger measurement wins floor');
assert(resolveHomeChromeTopPx({ dvhSvhGap: 40, allowFallback: false }) === 40, 'gap used when no fallback');
assert(resolveHomeChromeTopPx({ pageTop: 8, offsetTop: 2 }) === 8, 'max of measurements');

const stop = syncHomeChromeOnFirstPaint();
assert(typeof stop === 'function', 'first-paint returns cleanup');
stop();

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

const indexHtml = read('index.html');
assert(indexHtml.includes('--gateo-home-chrome-top'), 'index.html sets CriOS first-nav inset before paint');
assert(indexHtml.includes('CriOS'), 'index.html gates inset to iOS Chrome');

console.log('smoke-home-chrome-viewport: PASS');

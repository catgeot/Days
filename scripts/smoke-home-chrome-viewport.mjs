#!/usr/bin/env node
/**
 * 지구본 홈 Chrome 첫 로딩 헤더 가림 — 100dvh 잠금·첫 페인트 sync SSOT.
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
  lockHomeViewport,
  unlockHomeViewport,
  syncHomeChromeOnFirstPaint,
} = await import(pathToFileURL(join(root, 'src/shared/lib/mobileViewport.js')).href);

assert(HOME_VIEWPORT_LOCK_CLASS === 'gateo-home-lock-viewport', 'lock class name');
assert(typeof lockHomeViewport === 'function', 'lockHomeViewport export');
assert(typeof unlockHomeViewport === 'function', 'unlockHomeViewport export');
assert(typeof syncHomeChromeOnFirstPaint === 'function', 'syncHomeChromeOnFirstPaint export');

const stop = syncHomeChromeOnFirstPaint();
assert(typeof stop === 'function', 'first-paint returns cleanup');
stop();

const css = read('src/index.css');
assert(
  css.includes(`html.${HOME_VIEWPORT_LOCK_CLASS}`),
  'index.css locks html with 100dvh class',
);
assert(css.includes('max-height: 100dvh'), 'index.css max-height 100dvh');

const home = read('src/pages/Home/index.jsx');
assert(home.includes('h-[100dvh]'), 'Home root uses 100dvh not 100vh');
assert(home.includes('lockHomeViewport'), 'Home locks viewport on globe chrome');
assert(home.includes('syncHomeChromeOnFirstPaint'), 'Home first-paint chrome sync');
assert(!/\bh-screen\b/.test(home), 'Home must not use h-screen');

const layout = read('src/shared/layout/MainLayout.jsx');
assert(layout.includes('h-[100dvh]'), 'MainLayout uses 100dvh');
assert(!/\bh-screen\b/.test(layout), 'MainLayout must not use h-screen');

const homeUi = read('src/pages/Home/components/HomeUI.jsx');
assert(homeUi.includes('data-home-chrome-top'), 'HomeUI header tagged for remount/hit');
assert(homeUi.includes('home-chrome-top-${homeChromeEpoch}'), 'HomeUI header remounts with epoch');

const viewportLib = read('src/shared/lib/mobileViewport.js');
assert(
  !viewportLib.includes('setTop(offsetTop'),
  'must not reintroduce continuous offsetTop binding in mobileViewport',
);

console.log('smoke-home-chrome-viewport: PASS');

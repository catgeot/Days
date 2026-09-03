#!/usr/bin/env node
/**
 * 지구본 홈 Chrome 헤더 — 배포본과 같은 h-screen · CriOS 56px/100svh 보정 없음.
 * Usage: node scripts/smoke-home-chrome-viewport.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const css = read('src/index.css');
assert(!css.includes('gateo-home-lock-viewport'), 'index.css must not html-lock overflow');
assert(!css.includes('--gateo-home-chrome-top'), 'index.css must not bind CriOS chrome-top');
assert(!css.includes('--gateo-home-viewport-height'), 'index.css must not lock viewport height var');

const home = read('src/pages/Home/index.jsx');
assert(/className="relative w-full h-screen /.test(home), 'Home shell matches PROD h-screen');
assert(!home.includes('h-[100svh]'), 'Home must not use 100svh (extra gap vs PROD)');
assert(!home.includes('syncHomeChromeOnFirstPaint'), 'Home must not run overlay first-paint sync');
assert(!home.includes('lockHomeViewport'), 'Home must not lock html overflow');
assert(!home.includes('CHROME_IOS_URLBAR_INSET_PX'), 'Home must not apply CriOS 56px');

const layout = read('src/shared/layout/MainLayout.jsx');
assert(/className="w-full h-screen /.test(layout), 'MainLayout matches PROD h-screen');
assert(!layout.includes('h-[100svh]'), 'MainLayout must not use 100svh');

const homeUi = read('src/pages/Home/components/HomeUI.jsx');
assert(
  homeUi.includes('fixed top-0 left-0 right-0 z-[100] p-4 md:p-6'),
  'HomeUI header is PROD top-0 p-4 (16px), not overlay 56px',
);

const viewportLib = read('src/shared/lib/mobileViewport.js');
assert(!viewportLib.includes('CHROME_IOS_URLBAR_INSET_PX'), 'must not reintroduce CriOS 56px floor');
assert(!viewportLib.includes('isCriosUrlbarOverlay'), 'must not reintroduce overlay detector');
assert(!viewportLib.includes('overlayLatched'), 'must not reintroduce overlay latch');
assert(!viewportLib.includes('gateo-home-lock-viewport'), 'must not reintroduce html lock class');
assert(!viewportLib.includes('setTop(offsetTop'), 'must not reintroduce continuous offsetTop binding');
assert(viewportLib.includes('h-screen'), 'mobileViewport documents PROD h-screen policy');
assert(viewportLib.includes('scheduleRecalibrateFixedChromeHits'), 'chrome hit recalibrate remains');
assert(!viewportLib.includes('agentHomeChromeLog'), 'mobileViewport must not keep agent debug logger');
assert(!viewportLib.includes('__GATEO_HOME_CHROME_DBG'), 'mobileViewport must not keep debug session key');

const indexHtml = read('index.html');
assert(!indexHtml.includes('--gateo-home-chrome-top'), 'index.html must not set CriOS inset before paint');
assert(!indexHtml.includes('CriOS'), 'index.html must not gate a Chrome-only 56px');
assert(!indexHtml.includes('__GATEO_HOME_CHROME_DBG'), 'index.html must not keep debug payload');

assert(!home.includes('agentHomeChromeLog'), 'Home effect must not keep agent logs');

const viteCfg = read('vite.config.js');
assert(!viteCfg.includes('__gateo_debug_log'), 'vite must not ingest debug logs');

console.log('smoke-home-chrome-viewport: PASS');

#!/usr/bin/env node
/**
 * 지구본 홈 Chrome 헤더 — 100svh 셸 · CriOS 56px overlay 보정 없음.
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

const HOME_SVH = 'h-[100svh] max-h-[100svh]';
const MD_DVH = 'md:h-[100dvh] md:max-h-[100dvh]';

const css = read('src/index.css');
assert(!css.includes('gateo-home-lock-viewport'), 'index.css must not html-lock overflow');
assert(!css.includes('--gateo-home-chrome-top'), 'index.css must not bind CriOS chrome-top');
assert(!css.includes('--gateo-home-viewport-height'), 'index.css must not lock viewport height var');

const home = read('src/pages/Home/index.jsx');
assert(home.includes('data-home-viewport-root'), 'Home root tagged');
assert(home.includes(HOME_SVH), 'Home uses 100svh (not 100vh)');
assert(home.includes(MD_DVH), 'Home desktop keeps 100dvh');
assert(!/\bh-screen\b/.test(home), 'Home must not use h-screen');
assert(!home.includes('syncHomeChromeOnFirstPaint'), 'Home must not run overlay first-paint sync');
assert(!home.includes('lockHomeViewport'), 'Home must not lock html overflow');
assert(!home.includes('CHROME_IOS_URLBAR_INSET_PX'), 'Home must not apply CriOS 56px');

const layout = read('src/shared/layout/MainLayout.jsx');
assert(layout.includes(HOME_SVH), 'MainLayout uses 100svh');
assert(layout.includes(MD_DVH), 'MainLayout desktop keeps 100dvh');
assert(!/\bh-screen\b/.test(layout), 'MainLayout must not use h-screen');

const homeUi = read('src/pages/Home/components/HomeUI.jsx');
assert(homeUi.includes('data-home-chrome-top'), 'HomeUI header tagged for hit recalibrate');
assert(homeUi.includes('fixed top-0 left-0 right-0 z-[100]'), 'HomeUI header is top-0 (no overlay padding)');

const viewportLib = read('src/shared/lib/mobileViewport.js');
assert(!viewportLib.includes('CHROME_IOS_URLBAR_INSET_PX'), 'must not reintroduce CriOS 56px floor');
assert(!viewportLib.includes('isCriosUrlbarOverlay'), 'must not reintroduce overlay detector');
assert(!viewportLib.includes('overlayLatched'), 'must not reintroduce overlay latch');
assert(!viewportLib.includes('gateo-home-lock-viewport'), 'must not reintroduce html lock class');
assert(!viewportLib.includes('setTop(offsetTop'), 'must not reintroduce continuous offsetTop binding');
assert(viewportLib.includes('100svh'), 'mobileViewport documents svh policy');
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

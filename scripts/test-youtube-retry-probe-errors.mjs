/**
 * Unplayable Retry + persistent embed errors: no playlist auto-advance; exhausted UI.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { createConnection } from 'node:net';
import { JSDOM } from 'jsdom';
import { chromium } from '@playwright/test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/i18n/config.js';
import YouTubePlayerView from '../src/components/PlaceCard/views/YouTubePlayerView.jsx';

async function harnessGuard() {
  if (
    !process.env.VITE_SUPABASE_URL
    || process.env.VITE_SUPABASE_URL.includes('phdjnbfitvmrguqzverm')
  ) {
    process.env.VITE_SUPABASE_URL = 'https://mock-supa.invalid';
  }
  return import('./youtube-harness-supabase-guard.mjs');
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></html>', {
  url: 'https://www.gateo.kr/place/sapa/video',
});
const { window } = dom;

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

setGlobal('window', window);
setGlobal('document', window.document);
setGlobal('navigator', window.navigator);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('DocumentFragment', window.DocumentFragment);
setGlobal('localStorage', window.localStorage);
setGlobal('sessionStorage', window.sessionStorage);
setGlobal('MutationObserver', window.MutationObserver);
setGlobal('getComputedStyle', window.getComputedStyle.bind(window));
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

const PARIS_VIDEOS = [
  { id: 'my_7f-tY1tA', title: 'Paris 1 fail', ai_context: { tags: [], timeline: [] } },
  { id: 'RSgPFcRdWig', title: 'Paris 2 play', ai_context: { tags: [], timeline: [] } },
  { id: 'lBrg_Y8vVkQ', title: 'Paris 3 skip', ai_context: { tags: [], timeline: [] } },
];

const PREVIEW_BASE = 'https://127.0.0.1:4173';

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function ensurePreview() {
  const { ensureHarnessPreviewBuild } = await harnessGuard();
  ensureHarnessPreviewBuild();
  if (await portOpen(4173)) return;
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  });
  child.unref();
  for (let i = 0; i < 40; i += 1) {
    if (await portOpen(4173)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview did not start on :4173');
}

async function setupParisCache(page, harnessNetwork) {
  const { installSupabaseHarnessGuard, installDefaultSupabaseHarnessMocks } = await harnessGuard();
  await installSupabaseHarnessGuard(page, harnessNetwork);
  await installDefaultSupabaseHarnessMocks(page);
  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({ videos: PARIS_VIDEOS }),
    });
  });
  await page.route('**/rest/v1/rpc/increment_place_stats**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await page.route('**/rest/v1/place_stats**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/functions/v1/pexels-proxy**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"photos":[]}' });
  });
}

async function injectEmbedError150(page) {
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
    if (!iframe?.contentWindow) throw new Error('YouTube iframe not found');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ event: 'onError', info: 150 }),
        origin: 'https://www.youtube.com',
        source: iframe.contentWindow,
      }),
    );
  });
}

test('retry exhausted on no-playable screen shows only YouTube CTA', async () => {
  globalThis.sessionStorage.clear();
  globalThis.sessionStorage.setItem('gateo.yt.retryExhausted:/place/sapa/video', '1');
  const el = globalThis.document.getElementById('root');
  const root = createRoot(el);
  await act(async () => {
    root.render(
      React.createElement(YouTubePlayerView, {
        videoId: '',
        videos: [],
        isFullScreen: false,
        toggleFullScreen: () => {},
        showUI: true,
        isLoading: false,
        isEmptyResult: false,
        fetchError: false,
        onRetryUnplayable: () => {},
        placeYouTubeUrl: 'https://www.youtube.com/results?search_query=Sapa%20Vietnam',
      }),
    );
    await new Promise((r) => setTimeout(r, 0));
  });

  const retryBtn = [...globalThis.document.querySelectorAll('button')].find((b) =>
    b.textContent.includes('다시 시도'),
  );
  assert.equal(retryBtn, undefined);
  const yt = [...globalThis.document.querySelectorAll('a')].find((a) =>
    a.textContent.includes('YouTube'),
  );
  assert.ok(yt);
  await act(async () => {
    root.unmount();
  });
});

test('embed error without retry probe advances to the next video', async () => {
  await ensurePreview();
  const { createHarnessNetworkState } = await harnessGuard();
  const harnessNetwork = createHarnessNetworkState();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await context.addInitScript(() => {
    localStorage.removeItem('gateo.yt.unplayable.v1');
    sessionStorage.clear();
  });
  await setupParisCache(page, harnessNetwork);
  await page.goto(`${PREVIEW_BASE}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1200);
  await page.locator('.aspect-video').first().click({ timeout: 20000 });
  await page.waitForSelector('iframe[src*="youtube.com/embed/my_7f-tY1tA"]', { timeout: 20000 });
  await injectEmbedError150(page);
  await page.waitForTimeout(2000);
  const iframeSrc = await page.locator('iframe[src*="youtube.com/embed"]').first().getAttribute('src');
  await browser.close();
  assert.ok(iframeSrc?.includes('RSgPFcRdWig'), `expected auto-advance to 2nd video, got ${iframeSrc}`);
  assert.ok(!iframeSrc?.includes('my_7f-tY1tA'));
});

test('retry probe: embed error after unplayable retry does not auto-advance', async () => {
  await ensurePreview();
  const { createHarnessNetworkState } = await harnessGuard();
  const harnessNetwork = createHarnessNetworkState();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const allIds = PARIS_VIDEOS.map((v) => v.id);
  await context.addInitScript((ids) => {
    localStorage.setItem('gateo.locale', 'ko');
    localStorage.setItem(
      'gateo.yt.unplayable.v1',
      JSON.stringify({ ids, updatedAt: Date.now() }),
    );
    sessionStorage.removeItem('gateo.yt.retryExhausted:/place/paris/video');
  }, allIds);
  await setupParisCache(page, harnessNetwork);
  await page.goto(`${PREVIEW_BASE}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1200);
  await page.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: '다시 시도' }).click();
  await page.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ state: 'hidden', timeout: 20000 });
  await page.locator('.aspect-video').first().click({ timeout: 20000 });
  await page.waitForSelector('iframe[src*="youtube.com/embed/my_7f-tY1tA"]', { timeout: 20000 });
  await injectEmbedError150(page);
  await page.waitForTimeout(2000);
  const iframeCount = await page.locator('iframe[src*="youtube.com/embed"]').count();
  const exhausted = await page.evaluate(() =>
    sessionStorage.getItem('gateo.yt.retryExhausted:/place/paris/video'),
  );
  const unplayableRaw = await page.evaluate(() => localStorage.getItem('gateo.yt.unplayable.v1'));
  await browser.close();

  assert.equal(exhausted, '1', 'retry probe should mark session exhausted');
  assert.equal(iframeCount, 0, 'probe error should stop embed (no iframe)');
  const parsed = JSON.parse(unplayableRaw || '{}');
  assert.equal(parsed.ids?.length, 1, 'only the probed video should be re-marked unplayable');
  assert.equal(parsed.ids?.[0], 'my_7f-tY1tA');
  assert.ok(!parsed.ids.includes('RSgPFcRdWig'), 'must not chain-mark the next video');
});

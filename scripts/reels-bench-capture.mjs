#!/usr/bin/env node
/**
 * Admin reels bench captures — Supabase admin mock only; reels CDN is real network.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = '/cursor/stores/self/reels-bench';

const BASE = process.env.REELS_BENCH_CAPTURE_BASE || 'https://127.0.0.1:4173';
const ROUTE = '/admin/reels-bench';
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] || 'phdjnbfitvmrguqzverm';
const AUTH_STORAGE_KEY = `sb-${SUPABASE_REF}-auth-token`;

function sessionPayload() {
  return {
    access_token: 'mock-access',
    refresh_token: 'mock-refresh',
    expires_in: 86_400,
    expires_at: Math.floor(Date.now() / 1000) + 86_400,
    token_type: 'bearer',
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'bench@gateo.invalid',
    },
  };
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'content-type': 'application/json',
  };
}

async function installSupabaseMock(page, { admin }) {
  const headers = corsHeaders();
  const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).host : '*.supabase.co';
  await page.route(`**/${supabaseHost}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    if (path.includes('/rpc/am_i_app_admin')) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(admin === true),
      });
    }
    if (path.includes('/auth/v1/user') || path.includes('/auth/v1/session')) {
      if (!admin) {
        return route.fulfill({ status: 401, headers, body: JSON.stringify({ message: 'not authed' }) });
      }
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(sessionPayload().user),
      });
    }
    if (path.includes('/auth/v1/token')) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(sessionPayload()),
      });
    }
    return route.fulfill({ status: 200, headers, body: '[]' });
  });
}

async function seedSession(page, loggedIn) {
  await page.addInitScript(
    ({ on, authKey, session }) => {
      if (!on) return;
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    { on: loggedIn, authKey: AUTH_STORAGE_KEY, session: sessionPayload() },
  );
}

function assertNoMp4InDom(html) {
  if (/reels\.findable\.kr.*\.mp4/.test(html)) {
    throw new Error('non-admin DOM leaked mp4 URL');
  }
}

async function clipViewportShot(page, path, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  const clip = { x: 0, y: 0, width, height, scale: 1 };
  try {
    await page.screenshot({
      path,
      clip,
      timeout: 15_000,
      animations: 'disabled',
    });
  } catch {
    const cdp = await page.context().newCDPSession(page);
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { ...clip, scale: 1 },
      fromSurface: true,
    });
    writeFileSync(path, Buffer.from(data, 'base64'));
  }
}

async function prepareAdminBench(page) {
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.getByRole('heading', { name: '릴스 테스트 벤치' }).waitFor({ timeout: 30_000 });

  const articles = page.locator('article');
  const card1 = articles.filter({ hasText: '릴스 #01' });
  const card2 = articles.filter({ hasText: '릴스 #02' });

  await card1.scrollIntoViewIfNeeded();
  const video1 = card1.locator('video');
  await expectPoster(video1, 'reel-final-01-cap1.png');
  await waitVideoSrc(video1, /reel-final-01\.mp4/, page);
  await waitVideoReady(video1, page);

  await card2.getByRole('button', { name: /개별:/ }).click();
  const btn2Text = await card2.getByRole('button', { name: /개별:/ }).innerText();
  assert.match(btn2Text, /웹 고정/);
  await card2.scrollIntoViewIfNeeded();
  const video2 = card2.locator('video');
  await waitVideoSrc(video2, /reel-web-02\.mp4/, page);
  await waitVideoReady(video2, page);

  await video1.evaluate((v) => {
    v.muted = true;
    void v.play();
  });
  await video2.evaluate((v) => {
    v.muted = true;
    void v.play();
  });
  await waitVideoPlaying(video1, page);
  await waitVideoPlaying(video2, page);
  await page.waitForTimeout(800);
}

async function waitVideoPlaying(videoLocator, page) {
  const handle = await videoLocator.elementHandle();
  await page.waitForFunction(
    (el) => el && !el.paused && el.currentTime > 0.25,
    handle,
    { timeout: 60_000 },
  );
}

async function expectPoster(videoLocator, fragment) {
  await videoLocator.waitFor({ state: 'visible' });
  const poster = await videoLocator.getAttribute('poster');
  if (!poster?.includes(fragment)) {
    throw new Error(`Expected poster ${fragment}, got ${poster}`);
  }
}

async function waitVideoSrc(videoLocator, pattern, page) {
  const handle = await videoLocator.elementHandle();
  if (!handle) throw new Error('video missing');
  await page.waitForFunction(
    ({ el, re }) => el && new RegExp(re).test(el.currentSrc || el.src || ''),
    { el: handle, re: pattern.source },
    { timeout: 120_000 },
  );
}

async function waitVideoReady(videoLocator, page) {
  const handle = await videoLocator.elementHandle();
  await page.waitForFunction((el) => el && el.readyState >= 2, handle, { timeout: 120_000 });
}

async function main() {
  mkdirSync(join(outDir, 'proof'), { recursive: true });

  const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
  const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8');
  writeFileSync(join(outDir, 'proof', 'robots-admin-snippet.txt'), robots);
  writeFileSync(
    join(outDir, 'proof', 'sitemap-no-reels-bench.txt'),
    sitemap.includes('reels-bench') ? 'FAIL: found reels-bench' : 'OK: no reels-bench in sitemap.xml',
  );

  const probe = await fetch('https://reels.findable.kr/reels/2026-10/reel-final-01-cap1.png', {
    method: 'HEAD',
  });
  writeFileSync(
    join(outDir, 'proof', 'cdn-reachability.txt'),
    `reels.findable.kr HEAD poster: ${probe.status} ${probe.headers.get('content-length') || ''}`,
  );
  if (!probe.ok) {
    throw new Error(`VM cannot reach reels.findable.kr (HTTP ${probe.status})`);
  }

  const browser = await chromium.launch();
  const ignoreHttps = { ignoreHTTPSErrors: true };

  async function newCaptureContext() {
    const ctx = await browser.newContext(ignoreHttps);
    await ctx.route(/\.(woff2?|ttf|otf)(\?|$)/i, (route) => route.abort());
    await ctx.route('**/fonts.googleapis.com/**', (route) => route.abort());
    await ctx.route('**/fonts.gstatic.com/**', (route) => route.abort());
    return ctx;
  }

  {
    const ctx = await newCaptureContext();
    const page = await ctx.newPage();
    await installSupabaseMock(page, { admin: false });
    await seedSession(page, false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'domcontentloaded' });
    await clipViewportShot(page, join(outDir, 'non-admin-390.png'), 390);
    assertNoMp4InDom(await page.content());
    await ctx.close();
  }

  for (const width of [390, 1280]) {
    const ctx = await newCaptureContext();
    const page = await ctx.newPage();
    await installSupabaseMock(page, { admin: true });
    await seedSession(page, true);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await prepareAdminBench(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await clipViewportShot(page, join(outDir, `admin-${width}.png`), width);
    const meta = await page.locator('meta[name="robots"]').getAttribute('content');
    writeFileSync(join(outDir, 'proof', `noindex-${width}.txt`), meta || 'missing robots meta');
    await ctx.close();
  }

  await browser.close();
  console.log(`Captures written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

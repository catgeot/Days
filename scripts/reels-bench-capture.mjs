#!/usr/bin/env node
/**
 * Admin reels bench captures for PR evidence.
 * Mocks Supabase am_i_app_admin — no production DB writes.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
  await page.route('https://reels.findable.kr/**', async (route) => {
    const url = route.request().url();
    if (route.request().method() === 'HEAD') {
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'video/mp4', 'content-length': '1048576' },
      });
    }
    if (url.endsWith('.png')) {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64',
        ),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'video/mp4',
      body: Buffer.alloc(64),
    });
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

async function clipViewportShot(page, path, width, { waitHeading = false } = {}) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  if (waitHeading) {
    await page.getByRole('heading', { name: '릴스 테스트 벤치' }).waitFor({ timeout: 20_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
  }
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height: width === 390 ? 844 : 900 },
  });
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

  const browser = await chromium.launch();

  const ignoreHttps = { ignoreHTTPSErrors: true };

  {
    const ctx = await browser.newContext(ignoreHttps);
    const page = await ctx.newPage();
    await installSupabaseMock(page, { admin: false });
    await seedSession(page, false);
    await clipViewportShot(page, join(outDir, 'non-admin-390.png'), 390);
    const html = await page.content();
    assertNoMp4InDom(html);
    await ctx.close();
  }

  for (const width of [390, 1280]) {
    const ctx = await browser.newContext(ignoreHttps);
    const page = await ctx.newPage();
    await installSupabaseMock(page, { admin: true });
    await seedSession(page, true);
    await clipViewportShot(page, join(outDir, `admin-${width}.png`), width, { waitHeading: true });
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

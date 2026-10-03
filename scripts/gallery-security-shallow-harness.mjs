#!/usr/bin/env node
/**
 * Local mock harness — never forwards to prod Supabase.
 * Requires: vite dev on BASE_URL (default http://127.0.0.1:5199) with VITE_SUPABASE_URL=https://mock-supa.invalid
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.GALLERY_HARNESS_OUT || '/opt/cursor/artifacts/gallery-security';
const BASE = process.env.GALLERY_HARNESS_BASE || 'https://127.0.0.1:5199';
const ADMIN_UID = 'f31e47ac-144d-41e3-9ef9-441a2d008424';

mkdirSync(join(OUT, 'shots'), { recursive: true });
mkdirSync(join(OUT, 'raw'), { recursive: true });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const gallery = Array.from({ length: 12 }, (_, i) => ({
  id: `mock-${i}`,
  source: 'unsplash',
  width: 800,
  height: 600,
  urls: {
    small: `https://img.mock.invalid/${i}.png`,
    regular: `https://img.mock.invalid/${i}.png`,
  },
  user: { name: 'Mock' },
}));

function placeStatsWrites(log) {
  return log.filter(
    (e) =>
      e.method &&
      e.method !== 'GET' &&
      e.path &&
      String(e.path).includes('place_stats'),
  );
}

async function seedAuthStorage(page, adminSession) {
  await page.addInitScript(
    ({ admin, uid }) => {
      const key = 'sb-mock-supa-auth-token';
      if (!admin) {
        localStorage.removeItem(key);
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      localStorage.setItem(
        key,
        JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: now + 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: uid,
            email: 'admin-harness@gateo.invalid',
            aud: 'authenticated',
            role: 'authenticated',
          },
        }),
      );
    },
    { admin: adminSession, uid: ADMIN_UID },
  );
}

async function installRoutes(ctx, { adminMode = false } = {}) {
  const log = [];
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') return route.continue();
    if (u.hostname === 'img.mock.invalid') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    if (u.hostname === 'api.unsplash.com' || u.hostname === 'images.unsplash.com') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (u.hostname === 'api.pexels.com') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"photos":[],"page":1,"per_page":15,"total_results":0}' });
    }
    if (u.hostname === 'mock-supa.invalid') {
      const entry = {
        method: req.method(),
        path: u.pathname,
        query: u.search,
        body: req.postData(),
      };
      log.push(entry);
      if (req.method() === 'GET' && u.pathname.endsWith('/auth/v1/user')) {
        const auth = req.headers().authorization || '';
        if (adminMode || auth.includes('mock-access-token')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: ADMIN_UID,
              email: 'admin-harness@gateo.invalid',
              aud: 'authenticated',
              role: 'authenticated',
            }),
          });
        }
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'not logged in' }),
        });
      }
      if (req.method() === 'GET' && u.pathname.endsWith('/auth/v1/session')) {
        const auth = req.headers().authorization || '';
        if (adminMode || auth.includes('mock-access-token')) {
          const now = Math.floor(Date.now() / 1000);
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'mock-access-token',
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: now + 3600,
              refresh_token: 'mock-refresh-token',
              user: {
                id: ADMIN_UID,
                email: 'admin-harness@gateo.invalid',
                aud: 'authenticated',
                role: 'authenticated',
              },
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(null),
        });
      }
      if (req.method() === 'GET' && u.pathname.endsWith('/place_stats')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              place_id: 'bangkok',
              image_url: gallery[0].urls.small,
              gallery_urls: gallery,
            },
          ]),
        });
      }
      if (req.method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.fulfill({ status: 204, body: '' });
    }
    log.push({ aborted: `${req.method()} ${u.hostname}${u.pathname}` });
    return route.abort();
  });
  return log;
}

async function waitGalleryTiles(page) {
  const tiles = page.locator('img[src^="https://img.mock.invalid"]');
  await tiles.first().waitFor({ state: 'visible', timeout: 45_000 });
  return tiles;
}

async function longPressTile(page, tileLocator, browserName) {
  const box = await tileLocator.boundingBox();
  if (!box) throw new Error('tile bounding box missing');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await page.waitForTimeout(900);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  await tileLocator.dispatchEvent('touchstart', { touches: [{ clientX: x, clientY: y }] });
  await page.waitForTimeout(900);
  await tileLocator.dispatchEvent('touchend', {});
}

async function runScenario(browserType, profile) {
  const isMobile = profile.includes('mobile');
  const contextOptions = {
    ignoreHTTPSErrors: true,
    ...(isMobile
      ? {
          viewport: { width: 390, height: 844 },
          hasTouch: true,
          isMobile: true,
          deviceScaleFactor: 2,
        }
      : { viewport: { width: 1280, height: 900 } }),
  };

  const results = {};

  // --- logged-out hide: 0 place_stats writes ---
  const guestBrowser = await browserType.launch();
  const guestCtx = await guestBrowser.newContext(contextOptions);
  const logGuest = await installRoutes(guestCtx);
  const page = await guestCtx.newPage();
  await seedAuthStorage(page, false);
  await page.goto(`${BASE}/place/bangkok/gallery`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  const tiles = await waitGalleryTiles(page);
  const before = await tiles.count();
  await page.screenshot({ path: join(OUT, 'shots', `${profile}-guest-before.png`) });
  const markGuest = logGuest.length;

  if (isMobile) {
    const t = tiles.nth(1);
    await longPressTile(page, t, browserType.name());
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(OUT, 'shots', `${profile}-guest-sheet.png`) });
    await page.getByRole('button', { name: /숨기기|Hide this photo/i }).first().click();
  } else {
    const t = tiles.nth(1);
    const box = await t.boundingBox();
    await page.keyboard.down('Control');
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.up('Control');
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, 'shots', `${profile}-guest-sheet-desktop.png`) });
    const sheetVisible = await page.getByRole('dialog').count();
    results.ctrlDblOpensSheet = sheetVisible > 0;
    await page.getByRole('button', { name: /숨기기|Hide this photo/i }).first().click();
  }

  await page.waitForTimeout(800);
  const after = await tiles.count();
  const guestWrites = placeStatsWrites(logGuest.slice(markGuest));
  results.guestHideWrites = guestWrites.length;
  results.tilesBefore = before;
  results.tilesAfter = after;

  const bodyText = await page.locator('#gallery-manage-title').textContent().catch(() => '');
  const pageHtml = await page.content();
  results.noLegacyCopy =
    !pageHtml.includes('갤러리에서 제거') && !pageHtml.includes('저장된 목록에서도 빠집니다');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const afterReload = await page.locator('img[src^="https://img.mock.invalid"]').count();
  results.hiddenAfterReload = afterReload === after;

  // report: still 0 writes
  const markReport = logGuest.length;
  if (isMobile) {
    const t2 = page.locator('img[src^="https://img.mock.invalid"]').nth(2);
    await longPressTile(page, t2, browserType.name());
    await page.waitForTimeout(500);
  } else {
    const t2 = page.locator('img[src^="https://img.mock.invalid"]').nth(2);
    const box2 = await t2.boundingBox();
    await page.keyboard.down('Control');
    await page.mouse.dblclick(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await page.keyboard.up('Control');
    await page.waitForTimeout(400);
  }
  await page.getByRole('button', { name: /신고|Report inappropriate/i }).first().click();
  await page.waitForTimeout(500);
  results.guestReportWrites = placeStatsWrites(logGuest.slice(markReport)).length;

  await page.close();
  await guestBrowser.close();

  // --- admin session: PATCH on admin remove ---
  const adminBrowser = await browserType.launch();
  const adminCtx = await adminBrowser.newContext(contextOptions);
  const logAdmin = await installRoutes(adminCtx, { adminMode: true });
  const adminPage = await adminCtx.newPage();
  await seedAuthStorage(adminPage, true);
  await adminPage.goto(`${BASE}/place/bangkok/gallery`, { waitUntil: 'domcontentloaded' });
  const adminTiles = await waitGalleryTiles(adminPage);
  const markAdmin = logAdmin.length;
  const at = adminTiles.nth(1);
  const abox = await at.boundingBox();
  if (isMobile) {
    await longPressTile(adminPage, at, browserType.name());
    await adminPage.waitForTimeout(500);
  } else {
    await adminPage.keyboard.down('Control');
    await adminPage.mouse.dblclick(abox.x + abox.width / 2, abox.y + abox.height / 2);
    await adminPage.keyboard.up('Control');
    await adminPage.waitForTimeout(400);
  }
  const adminBtn = adminPage.getByRole('button', { name: /관리자|Admin:/i });
  await adminBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
  await adminPage.screenshot({ path: join(OUT, 'shots', `${profile}-admin-sheet.png`) });
  await adminBtn.first().click();
  await adminPage.waitForTimeout(1200);
  const adminWrites = placeStatsWrites(logAdmin.slice(markAdmin));
  results.adminPatchCount = adminWrites.filter((w) => w.method === 'PATCH').length;
  results.adminPatchBody = adminWrites.find((w) => w.method === 'PATCH')?.body || null;

  await adminPage.close();
  await adminBrowser.close();

  results.profile = profile;
  results.browser = browserType.name();
  results.manageTitle = bodyText;
  writeFileSync(join(OUT, 'raw', `${profile}-${browserType.name()}.json`), JSON.stringify(results, null, 2));
  return results;
}

const summary = [];
for (const [browserType, profile] of [
  [chromium, 'desktop-chromium'],
  [webkit, 'mobile-webkit'],
]) {
  summary.push(await runScenario(browserType, profile));
}

assert.ok(summary.every((r) => r.guestHideWrites === 0), 'guest hide: 0 place_stats writes');
assert.ok(summary.every((r) => r.guestReportWrites === 0), 'guest report: 0 place_stats writes');
assert.ok(summary.every((r) => r.adminPatchCount >= 1), 'admin: PATCH place_stats');
assert.ok(summary.every((r) => r.hiddenAfterReload), 'hidden survives reload');
assert.ok(summary.every((r) => r.noLegacyCopy), 'legacy global-remove copy gone');
assert.ok(
  summary.filter((r) => r.browser === 'chromium').every((r) => r.ctrlDblOpensSheet),
  'desktop ctrl+dblclick opens sheet',
);

writeFileSync(join(OUT, 'pass-summary.json'), JSON.stringify({ pass: true, summary }, null, 2));
console.log(JSON.stringify({ pass: true, summary }, null, 2));

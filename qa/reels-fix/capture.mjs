// 수정 전·후 화면 캡처 (390·1280) — 운영 DB 쓰기 요청(REST POST/PATCH/RPC)·Gemini는 차단한다.
// before: BASE=https://www.gateo.kr LABEL=before node qa/reels-fix/capture.mjs
// after : BASE=http://127.0.0.1:5180 LABEL=after node qa/reels-fix/capture.mjs
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.BASE || 'https://www.gateo.kr').replace(/\/$/, '');
const LABEL = process.env.LABEL || 'before';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));
const READ_ONLY_FUNCTIONS = /\/functions\/v1\/(tourapi-proxy|resolve-flight-route)(\?|$)/;
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
];

async function newGuardedContext(browser, viewport, { hangFlightRoute = false } = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  });
  await context.route(/\/rest\/v1\//, (route) =>
    ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort(),
  );
  await context.route(/\/functions\/v1\//, (route) => {
    const url = route.request().url();
    if (hangFlightRoute && /resolve-flight-route/.test(url)) return undefined;
    return READ_ONLY_FUNCTIONS.test(url) || route.request().method() === 'OPTIONS'
      ? route.continue()
      : route.abort();
  });
  return context;
}

async function shot(page, viewport, name) {
  const file = path.join(OUT_DIR, `${LABEL}-${name}-${viewport.width}.png`);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log('saved', path.relative(process.cwd(), file));
}

async function openExploreSearch(page, query) {
  await page.goto(`${BASE}/explore`);
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ timeout: 90_000 });
  await input.fill(query);
  await page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' }).first()
    .waitFor({ timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(6000);
}

async function openChujadoIslandCard(page) {
  await openExploreSearch(page, 'Chujado');
  await page
    .locator('[data-search-popover] button')
    .filter({ hasText: /Chujado Island/ })
    .first()
    .click();
}

async function summaryFlightState(page) {
  const text = await page.locator('body').innerText();
  return {
    origin: (text.match(/인천|김포/g) || []).slice(0, 2),
    route: text.match(/[A-Z]{3}( → [A-Z]{3})+/)?.[0] ?? null,
    button: text.match(/조회 중…|갱신 중…|항공 경로(?! 조회)|준비 중…/)?.[0] ?? null,
  };
}

// ONLY=4,5 → 해당 문제 장면만
const ONLY = new Set(String(process.env.ONLY || '1,2,3,4,5').split(',').map((s) => s.trim()));

async function captureSearchRows(browser, viewport, name, query) {
  const context = await newGuardedContext(browser, viewport);
  const page = await context.newPage();
  await openExploreSearch(page, query);
  const rows = await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .allInnerTexts();
  console.log(LABEL, viewport.width, name, rows.map((r) => r.replace(/\s+/g, ' ').trim()));
  await shot(page, viewport, name);
  await context.close();
}

async function captureSearchTap(browser, viewport, name, query) {
  const context = await newGuardedContext(browser, viewport);
  const page = await context.newPage();
  await openExploreSearch(page, query);
  await page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' }).first().click();
  await page.waitForTimeout(10_000);
  console.log(LABEL, viewport.width, name, decodeURIComponent(page.url()));
  await shot(page, viewport, name);
  await context.close();
}

const browser = await chromium.launch();
try {
  for (const viewport of VIEWPORTS) {
    if (ONLY.has('4')) {
      await captureSearchRows(browser, viewport, '4-search-alias-suwolbong', '수월봉');
      await captureSearchRows(browser, viewport, '4-search-alias-dakmeoru', '닭머르해안');
    }
    if (ONLY.has('5')) {
      await captureSearchTap(browser, viewport, '5-tap-hyeongjeseom', '형제섬');
      await captureSearchTap(browser, viewport, '5-tap-yongnuni', '용눈이오름');
      await captureSearchTap(browser, viewport, '5-tap-anmyeonam', '안면암');
    }
    if (!ONLY.has('1') && !ONLY.has('2') && !ONLY.has('3')) continue;
    if (ONLY.has('1')) {
      const context = await newGuardedContext(browser, viewport);
      const page = await context.newPage();
      await openChujadoIslandCard(page);
      await page.waitForTimeout(25_000);
      console.log(LABEL, viewport.width, '1-jeju-flight-origin', await summaryFlightState(page));
      await shot(page, viewport, '1-jeju-flight-origin');
      await context.close();
    }
    if (ONLY.has('2')) {
      await captureSearchRows(browser, viewport, '2-search-chujado-ko', '추자도');
      await captureSearchRows(browser, viewport, '2-search-chujado-en', 'Chujado');
    }
    if (ONLY.has('3')) {
      const context = await newGuardedContext(browser, viewport, { hangFlightRoute: true });
      const page = await context.newPage();
      await openChujadoIslandCard(page);
      await page.waitForTimeout(20_000);
      console.log(LABEL, viewport.width, '3-chujado-card-edge-hang', await summaryFlightState(page));
      await shot(page, viewport, '3-chujado-card-edge-hang');
      await context.close();
    }
  }
} finally {
  await browser.close();
}

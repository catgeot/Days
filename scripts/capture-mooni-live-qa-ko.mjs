import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildGeminiProxyMockBody } from '../e2e/gemini-proxy-mock-response.js';

const outDir = '/opt/cursor/artifacts/screenshots';
mkdirSync(outDir, { recursive: true });
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4174';

const GILI_ITINERARY = `길리메노 3박 4일 일정 (mock)

**1일차** 발리 터미널 → 페리
**2일차** 스노클링
**3일차** 휴식`;

const RESTAURANT_MOCK = `길리메노 맛집 (mock)

해안가 **Warung** — 생선구이가 좋아요.
일정 저장은 [플래너 보기](https://planner.example.com/plan)를 참고하세요.`;

async function installRoute(context, handler) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON();
    const ut = String(body?.params?.userText ?? '');
    const text = handler(ut);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(text, { finishReason: 'STOP', truncated: false }),
      ),
    });
  });
}

async function openMooniChat(page, slug = 'gili-meno') {
  await page.goto(`${base}/place/${slug}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.place-header-mooni-btn').click();
  await page.locator('form input[type="text"]:visible').first().waitFor({ timeout: 30_000 });
}

async function sendChat(page, text) {
  const input = page.locator('form input[type="text"]:visible').first();
  await input.fill(text);
  await input.press('Enter');
}

async function shot(page, viewport, basename) {
  await page.setViewportSize(viewport);
  const suffix = viewport.width >= 1000 ? '1280' : '390';
  await page.screenshot({ path: join(outDir, `${basename}-${suffix}.png`), fullPage: false });
}

async function captureCollapsed(browser) {
  const context = await browser.newContext({ locale: 'ko-KR' });
  await context.addInitScript(() => localStorage.setItem('gateo.locale', 'ko'));
  await installRoute(context, (ut) => {
    if (ut.includes('다시')) return GILI_ITINERARY;
    return GILI_ITINERARY;
  });
  const page = await context.newPage();
  await openMooniChat(page);
  await sendChat(page, '길리메노 3박 4일 페리 일정 짜줘');
  await page.locator('.mooni-chat-markdown strong').filter({ hasText: '1일차' }).waitFor({
    timeout: 60_000,
  });
  await sendChat(page, '길리메노 3박 4일 페리 일정 다시 짜줘');
  await page.getByRole('button', { name: /예약·정보 다시 보기/ }).waitFor({ timeout: 60_000 });
  await shot(page, { width: 390, height: 844 }, 'mooni-qa-collapsed');
  await shot(page, { width: 1280, height: 900 }, 'mooni-qa-collapsed');
  await context.close();
}

async function captureGiliFerry(browser) {
  const context = await browser.newContext({ locale: 'ko-KR' });
  await context.addInitScript(() => localStorage.setItem('gateo.locale', 'ko'));
  await installRoute(context, () => GILI_ITINERARY);
  const page = await context.newPage();
  await openMooniChat(page);
  await sendChat(page, '길리메노 3박 4일 페리 일정 짜줘');
  await page.getByRole('link', { name: /페리 · Eka Jaya/ }).waitFor({ timeout: 60_000 });
  await shot(page, { width: 390, height: 844 }, 'mooni-qa-gili-ferry');
  await shot(page, { width: 1280, height: 900 }, 'mooni-qa-gili-ferry');
  await context.close();
}

async function capturePlaceholder(browser) {
  const context = await browser.newContext({ locale: 'ko-KR' });
  await context.addInitScript(() => localStorage.setItem('gateo.locale', 'ko'));
  await installRoute(context, () => RESTAURANT_MOCK);
  const page = await context.newPage();
  await openMooniChat(page);
  await sendChat(page, '길리메노 맛집 추천해줘');
  await page.getByText('Warung', { exact: false }).waitFor({ timeout: 60_000 });
  await shot(page, { width: 390, height: 844 }, 'mooni-qa-placeholder-link');
  await shot(page, { width: 1280, height: 900 }, 'mooni-qa-placeholder-link');
  await context.close();
}

const browser = await chromium.launch();
await captureCollapsed(browser);
await captureGiliFerry(browser);
await capturePlaceholder(browser);
await browser.close();
console.log('saved', outDir);

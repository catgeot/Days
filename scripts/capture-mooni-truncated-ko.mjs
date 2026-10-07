import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildGeminiProxyMockBody } from '../e2e/gemini-proxy-mock-response.js';

const outDir = '/opt/cursor/artifacts/screenshots';
mkdirSync(outDir, { recursive: true });
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4174';

const truncatedBody = `미야코지마 3박 4일 일정 (mock)

**1일차** 시모지 공항 → 히라라
히라라 시내 저녁

**2일차** 요시노 해변 오전 · 오후 스노클`;

const continueBody = `링과 일몰 맛집

**3일차** 이리부 다리 · 드라이브
**4일차** 공항 이동 · 출발`;

let callCount = 0;

async function installMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON();
    const ut = String(body?.params?.userText ?? '');
    const isContinue = ut.includes('끊긴 지점') || ut.includes('이어서');
    callCount += 1;
    const text = isContinue ? continueBody : truncatedBody;
    const truncated = !isContinue;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(text, {
          finishReason: truncated ? 'MAX_TOKENS' : 'STOP',
          truncated,
        }),
      ),
    });
  });
}

async function run(viewport, name) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, locale: 'ko-KR' });
  await context.addInitScript(() => localStorage.setItem('gateo.locale', 'ko'));
  await installMock(context);
  const page = await context.newPage();
  await page.goto(`${base}/place/miyakojima`, { waitUntil: 'domcontentloaded' });
  await page.locator('.place-header-mooni-btn').click();
  await page.locator('form input[type="text"]:visible').first().fill('미야코지마 3박 4일 일정 짜줘');
  await page.locator('form input[type="text"]:visible').first().press('Enter');
  await page.getByText('이어서 보기').waitFor({ timeout: 60_000 });
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await browser.close();
}

async function runAfterContinue(viewport, name) {
  callCount = 0;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, locale: 'ko-KR' });
  await context.addInitScript(() => localStorage.setItem('gateo.locale', 'ko'));
  await installMock(context);
  const page = await context.newPage();
  await page.goto(`${base}/place/miyakojima`, { waitUntil: 'domcontentloaded' });
  await page.locator('.place-header-mooni-btn').click();
  await page.locator('form input[type="text"]:visible').first().fill('미야코지마 3박 4일 일정 짜줘');
  await page.locator('form input[type="text"]:visible').first().press('Enter');
  await page.getByText('이어서 보기').click();
  await page.getByText('4일차', { exact: false }).waitFor({ timeout: 60_000 });
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  await browser.close();
}

await run({ width: 1280, height: 900 }, 'mooni-truncated-1280.png');
await run({ width: 390, height: 844 }, 'mooni-truncated-390.png');
await runAfterContinue({ width: 390, height: 844 }, 'mooni-truncated-390-continued.png');
console.log('saved', outDir);

/**
 * MOONi 일정 카드 스크린샷 (1280 / 390) — gemini mock.
 *   npx vite preview --host 127.0.0.1 --port 4173 &
 *   node scripts/capture-mooni-itinerary-cards.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGeminiProxyMockBody } from '../e2e/gemini-proxy-mock-response.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = '/opt/cursor/artifacts/screenshots';
mkdirSync(outDir, { recursive: true });

const base =
  process.env.PREVIEW_URL ||
  'https://days-git-cursor-mooni-itinerary-booking-1fc4-catgeots-projects.vercel.app';
const LOCALE_KEY = 'gateo.locale';
const mockReply = `미야코지마 3박 4일 일정 (mock)

**1일차** 시모지 공항 → 히라라 시내
**2일차** 요시노 해변 · 동굴
**3일차** 이리부 다리
**4일차** 출발`;

async function installMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(mockReply, { modelUsed: 'mock-itinerary-capture' }),
      ),
    });
  });
}

async function capture(viewport, filename) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await context.addInitScript((key) => {
    localStorage.setItem(key, 'ko');
  }, LOCALE_KEY);
  await installMock(context);
  const page = await context.newPage();
  await page.goto(`${base}/place/miyakojima`, { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await page.locator('.place-header-mooni-btn').click({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const input = page.locator('form input[type="text"]:visible').first();
  await input.waitFor({ state: 'visible', timeout: 30_000 });
  await input.fill('미야코지마 3박 4일 일정 짜줘');
  await input.press('Enter');
  await page.getByText('미야코지마 3박 4일 일정', { exact: false }).waitFor({ timeout: 60_000 });
  await page.waitForSelector('[data-partner-booking-handoff="cta"]', { timeout: 60_000 });
  await page.getByText('교통 · 티켓', { exact: false }).scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);

  await page.screenshot({ path: join(outDir, filename), fullPage: false });
  await browser.close();
}

await capture({ width: 1280, height: 900 }, 'mooni-itinerary-cards-1280.png');
await capture({ width: 390, height: 844 }, 'mooni-itinerary-cards-390.png');
console.log(`saved ${outDir}/mooni-itinerary-cards-1280.png`);
console.log(`saved ${outDir}/mooni-itinerary-cards-390.png`);

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });
const base = process.env.PREVIEW_URL || 'https://127.0.0.1:4173';

async function installRateLimitMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '9000',
      },
      body: JSON.stringify({ success: false, error: 'rate_limited', retryAfter: 9000 }),
    });
  });
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    locale: 'ko-KR',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  await context.addInitScript(() => localStorage.setItem('gateo.locale', 'ko'));
  await installRateLimitMock(context);
  const page = await context.newPage();
  await page.goto(`${base}/place/gili-meno`, { waitUntil: 'domcontentloaded' });
  await page.locator('.place-header-mooni-btn').click();
  const input = page.locator('form input[type="text"]:visible').first();
  await input.waitFor({ timeout: 30_000 });
  await input.fill('여행 팁 알려줘');
  await input.press('Enter');
  await page.getByText(/오늘 사용량이 다 찼어요/).waitFor({ timeout: 30_000 });
  await page.screenshot({
    path: join(outDir, 'mooni-rate-limit-429-390.png'),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  await browser.close();
  console.log(`Wrote ${join(outDir, 'mooni-rate-limit-429-390.png')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

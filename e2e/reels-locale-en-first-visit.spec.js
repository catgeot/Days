import { test, expect } from './fixtures.js';

async function newEnFirstVisitContext(browser, baseURL) {
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    baseURL,
    ignoreHTTPSErrors: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  return context;
}

async function waitForRootContent(page) {
  await expect
    .poll(
      async () => {
        return page.evaluate(() => document.getElementById('root')?.childElementCount ?? 0);
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
}

test.describe('reels locale boot (english first visit)', () => {
  test('flag off: /reels lands on home with ?lang=en and visible UI', async ({ browser, baseURL }) => {
    const context = await newEnFirstVisitContext(browser, baseURL);
    const page = await context.newPage();

    await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });

    await expect
      .poll(() => page.url(), { timeout: 15_000 })
      .toMatch(/\/\?lang=en$/);

    await waitForRootContent(page);

    const stored = await page.evaluate(() => localStorage.getItem('gateo.locale'));
    expect(stored).toBe('en');

    await context.close();
  });

});

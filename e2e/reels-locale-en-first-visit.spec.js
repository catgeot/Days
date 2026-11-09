import { test, expect } from './fixtures.js';
import path from 'node:path';
import { expectHomeShellVisible } from './reels-locale-home-shell.js';

const artifactDir = process.env.REELS_LOCALE_ARTIFACT_DIR || '/opt/cursor/artifacts';

async function newFirstVisitContext(browser, baseURL, locale, viewport) {
  const context = await browser.newContext({
    locale,
    viewport,
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

async function screenshotAfterHomeReady(page, fileName, viewport) {
  await expectHomeShellVisible(page);
  await page.waitForTimeout(1500);
  const file = path.join(artifactDir, fileName);
  if (viewport.width <= 400) {
    await page.screenshot({
      path: file,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  } else {
    await page.screenshot({ path: file });
  }
}

test('en 390: /reels lands on home with ?lang=en and visible search shell', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile-en', 'english mobile only');

  const context = await newFirstVisitContext(browser, baseURL, 'en-US', { width: 390, height: 844 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/\?lang=en$/);

  const stored = await page.evaluate(() => localStorage.getItem('gateo.locale'));
  expect(stored).toBe('en');

  await screenshotAfterHomeReady(page, 'reels-locale-s3-en-reels-390.png', { width: 390, height: 844 });

  await context.close();
});

test('en 390 control: direct /?lang=en matches home shell', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile-en', 'english mobile only');

  const context = await newFirstVisitContext(browser, baseURL, 'en-US', { width: 390, height: 844 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/?lang=en`, { waitUntil: 'domcontentloaded' });
  await expectHomeShellVisible(page);
  await screenshotAfterHomeReady(page, 'reels-locale-s3-en-home-control-390.png', { width: 390, height: 844 });

  await context.close();
});

test('en 1280: /reels shows home search after boot redirect', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop-en', 'english desktop only');

  const context = await newFirstVisitContext(browser, baseURL, 'en-US', { width: 1280, height: 720 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/\?lang=en$/);
  await screenshotAfterHomeReady(page, 'reels-locale-s3-en-reels-1280.png', { width: 1280, height: 720 });

  const globeSurface = page.locator('.mapboxgl-canvas, .mapboxgl-map, canvas').first();
  await expect(globeSurface).toBeVisible({ timeout: 60_000 });

  await context.close();
});

test('ko 390: /reels and home keep visible search shell', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile-ko', 'korean mobile only');

  const context = await newFirstVisitContext(browser, baseURL, 'ko-KR', { width: 390, height: 844 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });
  await expectHomeShellVisible(page);
  expect(page.url()).not.toContain('lang=en');

  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await expectHomeShellVisible(page);
  await screenshotAfterHomeReady(page, 'reels-locale-s3-ko-home-control-390.png', { width: 390, height: 844 });

  await context.close();
});

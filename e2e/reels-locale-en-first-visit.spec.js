import { test, expect } from './fixtures.js';
import path from 'node:path';

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

async function waitForRootContent(page) {
  await expect
    .poll(
      async () => page.evaluate(() => document.getElementById('root')?.childElementCount ?? 0),
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
}

test('en 390: /reels lands on home with ?lang=en and visible UI', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile-en', 'english mobile only');

  const context = await newFirstVisitContext(browser, baseURL, 'en-US', { width: 390, height: 844 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/\?lang=en$/);
  await waitForRootContent(page);

  const stored = await page.evaluate(() => localStorage.getItem('gateo.locale'));
  expect(stored).toBe('en');

  await page.screenshot({
    path: path.join(artifactDir, 'reels-locale-s3-en-390.png'),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  await context.close();
});

test('en 1280: /reels shows home body after boot redirect', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop-en', 'english desktop only');

  const context = await newFirstVisitContext(browser, baseURL, 'en-US', { width: 1280, height: 720 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/\?lang=en$/);
  await waitForRootContent(page);

  await page.screenshot({
    path: path.join(artifactDir, 'reels-locale-s3-en-1280.png'),
    fullPage: false,
  });

  await context.close();
});

test('ko 390: /reels and home keep non-empty root', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile-ko', 'korean mobile only');

  const context = await newFirstVisitContext(browser, baseURL, 'ko-KR', { width: 390, height: 844 });
  const page = await context.newPage();

  await page.goto(`${baseURL}/reels`, { waitUntil: 'domcontentloaded' });
  await waitForRootContent(page);
  expect(page.url()).not.toContain('lang=en');

  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await waitForRootContent(page);

  await context.close();
});

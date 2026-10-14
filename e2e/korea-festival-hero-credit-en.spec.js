import { test, expect } from './fixtures.js';
import { newGuardedContext } from './fixtures.js';
import { devices } from '@playwright/test';

const FESTIVAL_ID = '638576';
const OUT_DIR = '/opt/cursor/artifacts/screenshots/preview-en-summary';

function festivalUrl(baseURL, { lang } = {}) {
  const path = `/korea/?festival=${FESTIVAL_ID}${lang === 'en' ? '&lang=en' : ''}`;
  return new URL(path, baseURL).toString();
}

async function waitForFestivalDetailBody(page, { timeout = 120_000 } = {}) {
  await page.waitForFunction(
    () => {
      const hero = document.querySelector('[data-festival-hero] img[data-festival-photo]');
      const title = document.querySelector('#korea-festival-sheet-title');
      return Boolean(hero && title && String(title.textContent || '').trim());
    },
    null,
    { timeout },
  );
}

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function waitHeroDecoded(page) {
  const heroImg = page.locator('[data-festival-hero] img[data-festival-photo]').first();
  await expect(heroImg).toBeAttached({ timeout: 120_000 });
  await expect(async () => {
    const nw = await heroImg.evaluate((el) => el.naturalWidth);
    expect(nw).toBeGreaterThan(0);
  }).toPass({ timeout: 120_000 });
  await expect(page.locator('[data-festival-hero][data-festival-hero-decoded="true"]')).toBeVisible({
    timeout: 30_000,
  });
}

async function expectEnHeroChrome(page) {
  await expect(page.locator('[data-festival-photo-credit]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-festival-photo-credit]')).toContainText(
    /Photo: Korea Tourism Organization/i,
  );
  await expect(page.getByText('Expand', { exact: true })).toBeVisible({ timeout: 15_000 });
}

test.describe('festival 638576 hero credit + Expand (WebKit 390)', () => {
  test('direct ?lang=en deep link', async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const context = await newGuardedContext(browser, {
      ...devices['iPhone 13'],
      locale: 'en-US',
    });
    const page = await context.newPage();
    await page.goto(festivalUrl(baseURL, { lang: 'en' }), {
      waitUntil: 'domcontentloaded',
    });
    await dismissLocHint(page);
    await waitForFestivalDetailBody(page);
    await waitHeroDecoded(page);
    await expectEnHeroChrome(page);
    await context.close();
  });

  test('KO load then client navigation to ?lang=en', async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const context = await newGuardedContext(browser, {
      ...devices['iPhone 13'],
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    await page.goto(festivalUrl(baseURL), {
      waitUntil: 'domcontentloaded',
    });
    await dismissLocHint(page);
    await waitForFestivalDetailBody(page);
    await waitHeroDecoded(page);
    await expect(page.locator('[data-festival-photo-credit]')).toContainText(/한국관광공사/);

    await page.goto(festivalUrl(baseURL, { lang: 'en' }), { waitUntil: 'domcontentloaded' });
    await waitForFestivalDetailBody(page);
    await waitHeroDecoded(page);
    await expectEnHeroChrome(page);
    await context.close();
  });
});

test.describe('festival hero screenshots @390', () => {
  test.skip(({ browserName }) => Boolean(process.env.CI), 'screenshots captured locally / capture-hero-credit-shots.mjs');

  test('capture EN hero, EN fee block, KO hero, placeholder', async ({ browser, baseURL }) => {
    test.setTimeout(300_000);
    const { mkdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await mkdir(OUT_DIR, { recursive: true });

    const webkit = {
      ...devices['iPhone 13'],
    };

    const enCtx = await newGuardedContext(browser, { ...webkit, locale: 'en-US' });
    const enPage = await enCtx.newPage();
    await enPage.goto(festivalUrl(baseURL, { lang: 'en' }), {
      waitUntil: 'domcontentloaded',
    });
    await dismissLocHint(enPage);
    await waitForFestivalDetailBody(enPage);
    await waitHeroDecoded(enPage);
    await expectEnHeroChrome(enPage);
    await enPage.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      if (d) d.scrollTop = 0;
    });
    await enPage.screenshot({
      path: join(OUT_DIR, 'preview-en-638576-hero-credit.png'),
      fullPage: false,
    });

    const fee = enPage.locator('[data-festival-summary-fee]');
    await fee.scrollIntoViewIfNeeded();
    await enPage.waitForTimeout(400);
    await enPage.screenshot({
      path: join(OUT_DIR, 'preview-en-638576-fee-venue.png'),
      fullPage: false,
    });

    const koCtx = await newGuardedContext(browser, { ...webkit, locale: 'ko-KR' });
    const koPage = await koCtx.newPage();
    await koPage.goto(festivalUrl(baseURL), {
      waitUntil: 'domcontentloaded',
    });
    await dismissLocHint(koPage);
    await waitForFestivalDetailBody(koPage);
    await waitHeroDecoded(koPage);
    await expect(koPage.locator('[data-festival-photo-credit]')).toContainText(/한국관광공사/);
    await koPage.screenshot({
      path: join(OUT_DIR, 'preview-ko-638576-hero-credit.png'),
      fullPage: false,
    });

    const failCtx = await newGuardedContext(browser, { ...webkit, locale: 'en-US' });
    const failPage = await failCtx.newPage();
    await failPage.route('**/*.{jpg,JPG,jpeg,png,webp}', (route) => {
      const url = route.request().url();
      if (url.includes('visitkorea') || url.includes('4114406')) return route.abort();
      return route.continue();
    });
    await failPage.goto(festivalUrl(baseURL, { lang: 'en' }), {
      waitUntil: 'domcontentloaded',
    });
    await dismissLocHint(failPage);
    await expect(failPage.locator('[data-festival-hero-fallback]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(failPage.getByText(/^Expand$/)).toHaveCount(0);
    await failPage.screenshot({
      path: join(OUT_DIR, 'preview-en-hero-no-expand-badge.png'),
      fullPage: false,
    });

    await enCtx.close();
    await koCtx.close();
    await failCtx.close();
  });
});

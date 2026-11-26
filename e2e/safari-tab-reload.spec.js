import fs from 'node:fs';
import { test, expect } from './fixtures.js';

async function shot(page, name, width, height) {
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  await page.screenshot({
    path: `/opt/cursor/artifacts/${name}.png`,
    clip: { x: 0, y: 0, width, height },
  });
}

async function backgroundAlpha(locator) {
  return locator.evaluate((el) => {
    const bg = window.getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return -1;
    return m[4] == null ? 1 : Number(m[4]);
  });
}

async function expectSiteNoticeFullyOpaque(notice) {
  const panelAlpha = await backgroundAlpha(notice);
  const headerAlpha = await backgroundAlpha(notice.locator('[data-site-update-notice-header]'));
  expect(panelAlpha).toBeGreaterThanOrEqual(0.99);
  expect(headerAlpha).toBeGreaterThanOrEqual(0.99);
}

test.describe('safari tab reload recovery', () => {
  test('festival chips persist in the URL across reload without a history entry', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/korea');
    const timeMajor = page.getByRole('button', { name: /시간 대분류/ });
    await expect(timeMajor).toBeVisible({ timeout: 60_000 });
    const historyBefore = await page.evaluate(() => history.length);

    await page.locator('[data-region-id="all"]').click();
    await expect.poll(() => new URL(page.url()).searchParams.get('region')).toBe('all');

    await timeMajor.click();
    await page.locator('[data-period-id="weekend"]').click();
    await expect.poll(() => new URL(page.url()).searchParams.get('time')).toBe('weekend');
    expect(new URL(page.url()).searchParams.get('region')).toBe('all');
    expect(await page.evaluate(() => history.length)).toBe(historyBefore);

    await page.reload();
    await expect(page.getByRole('button', { name: /시간 대분류 · 이번 주말/ })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-region-id="all"]')).toHaveAttribute('aria-pressed', 'true');
    const reloaded = new URL(page.url());
    expect(reloaded.searchParams.get('time')).toBe('weekend');
    expect(reloaded.searchParams.get('region')).toBe('all');
  });

  test('existing festival URL and invalid filter params keep the old defaults', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/korea?festival=638576&time=nope&region=999&taste=nope');
    await expect(page.getByRole('button', { name: /시간 대분류 · 이번 달/ })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: /지역 대분류 · 지역/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /테마 대분류/ })).toBeVisible();
    const url = new URL(page.url());
    expect(url.searchParams.get('festival')).toBe('638576');
    await page.goto('/korea?time=weekend&region=1&taste=music');
    await expect(page.getByRole('button', { name: /시간 대분류 · 이번 주말/ })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: /지역 대분류 · 서울/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /테마 대분류 · 음악/ })).toBeVisible();
  });

  test('festival chip replace then vite:preloadError shows the banner without assigning', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/korea');
    const timeMajor = page.getByRole('button', { name: /시간 대분류/ });
    await expect(timeMajor).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => {
      window.__stay = 'chip-tab';
    });

    await page.locator('[data-region-id="all"]').click();
    await expect.poll(() => new URL(page.url()).searchParams.get('region')).toBe('all');
    await timeMajor.click();
    await page.locator('[data-period-id="weekend"]').click();
    await expect.poll(() => new URL(page.url()).searchParams.get('time')).toBe('weekend');

    await page.evaluate(() => window.dispatchEvent(new Event('vite:preloadError')));
    const notice = page.locator('[data-site-update-notice]');
    await expect(notice).toBeVisible();
    await expect(page.getByText('사이트가 업데이트됐어요')).toBeVisible();
    await expectSiteNoticeFullyOpaque(notice);
    expect(await page.evaluate(() => window.__stay)).toBe('chip-tab');
    const stayed = new URL(page.url());
    expect(stayed.pathname).toBe('/korea');
    expect(stayed.searchParams.get('region')).toBe('all');
    expect(stayed.searchParams.get('time')).toBe('weekend');
    await expect(page.getByRole('button', { name: '새로고침' })).toBeVisible();
  });

  test('vite:preloadError on an open tab shows the update banner and does not reload', async ({
    page,
    browserName,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => {
      window.__stay = 'open-tab';
    });
    await page.evaluate(() => window.dispatchEvent(new Event('vite:preloadError')));
    const notice = page.locator('[data-site-update-notice]');
    await expect(notice).toBeVisible();
    await expect(page.getByText('사이트가 업데이트됐어요')).toBeVisible();
    await expectSiteNoticeFullyOpaque(notice);
    if (browserName === 'webkit') {
      await shot(page, 'about-390-site-update-notice-webkit', 390, 844);
    }
    expect(await page.evaluate(() => window.__stay)).toBe('open-tab');
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole('button', { name: '새로고침' })).toBeVisible();
  });

  test('a navigation chunk failure hard-loads the target once', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => {
      window.__boot = 'first';
    });
    const left = page.waitForFunction(() => window.__boot !== 'first', null, { timeout: 20_000 });
    await page.evaluate(() => {
      history.pushState({}, '', '/blog');
      window.dispatchEvent(new Event('vite:preloadError'));
    });
    await left;
    await expect(page).toHaveURL(/\/blog/);

    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => {
      window.__boot = 'second';
      history.pushState({}, '', '/blog');
      window.dispatchEvent(new Event('vite:preloadError'));
    });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__boot)).toBe('second');
    await expect(page.locator('[data-site-update-notice]')).toBeVisible();
  });
});

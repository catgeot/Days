import fs from 'node:fs';
import { test, expect } from './fixtures.js';

const NOVEMBER_AT = '2026-11-25T03:00:00.000Z';
const INTRO_KO = /안녕! 3D 지구본과 AI로 여행지를 찾아봐요/;

function overlaps(a, b) {
  if (!a || !b || a.width < 1 || b.width < 1) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function box(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
  });
}

async function elementFromPointHit(page, locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    const clickable =
      hit === el || el.contains(hit) || hit?.closest('[data-testid="home-monthly-switch"]') === el;
    return {
      x,
      y,
      clickable,
      tag: hit?.tagName,
      testId: hit?.closest('[data-testid]')?.getAttribute('data-testid') ?? null,
    };
  });
}

async function openHomeWithMooniIntro(page, path, time) {
  if (time) await page.clock.install({ time: new Date(time) });
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('gateo_mooni_intro_seen');
      localStorage.removeItem('gateo_mooni_fab_pos');
    } catch {
      /* ignore */
    }
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function dragMooniFab(page, clientX, clientY) {
  const fab = page.getByTestId('mooni-fab-open');
  const start = await fab.boundingBox();
  if (!start) throw new Error('mooni fab box missing');
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(clientX, clientY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

test.describe('home monthly card vs MOONi intro bubble', () => {
  test('webkit 390 — bubble clears header; 12월 보기 is hit-testable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-home-monthly-390', 'webkit 390');

    await openHomeWithMooniIntro(page, '/?home_monthly_switch=1', NOVEMBER_AT);
    const card = page.getByTestId('home-watch-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toHaveAttribute('data-monthly-placed', '1', { timeout: 60_000 });

    const hint = page.getByTestId('mooni-fab-hint');
    await expect(hint).toBeVisible({ timeout: 30_000 });
    await expect(hint.getByText(INTRO_KO)).toBeVisible();

    const link = page.getByTestId('home-monthly-switch');
    await expect(link).toHaveText('12월 보기 ▸');

    const hintBox = await box(hint);
    const linkBox = await box(link);
    const dismissBox = await box(page.getByTestId('home-watch-dismiss'));

    expect(overlaps(hintBox, linkBox)).toBe(false);
    expect(overlaps(hintBox, dismissBox)).toBe(false);

    const linkHit = await elementFromPointHit(page, link);
    expect(linkHit.clickable, `elementFromPoint returned ${linkHit.testId || linkHit.tag}`).toBe(true);

    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
    await page.screenshot({
      path: '/opt/cursor/artifacts/home-monthly-mooni-intro-bubble-390.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('webkit 1280 — intro bubble visible with monthly card', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-home-monthly-1280', 'webkit 1280');

    await openHomeWithMooniIntro(page, '/?home_monthly_switch=1&lang=en', NOVEMBER_AT);
    await expect(page.getByTestId('home-watch-card')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('mooni-fab-hint')).toBeVisible({ timeout: 30_000 });

    const hint = page.getByTestId('mooni-fab-hint');
    const link = page.getByTestId('home-monthly-switch');
    if (await link.isVisible()) {
      const hintBox = await box(hint);
      const linkBox = await box(link);
      expect(overlaps(hintBox, linkBox)).toBe(false);
      const linkHit = await elementFromPointHit(page, link);
      expect(linkHit.clickable).toBe(true);
    }

    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
    await page.screenshot({
      path: '/opt/cursor/artifacts/home-monthly-mooni-intro-bubble-1280.png',
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
  });

  test('390 — bubble clearance after dragging MOONi left, center, right', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    test.skip(width !== 390, '390 only');

    await openHomeWithMooniIntro(page, '/?home_monthly_switch=1', NOVEMBER_AT);
    await expect(page.getByTestId('home-watch-card')).toHaveAttribute('data-monthly-placed', '1', {
      timeout: 60_000,
    });
    await expect(page.getByTestId('mooni-fab-hint')).toBeVisible({ timeout: 30_000 });

    const targets = [
      { name: 'left', x: 48, y: 720 },
      { name: 'center', x: 195, y: 700 },
      { name: 'right', x: 342, y: 680 },
    ];

    for (const { name, x, y } of targets) {
      await dragMooniFab(page, x, y);
      await expect(page.getByTestId('mooni-fab-hint')).toBeVisible();
      const hintBox = await box(page.getByTestId('mooni-fab-hint'));
      const linkBox = await box(page.getByTestId('home-monthly-switch'));
      expect(overlaps(hintBox, linkBox), `hint overlap after drag ${name}`).toBe(false);
      expect(overlaps(hintBox, await box(page.getByTestId('home-watch-dismiss'))), `dismiss overlap after drag ${name}`).toBe(false);
    }
  });

  test('flag off — intro bubble unaffected', async ({ page }, testInfo) => {
    await openHomeWithMooniIntro(page, '/', NOVEMBER_AT);
    await expect(page.getByTestId('mooni-fab-hint')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('home-watch-card')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('home-watch-card')).not.toHaveAttribute('data-monthly-switch', '1');
    const extra = await page.getByTestId('mooni-fab-hint').evaluate((el) => {
      return Number.parseFloat(getComputedStyle(el).marginBottom) || 0;
    });
    expect(extra).toBeLessThanOrEqual(8.5);
  });
});
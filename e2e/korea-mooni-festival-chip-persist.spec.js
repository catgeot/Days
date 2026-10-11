import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.MOONI_CHIP_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-mooni-festival-chip-persist';

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

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function countThread(page) {
  return page.evaluate(() => {
    const meLabels = [...document.querySelectorAll('span')].filter(
      (s) => s.textContent?.trim() === 'Me',
    ).length;
    const mooniLabels = [...document.querySelectorAll('span')].filter(
      (s) => s.textContent?.trim() === 'MOONi',
    ).length;
    return { meLabels, mooniLabels };
  });
}

async function openFestivalMooni(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await dismissLocHint(page);
  const mooniBtn = page
    .locator('[data-festival-mooni-inline]')
    .or(page.getByRole('button', { name: /무니에게 이 축제 물어보기/i }))
    .first();
  await expect(mooniBtn).toBeVisible({ timeout: 150_000 });
  await mooniBtn.click({ timeout: 60_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 120_000,
  });
}

test.describe('festival MOONi chip reply persists @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(300_000);

  test('2989642 chip — user + model bubbles stay ≥10s', async ({ page }, testInfo) => {
    await openFestivalMooni(page, '2989642');
    await shot(page, `${testInfo.project.name}-01-opening`);

    const chip = page
      .getByRole('button', { name: /볼거리|하루 동선|근처 먹고/i })
      .first();
    await chip.click({ timeout: 30_000 });

    await expect
      .poll(async () => (await countThread(page)).mooniLabels, {
        timeout: 120_000,
      })
      .toBeGreaterThanOrEqual(2);

    const mid = await countThread(page);
    expect(mid.meLabels).toBeGreaterThanOrEqual(1);
    await shot(page, `${testInfo.project.name}-02-after-reply`);

    await page.waitForTimeout(10_000);
    const after = await countThread(page);
    expect(after.mooniLabels).toBeGreaterThanOrEqual(2);
    expect(after.meLabels).toBeGreaterThanOrEqual(1);
    await shot(page, `${testInfo.project.name}-03-after-10s`);
  });
});

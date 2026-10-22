import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/festival-year-close');
const VIEWPORT = { width: 390, height: 844 };

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

async function shot(page, file) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  return path;
}

async function openFestival(page, contentId, dateText) {
  await page.goto(`/korea/?festival=${contentId}`, { waitUntil: 'domcontentloaded' });
  await dismissLocHint(page);
  const date = page.locator('[data-festival-summary-date]');
  await expect(date).toHaveText(dateText, { timeout: 120_000 });
  const dialog = page.getByRole('dialog').filter({ has: date });
  await dialog.evaluate((el) => {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await page
    .waitForFunction(() => {
      const img = document.querySelector('[role="dialog"] img');
      return Boolean(img && img.complete && img.naturalWidth > 0);
    }, { timeout: 25_000 })
    .catch(() => {});
  return dialog;
}

test.describe('festival year label and close button — WebKit 390', () => {
  test.setTimeout(240_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test('future-year 산천어 and past 해맞이 with close button', async ({ page }) => {
    const futureDate = '2027.1.9\u20131.31';
    const future = await openFestival(page, '507599', futureDate);
    await expect(page.getByRole('button', { name: /^닫기$/ }).last()).toBeVisible();
    await shot(page, '01-future-year-sancheoneo-close.png');

    const pastDate = '2026.1.1 · 다음 일정 미발표';
    const past = await openFestival(page, '1506389', pastDate);
    await expect(page.getByRole('button', { name: /^닫기$/ }).last()).toBeVisible();
    await shot(page, '02-past-year-haema-unannounced.png');

    await writeFile(
      join(OUT, 'manifest.json'),
      `${JSON.stringify(
        [
          {
            file: '01-future-year-sancheoneo-close.png',
            contentId: '507599',
            dateShown: futureDate,
            note: 'future edition announced — year, no 미발표; close X on the photo',
          },
          {
            file: '02-past-year-haema-unannounced.png',
            contentId: '1506389',
            dateShown: pastDate,
            note: 'ended edition outside the current month',
          },
        ],
        null,
        2,
      )}\n`,
    );
  });
});

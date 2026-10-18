import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';

const OUT = 'docs/qa/pr-festival-back-blank';
const VIEWPORT = { width: 390, height: 844 };
const FESTIVALS = [
  { id: '637693', slug: 'masan-637693' },
  { id: '2930716', slug: 'gangneung-2930716' },
  { id: '1998564', slug: 'seoul-1998564' },
];

async function shot(page, name) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function openFestival(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({
    timeout: 120_000,
  });
  return dialog;
}

test.describe('festival back to overview — WebKit 390', () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  for (const { id, slug } of FESTIVALS) {
    test(`${slug}: program tab back does not blank the sheet`, async ({ page }) => {
      const dialog = await openFestival(page, id);
      const programTab = dialog.getByRole('tab', { name: /프로그램/ });
      await expect(programTab).toBeVisible({ timeout: 90_000 });
      await programTab.click();

      const backBtn = dialog.getByRole('button', { name: '안내로 돌아가기' });
      await backBtn.scrollIntoViewIfNeeded();
      await shot(page, `${slug}-program-before-back`);

      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));

      await backBtn.click();

      await expect(dialog.getByRole('tab', { name: /^안내$/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible();

      const metrics = await dialog.evaluate((el) => {
        const title = document.getElementById('korea-festival-sheet-title');
        const titleRect = title?.getBoundingClientRect();
        return {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          titleTop: titleRect?.top ?? -1,
          titleHeight: titleRect?.height ?? 0,
        };
      });

      expect(metrics.scrollTop).toBeLessThan(600);
      expect(metrics.titleTop).toBeGreaterThan(0);
      expect(metrics.titleTop).toBeLessThan(VIEWPORT.height - 40);
      expect(errors).toEqual([]);

      await shot(page, `${slug}-overview-after-back`);

      const photosTab = dialog.getByRole('tab', { name: /^사진/ });
      if (await photosTab.isVisible().catch(() => false)) {
        await photosTab.click();
        await dialog.getByRole('button', { name: '안내로 돌아가기' }).click();
        await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible();
      }
    });
  }
});

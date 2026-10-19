/**
 * QA asset capture for docs/qa/pr-festival-back-blank/
 * Run: SMOKE_SITE_URL=http://127.0.0.1:4173 npx playwright test e2e/pr-festival-back-blank-qa-capture.spec.js --project=webkit-festival-back-qa-capture
 */
import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';

const OUT = 'docs/qa/pr-festival-back-blank';
const VIEWPORT = { width: 390, height: 844 };

const FESTIVALS = [
  { id: '637693', slug: 'masan-637693', title: /마산|국화/ },
  { id: '2930716', slug: 'gangneung-2930716', title: /강릉|국수/ },
  { id: '1998564', slug: 'seoul-1998564', title: /.+/ },
];

const SUB_TABS = [
  { pattern: /프로그램/, key: 'program' },
  { pattern: /^사진/, key: 'photos' },
  { pattern: /영상/, key: 'reading' },
];

async function clipShot(page, name) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function scrollPrimaryToBottom(dialog) {
  await dialog.evaluate((el) => {
    const md = window.matchMedia('(min-width: 768px)').matches;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
    primary.scrollTop = primary.scrollHeight;
    el.scrollTop = el.scrollHeight;
  });
}

test.describe('PR festival back blank — QA capture WebKit 390', () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test('numbered program list sample', async ({ page }) => {
    await page.goto('/korea/?festival=637693', { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({
      timeout: 120_000,
    });
    await dialog.getByRole('tab', { name: /프로그램/ }).click();
    const numbered = dialog.locator('p').filter({ hasText: /^\d+\.\s/ }).first();
    await expect(numbered).toBeVisible({ timeout: 60_000 });
    await numbered.scrollIntoViewIfNeeded();
    await clipShot(page, 'masan-637693-program-numbered-list');
  });

  for (const { id, slug, title } of FESTIVALS) {
    test(`${slug} — back button flow screenshots`, async ({ page }) => {
      await page.goto(`/korea/?festival=${id}`, { waitUntil: 'domcontentloaded' });
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: title }).first()).toBeVisible({
        timeout: 120_000,
      });

      for (const { pattern, key } of SUB_TABS) {
        const tab = dialog.getByRole('tab', { name: pattern });
        try {
          await tab.waitFor({ state: 'visible', timeout: 90_000 });
        } catch {
          continue;
        }
        await tab.click();
        await expect(dialog.getByRole('button', { name: '안내로 돌아가기' })).toBeVisible({
          timeout: 60_000,
        });
        const backBtn = dialog.getByRole('button', { name: '안내로 돌아가기' });
        await expect(backBtn).toBeVisible();
        await scrollPrimaryToBottom(dialog);
        await backBtn.scrollIntoViewIfNeeded();
        await clipShot(page, `${slug}-${key}-before-back-bottom`);

        await backBtn.click({ noWaitAfter: true });
        await clipShot(page, `${slug}-${key}-after-back-momentum`);

        await page.waitForTimeout(450);
        await clipShot(page, `${slug}-${key}-after-back-settled`);
      }
    });
  }
});

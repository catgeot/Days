import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';

const OUT = 'docs/qa/pr-festival-back-blank';
const VIEWPORT = { width: 390, height: 844 };
const FESTIVALS = [
  { id: '637693', slug: 'masan-637693' },
  { id: '2930716', slug: 'gangneung-2930716' },
  { id: '1998564', slug: 'seoul-1998564' },
];

const SUB_TABS_WITH_BACK = [
  { pattern: /프로그램/, key: 'program' },
  { pattern: /^사진/, key: 'photos' },
  { pattern: /읽을거리/, key: 'reading' },
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

async function scrollSheetToBottom(dialog) {
  await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
}

async function assertOverviewBodyInViewport(dialog) {
  await expect(dialog.getByRole('tab', { name: /^안내$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible();
  await expect(dialog.locator('[data-festival-detail-slot]')).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(
      async () =>
        dialog.evaluate((el) => {
          const vh = window.innerHeight;
          const title = document.getElementById('korea-festival-sheet-title');
          const titleRect = title?.getBoundingClientRect();
          const titleInView =
            titleRect &&
            titleRect.height > 0 &&
            titleRect.top > 0 &&
            titleRect.top < vh - 8;
          const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
          const scrollOk = el.scrollTop <= maxTop + 2 && el.scrollTop < 500;
          const slot = el.querySelector('[data-festival-detail-slot]');
          const slotHasBody = Boolean(slot && String(slot.textContent || '').trim().length > 8);
          const sheetRect = el.getBoundingClientRect();
          const probeY = Math.min(vh - 32, (titleRect?.bottom ?? 120) + 48);
          const hit = document.elementFromPoint(sheetRect.left + sheetRect.width / 2, probeY);
          const probeText =
            hit && el.contains(hit) ? String(hit.textContent || '').trim() : '';
          const overviewBodyInView = titleInView && probeText.length > 0;
          return {
            scrollOk,
            slotHasBody,
            overviewBodyInView,
            scrollTop: el.scrollTop,
          };
        }),
      { timeout: 5000 },
    )
    .toMatchObject({
      scrollOk: true,
      slotHasBody: true,
      overviewBodyInView: true,
    });
}

test.describe('festival back to overview — WebKit 390', () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  for (const { id, slug } of FESTIVALS) {
    for (const { pattern, key } of SUB_TABS_WITH_BACK) {
      test(`${slug} · ${key}: scroll bottom → 안내로 돌아가기 shows overview body`, async ({
        page,
      }) => {
        const dialog = await openFestival(page, id);
        const tab = dialog.getByRole('tab', { name: pattern });
        await expect(tab, `${key} tab for ${id}`).toBeVisible({ timeout: 90_000 });
        await tab.click();

        const backBtn = dialog.getByRole('button', { name: '안내로 돌아가기' });
        await expect(backBtn).toBeVisible();
        await scrollSheetToBottom(dialog);
        await backBtn.scrollIntoViewIfNeeded();

        if (key === 'program') {
          await shot(page, `${slug}-${key}-before-back`);
        }

        await backBtn.click();
        await dialog.evaluate(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(resolve));
            }),
        );

        await assertOverviewBodyInViewport(dialog);

        if (key === 'program') {
          await shot(page, `${slug}-overview-after-back`);
        }
      });
    }
  }
});

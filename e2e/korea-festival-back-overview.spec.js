import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';

const OUT = 'docs/qa/pr-festival-back-blank';
const VIEWPORT = { width: 390, height: 844 };
const TITLE_TOP_MIN_RATIO = 0.05;
const TITLE_TOP_MAX_RATIO = 0.58;
const PROBE_Y_RATIO = 0.32;

const FESTIVALS = [
  { id: '637693', slug: 'masan-637693' },
  { id: '638576', slug: 'hampyeong-638576' },
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

async function scrollPrimarySheetToBottom(dialog) {
  await dialog.evaluate((el) => {
    const md = window.matchMedia('(min-width: 768px)').matches;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
    primary.scrollTop = primary.scrollHeight;
    el.scrollTop = el.scrollHeight;
  });
  await dialog.evaluate((el) => {
    const md = window.matchMedia('(min-width: 768px)').matches;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
    primary.scrollTop = primary.scrollHeight;
    el.scrollTop = el.scrollHeight;
  });
}

async function assertOverviewTopInViewport(dialog) {
  await expect(dialog.getByRole('tab', { name: /^안내$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible();
  await expect(dialog.locator('[data-festival-detail-slot]')).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(
      async () =>
        dialog.evaluate(
          (el, ratios) => {
            const vh = window.innerHeight;
            const title = document.getElementById('korea-festival-sheet-title');
            const titleRect = title?.getBoundingClientRect();
            const md = window.matchMedia('(min-width: 768px)').matches;
            const contentCol = el.querySelector('[data-festival-sheet-content]');
            const primary =
              md && contentCol instanceof HTMLElement ? contentCol : el;
            const maxTop = Math.max(0, primary.scrollHeight - primary.clientHeight);
            const scrollOk =
              primary.scrollTop <= maxTop + 2 &&
              el.scrollTop <= Math.max(0, el.scrollHeight - el.clientHeight) + 2;
            const titleTopBand =
              titleRect &&
              titleRect.height > 0 &&
              titleRect.top >= vh * ratios.titleMin &&
              titleRect.top <= vh * ratios.titleMax;
            const sheetRect = el.getBoundingClientRect();
            const probeY = vh * ratios.probeY;
            const hit = document.elementFromPoint(sheetRect.left + sheetRect.width / 2, probeY);
            const nearbyAtProbe = Boolean(
              hit?.closest('[data-festival-section="nearAttractions"]'),
            );
            const hero = el.querySelector('[data-festival-photo-strip]');
            const heroRect = hero?.getBoundingClientRect();
            const heroPeek =
              !heroRect ||
              (heroRect.bottom > sheetRect.top + 8 && heroRect.top < vh * 0.45);
            return {
              scrollOk,
              titleTopBand,
              nearbyAtProbe,
              heroPeek,
              primaryScrollTop: primary.scrollTop,
              sheetScrollTop: el.scrollTop,
              titleTop: titleRect?.top ?? -1,
            };
          },
          {
            titleMin: TITLE_TOP_MIN_RATIO,
            titleMax: TITLE_TOP_MAX_RATIO,
            probeY: PROBE_Y_RATIO,
          },
        ),
      { timeout: 10_000 },
    )
    .toMatchObject({
      scrollOk: true,
      titleTopBand: true,
      nearbyAtProbe: false,
      heroPeek: true,
    });
}

test.describe('festival back to overview — WebKit 390', () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  for (const { id, slug } of FESTIVALS) {
    for (const { pattern, key } of SUB_TABS_WITH_BACK) {
      test(`${slug} · ${key}: bottom scroll → 안내로 돌아가기 shows overview top`, async ({
        page,
      }) => {
        const dialog = await openFestival(page, id);
        const tab = dialog.getByRole('tab', { name: pattern });
        try {
          await tab.waitFor({ state: 'visible', timeout: 90_000 });
        } catch {
          test.skip(true, `${slug}: ${key} tab not offered`);
        }
        await tab.click();

        const backBtn = dialog.getByRole('button', { name: '안내로 돌아가기' });
        await expect(backBtn).toBeVisible();
        await scrollPrimarySheetToBottom(dialog);
        await backBtn.scrollIntoViewIfNeeded();

        await backBtn.click();
        await dialog.evaluate(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(resolve));
            }),
        );

        await assertOverviewTopInViewport(dialog);
      });
    }
  }
});

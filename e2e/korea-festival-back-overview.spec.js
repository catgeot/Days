import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import { installFestivalBackOverviewFixtures } from './festival-back-overview-fixture.js';

const OUT = 'docs/qa/pr-festival-back-blank';
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const OPEN_TIMEOUT_MS = IS_CI ? 25_000 : 120_000;
const TAB_WAIT_MS = IS_CI ? 12_000 : 90_000;
const TEST_TIMEOUT_MS = IS_CI ? 180_000 : 240_000;
const MIN_PRE_TAP_SCROLL_TOP_PX = 2000;
const OVERVIEW_SCROLL_HEIGHT_FACTOR = 1.5;
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
  await expect(dialog).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({
    timeout: OPEN_TIMEOUT_MS,
  });
  return dialog;
}

/** Same primary scroller as production scroll-reset (sheet vs md content column). */
async function measurePrimaryScroller(dialog) {
  return dialog.evaluate((el) => {
    const md = window.matchMedia('(min-width: 768px)').matches;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
    const maxScrollTop = Math.max(0, primary.scrollHeight - primary.clientHeight);
    return {
      scrollHeight: primary.scrollHeight,
      clientHeight: primary.clientHeight,
      scrollTop: primary.scrollTop,
      maxScrollTop,
    };
  });
}

async function scrollPrimarySheetToBottom(dialog) {
  for (let pass = 0; pass < 6; pass += 1) {
    await dialog.evaluate((el) => {
      const md = window.matchMedia('(min-width: 768px)').matches;
      const contentCol = el.querySelector('[data-festival-sheet-content]');
      const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
      const target = Math.max(primary.scrollHeight, el.scrollHeight);
      primary.scrollTop = target;
      el.scrollTop = target;
    });
    await dialog.evaluate(() => new Promise((resolve) => setTimeout(resolve, 80)));
  }
}

/** Pixel height of 안내-only blocks below the tab strip (overview tab panel extent). */
async function measureOverviewTabContentHeight(dialog) {
  return dialog.evaluate((el) => {
    const tablist = el.querySelector('[role="tablist"]');
    const anchor = tablist?.getBoundingClientRect().bottom ?? 0;
    let maxBottom = anchor;
    for (const sel of [
      '[data-festival-detail-slot]',
      '[data-festival-overview-reserve]',
      '[data-festival-section="nearAttractions"]',
      '[data-festival-section="courses"]',
    ]) {
      const node = el.querySelector(sel);
      if (node) maxBottom = Math.max(maxBottom, node.getBoundingClientRect().bottom);
    }
    return Math.round(maxBottom - anchor);
  });
}

async function waitForOverviewScrollBaseline(dialog) {
  await expect(dialog.locator('[data-festival-detail-slot]')).toBeVisible({ timeout: 30_000 });
  await expect(dialog.locator('[data-festival-detail-skeleton]')).toHaveCount(0, {
    timeout: 45_000,
  });
  await expect
    .poll(async () => (await measurePrimaryScroller(dialog)).scrollHeight, {
      timeout: 60_000,
    })
    .toBeGreaterThan(3000);
  const metrics = await measurePrimaryScroller(dialog);
  const tabContentHeight = await measureOverviewTabContentHeight(dialog);
  const overviewExtent = Math.max(
    tabContentHeight,
    Math.floor(metrics.scrollHeight * 0.55),
  );
  return { ...metrics, tabContentHeight, overviewExtent };
}

async function waitForProgramTabReady(dialog) {
  await expect(dialog.getByRole('tab', { name: /프로그램/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(dialog.locator('[data-festival-detail-skeleton]')).toHaveCount(0, {
    timeout: 45_000,
  });
  await expect
    .poll(
      async () =>
        dialog.evaluate((root) => {
          const t = root.textContent || '';
          return (
            t.includes('e2e 무대·체험 블록') ||
            t.includes('국화 전시·체험 블록') ||
            t.includes('국향 가을음악회')
          );
        }),
      { timeout: 45_000 },
    )
    .toBe(true);
}

/**
 * Blank-sheet regression needs a scroll offset far past the overview tab’s document height
 * (iOS/WebKit keeps momentum / scrollTop when the active tab’s layout shrinks).
 */
async function assertPreTapScrollDepth({
  dialog,
  overviewScrollHeight,
  overviewTabContentHeight,
  overviewExtent,
  tabKey,
  slug,
  testInfo,
}) {
  const preTap = await measurePrimaryScroller(dialog);
  const minRequired = Math.max(
    MIN_PRE_TAP_SCROLL_TOP_PX,
    Math.floor(overviewExtent * OVERVIEW_SCROLL_HEIGHT_FACTOR),
  );
  testInfo.annotations.push({
    type: 'pre-tap-scroll',
    description: JSON.stringify({
      slug,
      tab: tabKey,
      overviewScrollHeight,
      overviewTabContentHeight,
      overviewExtent,
      minRequired,
      preTapScrollTop: preTap.scrollTop,
      preTapScrollHeight: preTap.scrollHeight,
      preTapMaxScrollTop: preTap.maxScrollTop,
    }),
  });
  expect(
    preTap.scrollTop,
    `${slug} · ${tabKey}: scrollTop ${preTap.scrollTop} must be ≥ max(${MIN_PRE_TAP_SCROLL_TOP_PX}, ${OVERVIEW_SCROLL_HEIGHT_FACTOR}× overview extent ${overviewExtent}px) [tab content ${overviewTabContentHeight}px · sheet scrollHeight ${overviewScrollHeight}]`,
  ).toBeGreaterThanOrEqual(minRequired);
  expect(
    preTap.scrollTop,
    `${slug} · ${tabKey}: must be scrolled to bottom (within 4px of max)`,
  ).toBeGreaterThanOrEqual(preTap.maxScrollTop - 4);
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

// Pre-tap scroll depth guards the WebKit blank-sheet regression (long sub-tab scroll, then
// «안내로 돌아가기»). Production scroll-reset lives in returnToOverviewTab — no test flag to disable it.
test.describe('festival back to overview — WebKit 390', () => {
  test.describe.configure({ timeout: TEST_TIMEOUT_MS });

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context, page }) => {
    await installFestivalBackOverviewFixtures(context);
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
  });

  for (const { id, slug } of FESTIVALS) {
    for (const { pattern, key } of SUB_TABS_WITH_BACK) {
      test(`${slug} · ${key}: bottom scroll → 안내로 돌아가기 shows overview top`, async ({
        page,
      }, testInfo) => {
        let dialog = await openFestival(page, id);
        await expect(dialog.getByRole('tab', { name: /^안내$/ })).toHaveAttribute(
          'aria-selected',
          'true',
        );
        const overviewBaseline = await waitForOverviewScrollBaseline(dialog);
        const overviewScrollHeight = overviewBaseline.scrollHeight;
        const overviewTabContentHeight = overviewBaseline.tabContentHeight;
        const overviewExtent = overviewBaseline.overviewExtent;

        const tab = dialog.getByRole('tab', { name: pattern });
        try {
          await tab.waitFor({ state: 'visible', timeout: TAB_WAIT_MS });
        } catch {
          test.skip(true, `${slug}: ${key} tab not offered`);
        }

        const programTab = dialog.getByRole('tab', { name: /프로그램/ });
        if (key === 'reading') {
          // Reading pane is capped at 10 videos; deep-scroll program first to satisfy the
          // “scroll far past overview height” precondition, then exercise back from 읽을거리.
          await programTab.click();
          await waitForProgramTabReady(dialog);
          await scrollPrimarySheetToBottom(dialog);
          await assertPreTapScrollDepth({
            dialog,
            overviewScrollHeight,
            overviewTabContentHeight,
            overviewExtent,
            tabKey: 'program (pre-reading)',
            slug,
            testInfo,
          });
          await tab.click();
          await expect(dialog.getByText(/e2e 축제 현장 스케치/).first()).toBeVisible({
            timeout: 25_000,
          });
        } else if (key === 'program') {
          await tab.click();
          await waitForProgramTabReady(dialog);
          await scrollPrimarySheetToBottom(dialog);
        } else {
          await tab.click();
          await expect(dialog.locator('.grid .aspect-square').first()).toBeVisible({
            timeout: 30_000,
          });
          await scrollPrimarySheetToBottom(dialog);
        }

        const backBtn = dialog.getByRole('button', { name: '안내로 돌아가기' });
        await expect(backBtn).toBeVisible();
        await backBtn.scrollIntoViewIfNeeded();

        if (key !== 'reading') {
          await assertPreTapScrollDepth({
            dialog,
            overviewScrollHeight,
            overviewTabContentHeight,
            overviewExtent,
            tabKey: key,
            slug,
            testInfo,
          });
        }

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

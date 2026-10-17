import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/pr493-followup');
const VIEWPORT = { width: 390, height: 844 };
const GANGNEUNG_NOODLES_ID = '2930716';
const YEONGNAM_GUNWI_WALK_ID = '4109218';
const manifest = [];

async function openFestivalDeep(page, festivalId) {
  const base = (process.env.PLAYWRIGHT_BASE_URL || 'https://www.gateo.kr/').replace(/\/$/, '');
  await page.goto(`${base}/korea?festival=${festivalId}`, {
    waitUntil: 'load',
    timeout: 120_000,
  });
  await dismissLocHint(page);
  const hero = page.locator('[data-festival-hero]').first();
  await expect(hero).toBeVisible({ timeout: 120_000 });
  const dialog = page.getByRole('dialog').filter({ has: hero });
  if (await dialog.count()) return dialog.first();
  return hero.locator('xpath=ancestor::*[@role="dialog"][1]');
}

async function shot(page, file, meta = {}) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, viewportWidth: VIEWPORT.width, ...meta });
  return path;
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

async function waitDetailBottomFullySettled(page, dialog) {
  await expect
    .poll(
      async () => {
        const grey = await greyPlaceholderReport(dialog);
        const loadingNearby = await dialog.getByText(/주변.*불러오는 중|Loading nearby/i).count();
        const lodgingReserve = await dialog.locator('[data-festival-lodging-reserve]').count();
        return grey.greyTileCount === 0 && loadingNearby === 0 && lodgingReserve === 0;
      },
      { timeout: 120_000 },
    )
    .toBe(true);
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function greyPlaceholderReport(dialog) {
  return dialog.evaluate((el) => {
    const pendingNearby = el.querySelectorAll('[data-nearby-thumb-pending]').length;
    const emptyNearby = el.querySelectorAll('[data-nearby-thumb="empty"]').length;
    const photoReserve = el.querySelectorAll('[data-festival-photo-reserve]').length;
    const heroPending = el.querySelectorAll('[data-festival-photo-pending]').length;
    const belowLoading = el.querySelectorAll('[data-festival-below-loading]').length;
    const belowReserve = el.querySelectorAll('[data-festival-below-reserve]').length;
    const greyTileCount = pendingNearby + belowReserve + belowLoading;
    return {
      pendingNearby,
      emptyNearby,
      photoReserve,
      heroPending,
      belowLoading,
      belowReserve,
      greyTileCount,
    };
  });
}

async function assertCultureThumbsSettled(dialog) {
  const culture = dialog.locator('[data-festival-section="nearCulture"]');
  if ((await culture.count()) === 0) return { cultureVisible: false };
  await expect
    .poll(async () => await culture.locator('[data-nearby-thumb-pending]').count(), {
      timeout: 30_000,
    })
    .toBe(0);
  const thumbCount = await culture.locator('[data-nearby-thumb]').count();
  return { cultureVisible: true, thumbCount };
}

async function assertNoTourApiEmptyCopy(dialog) {
  await expect(dialog.getByText(/TourAPI/i)).toHaveCount(0);
}

async function scrollGangneungCultureIntoView(dialog) {
  const leports = dialog.locator('[data-festival-section="nearLeports"]');
  const culture = dialog.locator('[data-festival-section="nearCulture"]');
  await expect(leports.getByText('관동하키센터')).toBeVisible({ timeout: 60_000 });
  await expect(culture.getByText('강릉시립미술관 교동')).toBeVisible({ timeout: 60_000 });
  await dialog.evaluate((el) => {
    const hockey = [...el.querySelectorAll('[data-festival-section="nearLeports"] li')].find((li) =>
      li.textContent?.includes('관동하키센터'),
    );
    const museum = el.querySelector('[data-festival-section="nearCulture"] li');
    if (hockey) hockey.scrollIntoView({ block: 'start' });
    if (museum) museum.scrollIntoView({ block: 'nearest' });
  });
  await dialog.page().waitForTimeout(300);
}

async function scrollYeongnamCultureGapIntoView(dialog) {
  const culture = dialog.locator('[data-festival-section="nearCulture"]');
  await expect(culture).toHaveCount(0);
  const courses = dialog.locator('[data-festival-section="nearCourses"]');
  const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
  if (await courses.count()) {
    await courses.first().scrollIntoViewIfNeeded();
    await dialog.evaluate((el) => {
      const node = el.querySelector('[data-festival-section="nearCourses"]');
      if (node) node.scrollIntoView({ block: 'start' });
    });
  } else if (await attractions.count()) {
    await attractions.first().scrollIntoViewIfNeeded();
    await dialog.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
    });
  } else {
    await dialog.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
    });
  }
  await dialog.page().waitForTimeout(300);
}

test.describe('PR493 follow-up — culture thumb pin + copy @390', () => {
  test.setTimeout(180_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.afterAll(async () => {
    await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  });

  test('강릉 문화 · 영남 빈 문화 — 정착 캡처', async ({ page }, testInfo) => {
    const browser = testInfo.project.name;
    const suffix = browser.includes('chromium') ? 'chromium' : 'webkit';

    const gangneungDialog = await openFestivalDeep(page, GANGNEUNG_NOODLES_ID);
    await waitDetailBottomFullySettled(page, gangneungDialog);
    const gangneungCulture = await assertCultureThumbsSettled(gangneungDialog);
    await assertNoTourApiEmptyCopy(gangneungDialog);
    await scrollGangneungCultureIntoView(gangneungDialog);
    const gangneungGrey = await greyPlaceholderReport(gangneungDialog);
    expect(gangneungGrey.greyTileCount, 'gangneung grey tiles').toBe(0);
    await shot(page, `01-gangneung-settled-${suffix}.png`, {
      region: '강원·강릉',
      festivalId: GANGNEUNG_NOODLES_ID,
      browser: suffix,
      settled: true,
      surface:
        '강릉 국수 축제 — 레포츠(관동하키센터)·문화(강릉시립미술관 교동) 정착, 핀/사진만',
      greyPlaceholderReport: gangneungGrey,
      greyTileCount: gangneungGrey.greyTileCount,
      ...gangneungCulture,
    });
    const yeongnamDialog = await openFestivalDeep(page, YEONGNAM_GUNWI_WALK_ID);
    await waitDetailBottomFullySettled(page, yeongnamDialog);
    await assertNoTourApiEmptyCopy(yeongnamDialog);
    const cultureVisible = (await yeongnamDialog.locator('[data-festival-section="nearCulture"]').count()) > 0;
    const yeongnamCulture = cultureVisible
      ? await assertCultureThumbsSettled(yeongnamDialog)
      : { cultureVisible: false };
    await scrollYeongnamCultureGapIntoView(yeongnamDialog);
    const yeongnamGrey = await greyPlaceholderReport(yeongnamDialog);
    expect(yeongnamGrey.greyTileCount, 'yeongnam grey tiles').toBe(0);
    await shot(page, `03-yeongnam-settled-${suffix}.png`, {
      region: '영남·경북',
      festivalId: YEONGNAM_GUNWI_WALK_ID,
      browser: suffix,
      settled: true,
      surface: '군위 가족걷기 — 맛집·레포츠·문화 섹션 없음, 코스 직전 영역',
      nearFoodVisible:
        (await yeongnamDialog.locator('[data-festival-section="nearFood"]').count()) > 0,
      nearLeportsVisible:
        (await yeongnamDialog.locator('[data-festival-section="nearLeports"]').count()) > 0,
      greyPlaceholderReport: yeongnamGrey,
      greyTileCount: yeongnamGrey.greyTileCount,
      ...yeongnamCulture,
    });
  });
});

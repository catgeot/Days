import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/pr493-followup');
const VIEWPORT = { width: 390, height: 844 };
const GANGNEUNG_NOODLES_ID = '2930716';
const manifest = [];

async function shot(page, file, meta = {}) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, ...meta });
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

async function openFestivalHubFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i })
    .click({ timeout: 180_000 });
  await page
    .getByRole('link', { name: /한국의 축제로 이동|Go to Korea festivals/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function selectSidoChip(page, namePattern) {
  const chip = page.getByRole('button', { name: namePattern }).first();
  await expect(chip).toBeVisible({ timeout: 60_000 });
  await chip.click();
}

async function openFestivalById(page, festivalId) {
  const card = page.locator(`[data-festival-id="${festivalId}"]`).first();
  await expect(card).toBeVisible({ timeout: 120_000 });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function openFirstMatchingCardWithId(page, pattern) {
  const cards = page.getByRole('main').locator('[data-festival-id]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const card = cards.filter({ hasText: pattern }).first();
  await expect(card).toBeVisible({ timeout: 120_000 });
  const festivalId = await card.getAttribute('data-festival-id');
  const title = (await card.innerText()).split('\n')[0]?.trim();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return { dialog, festivalId, title };
}

async function waitDetailBottomFullySettled(page, dialog) {
  await expect(dialog.getByText(/주변.*불러오는 중|Loading nearby/i)).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-below-loading]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-below-reserve]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect
    .poll(async () => await dialog.locator('[data-nearby-thumb-pending]').count(), {
      timeout: 120_000,
    })
    .toBe(0);
  await page.waitForLoadState('networkidle', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function assertCultureThumbsSettled(dialog) {
  const culture = dialog.locator('[data-festival-section="nearCulture"]');
  if ((await culture.count()) === 0) return { cultureVisible: false };
  await culture.scrollIntoViewIfNeeded();
  const pending = await culture.locator('[data-nearby-thumb-pending]').count();
  expect(pending, 'culture thumbs still pending').toBe(0);
  const thumbs = culture.locator('[data-nearby-thumb]');
  const count = await thumbs.count();
  for (let i = 0; i < count; i += 1) {
    const kind = await thumbs.nth(i).getAttribute('data-nearby-thumb');
    expect(kind, 'culture thumb stuck in pending').not.toBe('pending');
    if (kind === 'photo') {
      const img = thumbs.nth(i).locator('img[data-festival-photo-loaded="true"]');
      await expect(img).toHaveCount(1);
    } else {
      expect(kind).toBe('empty');
      await expect(thumbs.nth(i).locator('[data-thumb-fallback="1"]')).toBeVisible();
    }
  }
  return { cultureVisible: true, thumbCount: count };
}

async function assertNoTourApiEmptyCopy(dialog) {
  await expect(dialog.getByText(/TourAPI/i)).toHaveCount(0);
}

test.describe('PR493 follow-up — culture thumb pin + copy @390', () => {
  test.setTimeout(600_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.afterAll(async () => {
    await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  });

  test('강릉 · 서울 · 영남 — 별책부록 주변 정착', async ({ page }, testInfo) => {
    const browser = testInfo.project.name;
    const suffix = browser.includes('chromium') ? 'chromium' : 'webkit';

    await openFestivalHubFromHome(page);
    await selectSidoChip(page, /강원/);
    const gangneungDialog = await openFestivalById(page, GANGNEUNG_NOODLES_ID);
    await waitDetailBottomFullySettled(page, gangneungDialog);
    const gangneungCulture = await assertCultureThumbsSettled(gangneungDialog);
    await assertNoTourApiEmptyCopy(gangneungDialog);
    await gangneungDialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await shot(page, `01-gangneung-settled-${suffix}.png`, {
      region: '강원',
      festivalId: GANGNEUNG_NOODLES_ID,
      browser: suffix,
      ...gangneungCulture,
    });

    await openFestivalHubFromHome(page);
    await selectSidoChip(page, /서울/);
    const seoulOpen = await openFirstMatchingCardWithId(page, /서울|한강|문화|축제/i);
    await waitDetailBottomFullySettled(page, seoulOpen.dialog);
    const seoulCulture = await assertCultureThumbsSettled(seoulOpen.dialog);
    await assertNoTourApiEmptyCopy(seoulOpen.dialog);
    await seoulOpen.dialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await shot(page, `02-seoul-settled-${suffix}.png`, {
      region: '서울',
      festivalId: seoulOpen.festivalId,
      browser: suffix,
      ...seoulCulture,
    });

    await selectSidoChip(page, /경남|부산|대구|울산|경북/);
    const yeongnamOpen = await openFirstMatchingCardWithId(page, /축제|페스티벌|문화|대회/i);
    await waitDetailBottomFullySettled(page, yeongnamOpen.dialog);
    const yeongnamCulture = await assertCultureThumbsSettled(yeongnamOpen.dialog);
    await assertNoTourApiEmptyCopy(yeongnamOpen.dialog);
    await yeongnamOpen.dialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await shot(page, `03-yeongnam-settled-${suffix}.png`, {
      region: '영남',
      festivalId: yeongnamOpen.festivalId,
      browser: suffix,
      ...yeongnamCulture,
    });
  });
});

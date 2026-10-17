import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/pr493');
const VIEWPORT = { width: 390, height: 844 };
const manifest = [];

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

async function shot(page, file, meta = {}) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, ...meta });
  return path;
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

async function openFirstMatchingCard(page, pattern) {
  const cards = page.getByRole('main').locator('[data-festival-id]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const card = cards.filter({ hasText: pattern }).first();
  await expect(card).toBeVisible({ timeout: 120_000 });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function waitNearbySectionsSettled(dialog) {
  await expect(dialog.getByText(/주변.*불러오는 중|Loading nearby/i)).toHaveCount(0, {
    timeout: 120_000,
  });
}

async function closeDetail(page) {
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    await page.getByRole('button', { name: /^닫기$|^Close$/i }).last().click();
    await expect(dialog).toHaveCount(0, { timeout: 30_000 });
  }
}

async function captureMooniDepartureDock(page, dialog, file, meta) {
  await dialog.locator('[data-festival-mooni-inline]').first().click({ timeout: 60_000 });
  await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
  const dock = page.getByTestId('mooni-festival-access-dock');
  await expect(dock).toBeVisible({ timeout: 30_000 });
  await expect(dock.locator('[data-festival-origin]').first()).toBeVisible();
  await shot(page, file, meta);
  await page.goto('/korea', { waitUntil: 'domcontentloaded' });
  await dismissLocHint(page);
}

test.describe('PR493 festival detail follow-ups — WebKit 390 user flow', () => {
  test.setTimeout(360_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.afterAll(async () => {
    await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  });

  test('강원 · 서울 · 영남/호남 — MOONi 출발·빈 맛집/레포츠 숨김', async ({ page }) => {
    await openFestivalHubFromHome(page);
    await shot(page, '01-festival-hub.png', { surface: 'festival hub after home entry' });

    await selectSidoChip(page, /강원/);
    const gangDialog = await openFirstMatchingCard(page, /강릉|춘천|평창|동해/i);
    await waitNearbySectionsSettled(gangDialog);
    await gangDialog.evaluate((el) => {
      el.querySelector('[data-festival-section="nearFood"]')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(400);
    await shot(page, '02-gangwon-detail-near-sections.png', {
      surface: '강원 축제 상세 — 주변 섹션 (맛집/레포츠 없으면 미표시)',
      region: '강원',
    });
    await captureMooniDepartureDock(page, gangDialog, '03-gangwon-mooni-departure-dock.png', {
      surface: 'MOONi 가는 법 출발 칩·라벨 (강원)',
      region: '강원',
    });

    await openFestivalHubFromHome(page);
    await selectSidoChip(page, /서울/);
    const seoulDialog = await openFirstMatchingCard(page, /서울|한강|문화|축제/i);
    await waitNearbySectionsSettled(seoulDialog);
    await seoulDialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await page.waitForTimeout(500);
    await shot(page, '04-seoul-detail-scroll.png', {
      surface: '서울 권역 축제 상세 하단 스크롤',
      region: '서울',
    });
    await closeDetail(page);

    await selectSidoChip(page, /경남|부산|대구|울산|경북/);
    const yeongnamDialog = await openFirstMatchingCard(page, /축제|페스티벌|문화|대회/i);
    await waitNearbySectionsSettled(yeongnamDialog);
    const foodVisible = await yeongnamDialog.locator('[data-festival-section="nearFood"]').count();
    const leportsVisible = await yeongnamDialog.locator('[data-festival-section="nearLeports"]').count();
    await yeongnamDialog.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
    });
    await page.waitForTimeout(500);
    await shot(page, '05-yeongnam-detail-empty-sections.png', {
      surface: '영남·부산 권 축제 — 맛집/레포츠 0건이면 섹션 없음',
      region: '영남',
      nearFoodVisible: foodVisible > 0,
      nearLeportsVisible: leportsVisible > 0,
    });
    await closeDetail(page);
  });
});

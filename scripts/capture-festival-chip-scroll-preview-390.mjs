/**
 * Real-data WebKit 390 captures on a Vercel preview (TourAPI live).
 * PREVIEW_BASE=https://days-git-…vercel.app node scripts/capture-festival-chip-scroll-preview-390.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit, devices } from 'playwright';

const OUT =
  process.env.CAPTURE_OUT || '/opt/cursor/artifacts/festival-chip-scroll-real';
const BASE = (
  process.env.PREVIEW_BASE ||
  'https://days-git-cursor-festival-chip-scroll-e267-catgeots-projects.vercel.app'
).replace(/\/$/, '');

const VIEWPORT = { width: 390, height: 844 };

async function clip(page, name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  return path;
}

async function dismissLocHint(page) {
  const close = page.getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 3000 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function scrollMainToBottom(page) {
  const main = page.locator('main');
  await main.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(200);
}

async function openRegionPanel(page) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
}

async function tapSido(page, label) {
  await openRegionPanel(page);
  const chip = page.getByRole('button', { name: new RegExp(`^${label}\\s+\\d+`) });
  await chip.waitFor({ state: 'visible', timeout: 120_000 });
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  await page.locator('main [data-festival-id]').first().waitFor({ timeout: 120_000 });
  await page.waitForTimeout(400);
}

async function tapFirstAvailableSido(page, labels) {
  for (const label of labels) {
    await openRegionPanel(page);
    const chip = page.getByRole('button', { name: new RegExp(`^${label}\\s+\\d+`) });
    if ((await chip.count()) === 0) continue;
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    await page.locator('main [data-festival-id]').first().waitFor({ timeout: 120_000 });
    await page.waitForTimeout(400);
    return label;
  }
  throw new Error(`no sido chip among: ${labels.join(', ')}`);
}

async function openTimePanel(page) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
}

async function openThemePanel(page) {
  await page.getByRole('button', { name: /테마 대분류/ }).click();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const saved = [];

  await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 120_000 });
  await dismissLocHint(page);
  await page.locator('main [data-festival-id]').first().waitFor({ timeout: 180_000 });

  const longSido = await tapFirstAvailableSido(page, [
    '광주',
    '경기',
    '전남',
    '부산',
    '강원',
    '서울',
  ]);
  await scrollMainToBottom(page);
  saved.push(await clip(page, `01-${longSido}-bottom`));

  for (const sido of ['대구', '대전', '인천', '서울']) {
    await tapSido(page, sido);
    saved.push(await clip(page, `02-after-${sido}`));
    await scrollMainToBottom(page);
  }

  await tapSido(page, longSido);
  await scrollMainToBottom(page);

  await openTimePanel(page);
  const weekChip = page.getByRole('button', { name: /이번 주/ }).first();
  if (await weekChip.isVisible().catch(() => false)) {
    await weekChip.click();
    saved.push(await clip(page, '03-time-this-week'));
    await scrollMainToBottom(page);
    const monthChip = page.getByRole('button', { name: /이번 달/ }).first();
    if (await monthChip.isVisible().catch(() => false)) {
      await monthChip.click();
      saved.push(await clip(page, '04-time-this-month'));
      await scrollMainToBottom(page);
    }
    const datePick = page.locator('[data-period-id="date"]');
    if (await datePick.isVisible().catch(() => false)) {
      await datePick.click();
      const sheet = page.getByRole('dialog').filter({ hasText: /날짜|기간/ });
      if (await sheet.isVisible().catch(() => false)) {
        await sheet.getByRole('button', { name: /적용|확인/ }).first().click({ timeout: 5000 }).catch(() => {});
        saved.push(await clip(page, '05-time-custom-date'));
        await scrollMainToBottom(page);
      }
    }
    await openTimePanel(page);
    await weekChip.click().catch(() => {});
    saved.push(await clip(page, '06-time-back-this-week'));
    await scrollMainToBottom(page);
  } else {
    const window30 = page.locator('[data-period-id="window30"]');
    if (await window30.isVisible().catch(() => false)) {
      await window30.click();
      saved.push(await clip(page, '03-time-window30'));
      await scrollMainToBottom(page);
    }
  }

  await openThemePanel(page);
  const themeAll = page.getByRole('button', { name: /^전체\s+\d+/ }).first();
  const firstTheme = page.locator('[data-festival-list-heading]').locator('..').locator('button').filter({ hasText: /문화|음식|자연|체험/ }).first();
  const themeBtn = (await firstTheme.isVisible().catch(() => false)) ? firstTheme : themeAll;
  if (await themeBtn.isVisible().catch(() => false)) {
    await themeBtn.click();
    saved.push(await clip(page, '07-theme-chip'));
    await scrollMainToBottom(page);
  }

  await scrollMainToBottom(page);
  const deepBeforeMap = await page.locator('main').evaluate((el) => el.scrollTop);
  await page
    .getByRole('button', { name: '지도로 위치·동선 보기' })
    .evaluate((el) => el.click());
  await page.waitForTimeout(400);
  await page
    .getByRole('button', { name: /지도 닫기|목록으로/ })
    .first()
    .evaluate((el) => el.click());
  await page.waitForTimeout(400);
  saved.push(await clip(page, '08-after-map-close'));
  const deepAfterMap = await page.locator('main').evaluate((el) => el.scrollTop);
  console.log(`map close scroll preserved: ${deepAfterMap >= deepBeforeMap * 0.5}`);

  await scrollMainToBottom(page);
  const deepBeforeFav = await page.locator('main').evaluate((el) => el.scrollTop);
  const favToggle = page.getByRole('button', { name: '즐겨찾기·본 항목' });
  await favToggle.evaluate((el) => el.click());
  await page.waitForTimeout(300);
  await favToggle.evaluate((el) => el.click());
  await page.waitForTimeout(300);
  saved.push(await clip(page, '09-after-favorites-close'));
  const deepAfterFav = await page.locator('main').evaluate((el) => el.scrollTop);
  console.log(`favorites close scroll preserved: ${deepAfterFav >= deepBeforeFav * 0.5}`);

  await scrollMainToBottom(page);
  const scrollBeforeDetail = await page.locator('main').evaluate((el) => el.scrollTop);
  const card = page.locator('main [data-festival-id]').first();
  await card.evaluate((el) => el.click());
  const dialog = page.getByRole('dialog').filter({
    has: page.locator('#korea-festival-sheet-title'),
  });
  await dialog.waitFor({ timeout: 90_000 });
  await page.waitForTimeout(600);
  const closeDetail = dialog.getByRole('button', { name: /^닫기$/ }).first();
  if (await closeDetail.isVisible().catch(() => false)) {
    await closeDetail.click();
  } else {
    await page.goBack();
  }
  await page.locator('main [data-festival-id]').first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(500);
  saved.push(await clip(page, '10-after-detail-back'));
  const scrollAfterDetail = await page.locator('main').evaluate((el) => el.scrollTop);
  console.log(
    `detail back scroll preserved: ${scrollAfterDetail >= scrollBeforeDetail * 0.5} (${scrollBeforeDetail} -> ${scrollAfterDetail})`,
  );

  await browser.close();
  console.log('Saved:\n' + saved.map((p) => `  ${p}`).join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

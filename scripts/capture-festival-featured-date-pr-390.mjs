/**
 * WebKit 390×844 — featured strip on region chips + date week shortcuts (PR evidence).
 * CAPTURE_BASE_URL — preview or local with VITE_GATEO_FESTIVAL_DATE_CHIP=1
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir =
  process.env.CAPTURE_OUT_DIR ||
  join(root, 'docs/qa/festival-featured-date-pr');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5193';

mkdirSync(outDir, { recursive: true });

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log(`shot ${name}`);
}

async function dismissLocHint(page) {
  const close = page.getByRole('main').getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* */
  }
}

async function gotoKorea(page) {
  await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function pickSido(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 30_000 });
  await chip.click();
}

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

const regions = [
  { slug: 'nationwide', pick: async () => {
    await page.getByRole('button', { name: /지역 대분류/ }).click();
    await page.locator('[aria-label="세부 칩"]').getByRole('button', { name: /^전국/ }).click();
  } },
  { slug: 'seoul', pick: () => pickSido(page, '서울') },
  { slug: 'gangwon', pick: () => pickSido(page, '강원') },
  { slug: 'gyeongnam', pick: () => pickSido(page, '경남') },
];

for (const region of regions) {
  await gotoKorea(page);
  await region.pick();
  await page
    .locator('[data-social-promo-loading], [data-social-promo-festival-row], main [data-festival-id]')
    .first()
    .waitFor({ timeout: 120_000 });
  await shoot(page, `featured-${region.slug}.png`);
}

await gotoKorea(page);
await page.getByRole('button', { name: /시간 대분류/ }).click();
await page.locator('[data-period-id="date"]').click();
const sheet = page.locator('[data-festival-date-sheet]');
await sheet.waitFor();
await shoot(page, 'date-sheet-default-this-week.png');
await sheet.locator('[data-week-shortcut="0"]').click();
await shoot(page, 'date-sheet-ibenju-selected.png');
await sheet.locator('[data-week-shortcut="1"]').click();
await shoot(page, 'date-sheet-daeumju-selected.png');
await sheet.getByRole('button', { name: '이 기간 보기' }).click();
await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
await shoot(page, 'date-filter-daeumju-applied.png');

await context.close();
await browser.close();
console.log(`captures ok → ${outDir}`);

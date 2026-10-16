/**
 * WebKit 390px — panel meta order for «한 달 이내» (place · until · count).
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 (default http://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-meta-order');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5194';

mkdirSync(outDir, { recursive: true });

function pngWidth(path) {
  return readFileSync(path).readUInt32BE(16);
}

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  if (pngWidth(path) !== 390) throw new Error(`${name} width mismatch`);
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
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
  await dismissLocHint(page);
  await page
    .locator('main [data-festival-id], [data-festival-period-empty]')
    .first()
    .waitFor({ timeout: 90_000 });
}

async function pickProvince(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 30_000 });
  await chip.click();
}

async function selectMonthChip(page) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  const chip = page.locator('[data-period-id="window30"]');
  await chip.waitFor({ timeout: 20_000 });
  await chip.click();
  await page.locator('[data-period-id="window30"][aria-pressed="true"]').waitFor({
    timeout: 15_000,
  });
}

const regions = [
  { slug: 'seoul', province: '서울', district: '' },
  { slug: 'gangneung', province: '강원', district: '강릉' },
  { slug: 'jeju', province: '제주', district: '' },
];

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
const notes = [`Capture base: ${onUrl}`];

for (const region of regions) {
  await gotoKorea(page);
  await pickProvince(page, region.province);
  if (region.district) {
    const district = page
      .locator('[aria-label="지역 구분 칩"]')
      .getByRole('button', { name: new RegExp(region.district) });
    await district.first().waitFor({ timeout: 30_000 });
    await district.first().click();
  }
  await selectMonthChip(page);
  const meta = (await page.locator('[data-festival-list-meta]').innerText()).trim();
  if (!/까지/.test(meta) || /^\s*~/.test(meta)) {
    throw new Error(`${region.slug} meta order unexpected: ${meta}`);
  }
  notes.push(`${region.slug} meta: ${meta}`);
  await shoot(page, `${region.slug}-meta-order.png`);
}

writeFileSync(join(outDir, 'NOTES.md'), `# date-chip-meta-order\n\n${notes.map((l) => `- ${l}`).join('\n')}\n`);
await context.close();
await browser.close();
console.log('captures ok');

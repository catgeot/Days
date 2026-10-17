/**
 * WebKit 390px — date-chip flag ON default landing + 서울 · 강릉(강릉시) · 제주 (live).
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 (default http://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-default-landing');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5194';
const notesPath = join(outDir, 'NOTES.md');

mkdirSync(outDir, { recursive: true });

function pngWidth(path) {
  const buf = readFileSync(path);
  return buf.readUInt32BE(16);
}

async function dismissLocHint(page) {
  const close = page.getByRole('main').getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* hint not shown */
  }
}

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  const width = pngWidth(path);
  if (width !== 390) {
    throw new Error(`${name} width ${width}, expected 390`);
  }
  console.log(`shot ${name}`);
}

async function gotoKorea(page) {
  await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
  await dismissLocHint(page);
  await page.locator('[data-social-promo-festival-row], main [data-festival-id]').first().waitFor({
    timeout: 90_000,
  });
}

async function pickProvince(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 30_000 });
  await chip.click();
}

async function pickDistrict(page, districtLabel) {
  const chip = page
    .locator('[aria-label="지역 구분 칩"]')
    .getByRole('button', { name: new RegExp(districtLabel) });
  await chip.first().waitFor({ timeout: 30_000 });
  await chip.first().click();
}

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const notes = [];

await gotoKorea(page);
const promo = page.locator('[data-social-promo-festival-row]');
if (!(await promo.count())) {
  notes.push('WARN: recommended row not visible on landing');
}
const heading = await page.locator('[data-festival-list-heading] h2').innerText();
if (heading.includes('한 달 이내')) {
  throw new Error(`landing heading should not pre-apply window30: ${heading}`);
}
await shoot(page, '00-flag-on-default-landing.png');

for (const step of [
  { file: '01-seoul.png', province: '서울', district: '' },
  { file: '02-gangneung-city.png', province: '강원', district: '강릉' },
  { file: '03-jeju.png', province: '제주', district: '' },
]) {
  await gotoKorea(page);
  await pickProvince(page, step.province);
  if (step.district) await pickDistrict(page, step.district);
  await page.waitForTimeout(600);
  await shoot(page, step.file);
}

await browser.close();

writeFileSync(
  notesPath,
  `# date-chip default landing (WebKit 390)\n\n- base: ${onUrl}\n- ${notes.join('\n- ') || 'recommended row visible on landing'}\n`,
);
console.log('done', outDir);

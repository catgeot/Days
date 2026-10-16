/**
 * WebKit 390 — date sheet week shortcuts + applied list (서울, live data).
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 (default https://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-week-shortcuts');
const onUrl = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5194';

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

async function gotoKoreaSeoul(page) {
  await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
  await dismissLocHint(page);
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  await page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: /^서울/ })
    .click();
  await page
    .locator('main [data-festival-id], [data-festival-period-empty]')
    .first()
    .waitFor({ timeout: 90_000 });
}

const shortcuts = [
  { slug: 'this-week', shortcutId: '0' },
  { slug: 'next-week', shortcutId: '1' },
  { slug: 'in-2-weeks', shortcutId: '2' },
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

for (const item of shortcuts) {
  await gotoKoreaSeoul(page);
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  await page.locator('[data-period-id="date"]').click();
  const sheet = page.locator('[data-festival-date-sheet]');
  await sheet.waitFor();
  await sheet.locator(`[data-week-shortcut="${item.shortcutId}"]`).click();
  await shoot(page, `${item.slug}-sheet-selected.png`);
  await sheet.getByRole('button', { name: '이 기간 보기' }).click();
  await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
  await page.waitForTimeout(500);
  await shoot(page, `${item.slug}-list-applied.png`);
  const chip = await page.locator('[data-period-id="date"]').innerText();
  notes.push(`${item.slug}: date chip → ${chip.trim()}`);
}

writeFileSync(
  join(outDir, 'NOTES.md'),
  `# date-chip-week-shortcuts\n\n${notes.map((l) => `- ${l}`).join('\n')}\n`,
);
await context.close();
await browser.close();
console.log('captures ok');

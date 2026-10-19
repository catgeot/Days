/**
 * WebKit 390 — date sheet week shortcuts + applied list.
 * Regions: 전국 · 서울 · 강릉 · 제주. Flag-on server: CAPTURE_BASE_URL.
 */
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-week-shortcuts');
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
}

async function pickProvince(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 30_000 });
  await chip.click();
}

async function waitSettled(page) {
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
    if (!imgs.length) return true;
    return imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 20_000 }).catch(async () => {
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
      return imgs.every((img) => img.complete);
    }, null, { timeout: 8_000 }).catch(() => {});
  });
  await page.evaluate(() => document.fonts?.ready);
}

const regions = [
  { slug: 'nationwide', province: '', district: '' },
  { slug: 'seoul', province: '서울', district: '' },
  { slug: 'gangneung', province: '강원', district: '강릉' },
  { slug: 'jeju', province: '제주', district: '' },
];

const shortcuts = [
  { slug: 'this-week', shortcutId: '0' },
  { slug: 'next-week', shortcutId: '1' },
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
const written = new Set(['NOTES.md']);

for (const region of regions) {
  for (const item of shortcuts) {
    await gotoKorea(page);
    if (region.province) await pickProvince(page, region.province);
    else {
      await page.getByRole('button', { name: /지역 대분류/ }).click();
      const nationwide = page
        .locator('[aria-label="세부 칩"]')
        .getByRole('button', { name: /^전국/ });
      await nationwide.waitFor({ timeout: 30_000 });
      await nationwide.click();
    }
    if (region.district) {
      const district = page
        .locator('[aria-label="지역 구분 칩"]')
        .getByRole('button', { name: new RegExp(region.district) });
      await district.first().waitFor({ timeout: 30_000 });
      await district.first().click();
    }
    await page
      .locator('main [data-festival-id], [data-festival-period-empty]')
      .first()
      .waitFor({ timeout: 90_000 });
    await page.getByRole('button', { name: /시간 대분류/ }).click();
    await page.locator('[data-period-id="date"]').click();
    const sheet = page.locator('[data-festival-date-sheet]');
    await sheet.waitFor();
    await sheet.locator(`[data-week-shortcut="${item.shortcutId}"]`).click();
    const sheetName = `${region.slug}-${item.slug}-sheet-selected.png`;
    await shoot(page, sheetName);
    written.add(sheetName);
    await sheet.getByRole('button', { name: '이 기간 보기' }).click();
    await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
    await waitSettled(page);
    const listName = `${region.slug}-${item.slug}-list-applied.png`;
    await shoot(page, listName);
    written.add(listName);
    const chip = (await page.locator('[data-period-id="date"]').innerText()).replace(/\s+/g, ' ').trim();
    notes.push(`${region.slug} ${item.slug}: date chip → ${chip}`);
  }
}

for (const name of readdirSync(outDir)) {
  if (!written.has(name)) unlinkSync(join(outDir, name));
}

writeFileSync(
  join(outDir, 'NOTES.md'),
  `# date-chip-week-shortcuts\n\n${notes.map((l) => `- ${l}`).join('\n')}\n`,
);
await context.close();
await browser.close();
console.log('captures ok');

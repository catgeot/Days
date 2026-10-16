/**
 * WebKit 390px captures — festival «한 달 이내» chip + date sheet footer clearance.
 * (a) date sheet open with apply CTA visible
 * (b) list scrolled to end above trust bar
 * (c) 한 달 이내 selected — 서울 · 강릉(강릉시) · 제주 (live data)
 *
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 (default http://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-month');
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

async function waitListImages(page) {
  const photoNotes = [];
  await page
    .waitForFunction(() => {
      const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
      if (!imgs.length) return true;
      return imgs.every((img) => img.complete);
    }, null, { timeout: 25_000 })
    .catch(() => {});

  await page.waitForTimeout(400);

  const broken = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
    return imgs
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .slice(0, 8);
  });
  if (broken.length) {
    photoNotes.push(`broken thumbs (${broken.length}): ${broken.join(', ')}`);
  }
  return photoNotes;
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
  return path;
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

async function openTime(page) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  await page.locator('[data-period-id="window30"]').waitFor({ timeout: 20_000 });
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
  await openTime(page);
  const chip = page.locator('[data-period-id="window30"]');
  await chip.click();
  await page.locator('[data-period-id="window30"][aria-pressed="true"]').waitFor({
    timeout: 15_000,
  });
  await expectChipLabel(page);
}

async function expectChipLabel(page) {
  const chip = page.locator('[data-period-id="window30"]');
  const text = (await chip.innerText()).trim();
  if (!text.includes('한 달 이내') || text.includes('~')) {
    throw new Error(`window30 chip label unexpected: ${text}`);
  }
  if (await chip.locator('[data-period-count]').count()) {
    throw new Error('window30 chip should not show count');
  }
}

async function scrollListToEnd(page) {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = main.scrollHeight;
  });
  await page.waitForTimeout(350);
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
});
const page = await context.newPage();
const allNotes = [`Capture base: ${onUrl}`];

await gotoKorea(page);
await openTime(page);
await page.locator('[data-period-id="date"]').click();
const sheet = page.locator('[data-festival-date-sheet]');
await sheet.waitFor();
await sheet.locator('[data-ymd]').first().waitFor({ timeout: 15_000 });
const trustHidden = await page.getByRole('navigation', { name: 'GATEO 약관 및 출처' }).count();
if (trustHidden !== 0) {
  throw new Error('Trust bar should hide while date sheet is open');
}
const applyBtn = sheet.getByRole('button', { name: '이 기간 보기' });
const applyBox = await applyBtn.boundingBox();
if (!applyBox || applyBox.y + applyBox.height > 844) {
  throw new Error('Apply button not fully visible in viewport');
}
await shoot(page, 'a-date-sheet-apply-visible.png');
await page.keyboard.press('Escape');
await sheet.waitFor({ state: 'hidden', timeout: 10_000 });

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
  const photoNotes = await waitListImages(page);
  await shoot(page, `c-${region.slug}-month-chip.png`);
  if (photoNotes.length) allNotes.push(`${region.slug}: ${photoNotes.join('; ')}`);

  await scrollListToEnd(page);
  await waitListImages(page);
  await shoot(page, `b-${region.slug}-list-end.png`);
}

writeFileSync(
  notesPath,
  `# date-chip-month captures\n\n${allNotes.map((line) => `- ${line}`).join('\n')}\n`,
);
await context.close();
await browser.close();
console.log('captures ok');

/**
 * WebKit 390px captures with LIVE festival data (no API mocks).
 * Flow: /korea → region → time row → 30일 안 → custom date range → open one festival.
 *
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 dev/preview (default http://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';
import { KOREA_FILTER_CHIP_ACTIVE_BG_RGB } from '../src/pages/Korea/koreaHubFilterChipStyles.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-real');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5194';
const notesPath = join(outDir, 'NOTES.md');

mkdirSync(outDir, { recursive: true });

function pngWidth(path) {
  const buf = readFileSync(path);
  return buf.readUInt32BE(16);
}

function addDaysYmd(ymd, days) {
  const utc = new Date(Date.UTC(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(4, 6)) - 1,
    Number(ymd.slice(6, 8)),
  ));
  utc.setUTCDate(utc.getUTCDate() + days);
  const y = String(utc.getUTCFullYear());
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function seoulTodayFromInstant(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return `${y}${m}${d}`;
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

/** Wait until active/idle period chips match painted fill (class swap alone is not enough during CSS transition). */
async function waitPeriodChipPaint(page, activeId, idleId) {
  const activeSel = `[data-period-id="${activeId}"]`;
  const idleSel = `[data-period-id="${idleId}"]`;
  await page.locator(`${activeSel}[aria-pressed="true"]`).waitFor({ timeout: 15_000 });
  await page.waitForFunction(
    ({ activeSelector, idleSelector, activeRgb }) => {
      const active = document.querySelector(activeSelector);
      const idle = document.querySelector(idleSelector);
      if (!active || !idle) return false;
      const activeBg = getComputedStyle(active).backgroundColor;
      const idleBg = getComputedStyle(idle).backgroundColor;
      return activeBg === activeRgb && idleBg === 'rgb(255, 255, 255)';
    },
    {
      activeSelector: activeSel,
      idleSelector: idleSel,
      activeRgb: KOREA_FILTER_CHIP_ACTIVE_BG_RGB,
    },
    { timeout: 8_000 },
  );
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

async function gotoKorea(page) {
  await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
  await dismissLocHint(page);
  await page
    .locator('main [data-festival-id], [data-festival-period-empty]')
    .first()
    .waitFor({ timeout: 90_000 });
}

async function applyShortRange(page, todayYmd) {
  const start = addDaysYmd(todayYmd, 1);
  const end = addDaysYmd(todayYmd, 2);
  await page.locator('[data-period-id="date"]').click();
  const sheet = page.locator('[data-festival-date-sheet]');
  await sheet.waitFor();
  await sheet.locator(`[data-ymd="${start}"]`).scrollIntoViewIfNeeded();
  await sheet.locator(`[data-ymd="${start}"]`).click();
  await sheet.locator(`[data-ymd="${end}"]`).click();
  await sheet.getByRole('button', { name: '이 기간 보기' }).click();
  await waitPeriodChipPaint(page, 'date', 'window30');
  return { start, end };
}

async function openFirstFestival(page) {
  const card = page.locator('main [data-festival-id]').first();
  await card.waitFor({ timeout: 30_000 });
  await card.click();
  await page.locator('#korea-festival-sheet-title').waitFor({ timeout: 45_000 });
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
const todayYmd = seoulTodayFromInstant(new Date());
const allNotes = [`Capture base: ${onUrl}`, `Seoul calendar day: ${todayYmd}`];

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
  await openTime(page);
  await page.locator('[data-period-id="window30"]').click();
  await page.locator('[data-period-id="window30"][aria-pressed="true"]').waitFor();
  const photoNotes30 = await waitListImages(page);
  await shoot(page, `${region.slug}-30d.png`);
  if (photoNotes30.length) allNotes.push(`${region.slug}-30d: ${photoNotes30.join('; ')}`);

  const range = await applyShortRange(page, todayYmd);
  allNotes.push(`${region.slug} custom range ${range.start}–${range.end}`);
  await waitPeriodChipPaint(page, 'date', 'window30');

  const photoNotesRange = await waitListImages(page);
  await shoot(page, `${region.slug}-custom-range.png`);
  if (photoNotesRange.length) {
    allNotes.push(`${region.slug}-custom-range: ${photoNotesRange.join('; ')}`);
  }

  if (await page.locator('main [data-festival-id]').count()) {
    await openFirstFestival(page);
    await shoot(page, `${region.slug}-festival-detail.png`);
    await page.getByRole('button', { name: '닫기' }).first().click();
    await page.locator('#korea-festival-sheet-title').waitFor({ state: 'hidden', timeout: 20_000 });
  } else {
    allNotes.push(`${region.slug}: no festivals in picked range — skipped detail sheet`);
    await shoot(page, `${region.slug}-festival-detail-skipped.png`);
  }
}

writeFileSync(
  notesPath,
  `# date-chip-real captures\n\n${allNotes.map((line) => `- ${line}`).join('\n')}\n`,
);
await context.close();
await browser.close();
console.log('captures ok');

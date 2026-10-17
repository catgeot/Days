/**
 * WebKit 390 — date sheet week step (flag on).
 * Clock is Saturday 2026-10-17 Asia/Seoul so this week is today–Sunday.
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 (default http://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-sheet-week-step');
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
    /* hint not shown */
  }
}

async function waitStyles(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
  await page.waitForFunction(() => document.styleSheets.length > 0);
}

async function waitImages(page) {
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img, [data-social-promo-festival-row] img')];
    if (!imgs.length) return false;
    return imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 25_000 }).catch(async () => {
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('main [data-festival-id] img, [data-social-promo-festival-row] img')];
      return imgs.length > 0 && imgs.every((img) => img.complete);
    }, null, { timeout: 8_000 }).catch(() => {});
  });
  await waitStyles(page);
}

async function waitSheetPaint(page) {
  const sheet = page.locator('[data-festival-date-sheet]');
  await sheet.waitFor();
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[data-festival-date-sheet] [role="dialog"]');
    const range = document.querySelector('[data-festival-date-range]');
    const weekday = document.querySelector('[data-festival-date-weekdays]');
    if (!dialog || !range || !weekday) return false;
    const paint = getComputedStyle(dialog);
    const label = getComputedStyle(range);
    return paint.backgroundColor !== 'rgba(0, 0, 0, 0)'
      && Number.parseFloat(label.fontSize) > 0
      && weekday.querySelectorAll('span').length === 7;
  });
  await waitStyles(page);
  return sheet;
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
await page.clock.install({ time: new Date('2026-10-17T03:00:00.000Z') });

await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
await dismissLocHint(page);
await page.locator('[data-social-promo-festival-row]').waitFor({ timeout: 60_000 });
await waitImages(page);
const heading = (await page.locator('[data-festival-list-heading] h2').innerText()).replace(/\s+/g, ' ').trim();
if (heading !== '전국') throw new Error(`hub heading changed: ${heading}`);
const timeMajor = page.getByRole('button', { name: /시간 대분류/ });
const timeText = (await timeMajor.innerText()).replace(/\s+/g, ' ');
if (!timeText.includes('기간')) throw new Error(`time category is not 기간: ${timeText}`);
if (timeText.includes('이번 달')) throw new Error(`time category preselects 이번 달: ${timeText}`);
await page.getByRole('button', { name: /시간 대분류/ }).click();
const window30 = page.locator('[data-period-id="window30"]');
await window30.waitFor();
if ((await window30.getAttribute('aria-pressed')) !== 'false') {
  throw new Error('30-day chip should not be selected on the hub');
}
await page.keyboard.press('Escape').catch(() => {});
await page.locator('main').click({ position: { x: 8, y: 8 } }).catch(() => {});
await shoot(page, '00-hub-first-screen.png');

await page.getByRole('button', { name: /시간 대분류/ }).click();
await page.locator('[data-period-id="date"]').click();
let sheet = await waitSheetPaint(page);
const range = sheet.locator('[data-festival-date-range]');
await range.waitFor();
if ((await range.innerText()).trim() !== '10.17–10.18') {
  throw new Error(`expected this week 10.17–10.18, got ${(await range.innerText()).trim()}`);
}
const weekdays = (await sheet.locator('[data-festival-date-weekdays]').innerText()).replace(/\s+/g, '');
if (weekdays !== '월화수목금토일') throw new Error(`weekday header ${weekdays}`);
if (await sheet.getByRole('button', { name: '이번 주' }).count()) {
  throw new Error('이번 주 chip should be gone');
}
if (!(await sheet.locator('[data-week-step="back"]').isDisabled())) {
  throw new Error('back should be disabled on this week');
}
await shoot(page, '01-sheet-this-week.png');

await sheet.locator('[data-week-shortcut="1"]').click();
await range.filter({ hasText: '10.19–10.25' }).waitFor();
await waitSheetPaint(page);
await shoot(page, '02-sheet-next-week.png');

await sheet.locator('[data-week-shortcut="2"]').click();
await range.filter({ hasText: '10.26–11.1' }).waitFor();
await waitSheetPaint(page);
await shoot(page, '03-sheet-week-after.png');

await sheet.locator('[data-week-step="forward"]').click();
await sheet.locator('[data-week-step="forward"]').click();
await range.filter({ hasText: '11.9–11.15' }).waitFor();
await waitSheetPaint(page);
await shoot(page, '04-sheet-following-twice.png');

for (let i = 0; i < 6; i += 1) {
  if (await sheet.locator('[data-week-step="back"]').isDisabled()) break;
  await sheet.locator('[data-week-step="back"]').click();
}
if (!(await sheet.locator('[data-week-step="back"]').isDisabled())) {
  throw new Error('back still enabled after returning to this week');
}
await range.filter({ hasText: '10.17–10.18' }).waitFor();
await waitSheetPaint(page);
await shoot(page, '05-sheet-back-to-this-week.png');

const apply = sheet.getByRole('button', { name: '이 기간 보기' });
const box = await apply.boundingBox();
if (!box || box.y + box.height > 844) {
  throw new Error(`apply button not fully above the viewport bottom: ${JSON.stringify(box)}`);
}
await apply.click();
await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
await page.locator('main [data-festival-id]').first().waitFor({ timeout: 30_000 });
await waitImages(page);
const chip = (await page.locator('[data-period-id="date"]').innerText()).replace(/\s+/g, ' ');
if (!chip.includes('날짜 선택')) throw new Error(`applied chip ${chip}`);
if (/\d+\.\d+/.test(chip)) throw new Error(`date chip should not show the range: ${chip}`);
const pressed = await page.locator('[data-period-id="date"]').getAttribute('aria-pressed');
if (pressed !== 'true') throw new Error('날짜 선택 should stay selected');
const meta = (await page.locator('[data-festival-list-meta]').innerText()).replace(/\s+/g, ' ');
if (!meta.includes('10.17–10.18')) throw new Error(`meta missing range: ${meta}`);
const afterHeading = (await page.locator('[data-festival-list-heading] h2').innerText()).replace(/\s+/g, ' ').trim();
if (afterHeading !== '전국') throw new Error(`list heading changed: ${afterHeading}`);
const timeTextAfter = (await page.getByRole('button', { name: /시간 대분류/ }).innerText()).replace(/\s+/g, ' ');
if (!timeTextAfter.includes('기간') || timeTextAfter.includes('10.17')) {
  throw new Error(`time category should stay 기간: ${timeTextAfter}`);
}
await shoot(page, '06-list-after-apply.png');

async function shootDefault(slug, province) {
  await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
  await dismissLocHint(page);
  if (province) {
    await page.getByRole('button', { name: /지역 대분류/ }).click();
    const regionChip = page
      .locator('[aria-label="세부 칩"]')
      .getByRole('button', { name: new RegExp(`^${province}`) });
    await regionChip.waitFor({ timeout: 30_000 });
    await regionChip.click();
  }
  await page.locator('[data-social-promo-festival-row], main [data-festival-id]').first().waitFor({
    timeout: 60_000,
  });
  await waitImages(page);
  const title = (await page.locator('[data-festival-list-heading] h2').innerText()).replace(/\s+/g, ' ').trim();
  if (title.includes('한 달') || title.includes('·')) throw new Error(`${slug} heading ${title}`);
  const major = (await page.getByRole('button', { name: /시간 대분류/ }).innerText()).replace(/\s+/g, ' ');
  if (!major.includes('기간')) throw new Error(`${slug} time category ${major}`);
  await shoot(page, `default-${slug}.png`);
}

await shootDefault('nationwide', '');
await shootDefault('gangwon', '강원');
await shootDefault('jeju', '제주');

await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
await dismissLocHint(page);
await page.locator('main [data-festival-id]').first().waitFor({ timeout: 60_000 });
await page.getByRole('button', { name: /시간 대분류/ }).click();
await page.locator('[data-period-id="date"]').click();
sheet = await waitSheetPaint(page);
await sheet.locator('[data-week-shortcut="1"]').click();
await sheet.locator('[data-festival-date-range]').filter({ hasText: '10.19–10.25' }).waitFor();
await sheet.getByRole('button', { name: '이 기간 보기' }).click();
await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
await page.locator('[data-period-id="date"]').waitFor();
if ((await page.locator('[data-period-id="date"]').getAttribute('aria-pressed')) !== 'true') {
  throw new Error('picked-dates chip is not selected');
}
const pickedMeta = (await page.locator('[data-festival-list-meta]').innerText()).replace(/\s+/g, ' ');
if (!pickedMeta.includes('10.19–10.25')) throw new Error(`picked meta ${pickedMeta}`);
await waitImages(page);
await shoot(page, 'list-dates-picked.png');

writeFileSync(
  join(outDir, 'NOTES.md'),
  [
    '# date-sheet-week-step',
    '',
    `- base: ${onUrl}`,
    '- clock: 2026-10-17 Asia/Seoul (Saturday; this week is today–Sunday)',
    '- flag: VITE_GATEO_FESTIVAL_DATE_CHIP=1',
    '- 00 hub first screen (recommended row, 기간, region heading, no chip selected)',
    '- 01 sheet opens on this week, Monday-start grid, ‹ disabled',
    '- 02 다음 주',
    '- 03 다다음 주 (10.26–11.1)',
    '- 04 그다음 주 › twice (11.9–11.15)',
    '- 05 ‹ back to this week, ‹ disabled',
    '- 06 list after 이 기간 보기 (날짜 선택 stays selected; range is on the meta line)',
    '- default-nationwide / default-gangwon / default-jeju: first screen, no chip selected',
    '- list-dates-picked: 다음 주 applied, chip selected, meta shows 10.19–10.25',
    '',
  ].join('\n'),
);

await context.close();
await browser.close();
console.log('captures ok', outDir);

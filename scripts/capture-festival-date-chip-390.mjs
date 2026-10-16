/**
 * WebKit 390px captures for the festival date chips.
 * Flag-on server: CAPTURE_BASE_URL (default http://127.0.0.1:5194)
 * Flag-off server: CAPTURE_OFF_URL (default http://127.0.0.1:5195)
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5194';
const offUrl = process.env.CAPTURE_OFF_URL || 'http://127.0.0.1:5195';

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

function nextWeekend(todayYmd) {
  const utc = new Date(Date.UTC(
    Number(todayYmd.slice(0, 4)),
    Number(todayYmd.slice(4, 6)) - 1,
    Number(todayYmd.slice(6, 8)),
  ));
  const dow = utc.getUTCDay();
  const satOffset = dow === 6 ? 0 : dow === 0 ? 6 : 6 - dow;
  const start = addDaysYmd(todayYmd, satOffset);
  return { start, end: addDaysYmd(start, 1) };
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
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
    if (!imgs.length) return true;
    return imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 18_000 }).catch(async () => {
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
      return imgs.every((img) => img.complete);
    }, null, { timeout: 8_000 }).catch(() => {});
  });
}

async function assertOneLineHeading(page, pattern) {
  const heading = page.locator('[data-festival-list-heading] h2');
  await heading.waitFor();
  const text = (await heading.innerText()).replace(/\s+/g, ' ').trim();
  if (!pattern.test(text)) {
    throw new Error(`heading ${JSON.stringify(text)} does not match ${pattern}`);
  }
  if (text.includes('"') || text.includes('축제 리스트')) {
    throw new Error(`heading still quoted: ${text}`);
  }
  const lines = await heading.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects().length;
  });
  if (lines !== 1) throw new Error(`heading wraps (${lines}): ${text}`);
  console.log(`heading ${text}`);
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
  console.log(`shot ${name} width=${width}`);
  return path;
}

async function periodCount(page, id) {
  const text = await page.locator(`[data-period-id="${id}"] [data-period-count]`).innerText();
  return Number(text.trim());
}

function listCards(page) {
  return page.locator('main [data-festival-id]');
}

async function openTime(page) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  await page.locator('[data-period-id="window30"], [data-period-id="thisMonth"]').first().waitFor();
}

async function pickProvince(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page.locator('[aria-label="세부 칩"]').getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 20_000 });
  await chip.click();
}

async function gotoKorea(page, base) {
  await page.goto(`${base}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 60_000 });
  await dismissLocHint(page);
  await page.locator('main [data-festival-id], [data-festival-period-empty]').first().waitFor({
    timeout: 60_000,
  });
}

async function compareCount(page, id, label) {
  const count = await periodCount(page, id);
  const cards = await listCards(page).count();
  console.log(`${label} chip=${count} cards=${cards}`);
  if (count !== cards) {
    throw new Error(`${label} chip ${count} !== cards ${cards}`);
  }
  return count;
}

async function applyWeekend(page, todayYmd) {
  const { start, end } = nextWeekend(todayYmd);
  await page.locator('[data-period-id="date"]').click();
  const sheet = page.locator('[data-festival-date-sheet]');
  await sheet.waitFor();
  const startBtn = sheet.locator(`[data-ymd="${start}"]`);
  await startBtn.scrollIntoViewIfNeeded();
  await startBtn.click();
  await sheet.locator(`[data-ymd="${end}"]`).click();
  await sheet.getByRole('button', { name: '이 기간 보기' }).click();
  await page.locator('[data-period-id="date"][aria-pressed="true"]').waitFor();
  return { start, end };
}

async function openFestivalAndBack(page) {
  const card = listCards(page).first();
  await card.click();
  await page.locator('#korea-festival-sheet-title').waitFor({ timeout: 30_000 });
  await page.getByRole('button', { name: '닫기' }).first().click();
  await page.locator('#korea-festival-sheet-title').waitFor({ state: 'hidden', timeout: 15_000 });
}

const browser = await webkit.launch();
const baseContext = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
};

const seoulNow = seoulTodayFromInstant(new Date());
console.log(`seoul today ${seoulNow}`);

const onContext = await browser.newContext({
  ...baseContext,
  timezoneId: 'Asia/Seoul',
});
const page = await onContext.newPage();

const regionFilter = new Set(
  (process.env.CAPTURE_REGIONS || '').split(',').map((id) => id.trim()).filter(Boolean),
);
const regions = [
  { id: 'seoul', label: '서울', file: 'seoul-30d.png', weekend: 'seoul-weekend-back.png', district: '' },
  { id: 'gangwon', label: '강원', file: 'gangwon-gangneung-30d.png', weekend: 'gangwon-gangneung-weekend.png', district: '강릉' },
  { id: 'jeju', label: '제주', file: 'jeju-30d.png', weekend: 'jeju-weekend.png', district: '' },
].filter((region) => regionFilter.size === 0 || regionFilter.has(region.id));

for (const region of regions) {
  await gotoKorea(page, onUrl);
  await pickProvince(page, region.label);
  if (region.district) {
    const district = page.locator('[aria-label="지역 구분 칩"]').getByRole('button', { name: new RegExp(region.district) });
    await district.first().waitFor({ timeout: 20_000 });
    await district.first().click();
  }
  await openTime(page);
  await page.locator('[data-period-id="window30"]').click();
  await page.locator('[data-period-id="window30"][aria-pressed="true"]').waitFor();
  const monthCards = await listCards(page).count();
  console.log(`${region.label} 한 달 이내 cards=${monthCards}`);
  if (await page.locator('[data-period-id="window30"] [data-period-count]').count()) {
    throw new Error('window30 chip should not show count');
  }
  await assertOneLineHeading(page, /한 달 이내/);
  if ((await page.locator('[data-festival-list-heading] h2').innerText()).includes('~')) {
    throw new Error('heading still shows chip end date');
  }
  if (await page.locator('[data-period-id="date"] [data-period-count]').count()) {
    throw new Error('date chip shows a count before a day is picked');
  }
  await waitListImages(page);
  await shoot(page, region.file);

  await applyWeekend(page, seoulNow);
  await compareCount(page, 'date', `${region.label} weekend`);
  await assertOneLineHeading(page, /10\.17\u201310\.18/);
  if ((await listCards(page).count()) > 0) {
    await waitListImages(page);
    await openFestivalAndBack(page);
    await page.locator('[data-period-id="date"][aria-pressed="true"]').waitFor();
  }
  await waitListImages(page);
  await assertOneLineHeading(page, /10\.17\u201310\.18/);
  await shoot(page, region.weekend);
}

if (regionFilter.size === 0) {
await gotoKorea(page, onUrl);
await openTime(page);
await page.locator('[data-period-id="date"]').click();
const sheet = page.locator('[data-festival-date-sheet]');
await sheet.waitFor();
const ymds = await sheet.locator('[data-ymd]:not([disabled])').evaluateAll((els) =>
  els.map((el) => el.getAttribute('data-ymd')).filter(Boolean),
);
let emptyYmd = '';
for (let i = ymds.length - 1; i >= 0 && i > ymds.length - 40; i -= 1) {
  const ymd = ymds[i];
  await sheet.locator(`[data-ymd="${ymd}"]`).scrollIntoViewIfNeeded();
  await sheet.locator(`[data-ymd="${ymd}"]`).click();
  await sheet.getByRole('button', { name: '이 기간 보기' }).click();
  const empty = page.locator('[data-festival-period-empty]');
  if (await empty.count()) {
    emptyYmd = ymd;
    break;
  }
  await page.locator('[data-period-id="date"]').click();
  await sheet.waitFor();
}
if (!emptyYmd) throw new Error('no far-future empty day in the loaded calendar');
console.log(`empty day ${emptyYmd}`);
await page.locator('[data-period-id="date"][aria-pressed="true"]').waitFor();
await shoot(page, 'empty-far-future.png');

const tzContext = await browser.newContext({
  ...baseContext,
  timezoneId: 'America/Los_Angeles',
});
await tzContext.addInitScript(() => {
  const fixed = Date.parse('2026-10-16T15:05:00.000Z');
  const RealDate = Date;
  function MockDate(...args) {
    if (!(this instanceof MockDate)) return RealDate(...args);
    if (args.length === 0) return new RealDate(fixed);
    return new RealDate(...args);
  }
  MockDate.prototype = RealDate.prototype;
  MockDate.now = () => fixed;
  MockDate.parse = RealDate.parse;
  MockDate.UTC = RealDate.UTC;
  window.Date = MockDate;
});
const tzPage = await tzContext.newPage();
await gotoKorea(tzPage, onUrl);
await openTime(tzPage);
const tzChip = tzPage.locator('[data-period-id="window30"]');
await tzChip.click();
await tzChip.waitFor();
const tzLabel = await tzChip.innerText();
console.log(`la chip ${tzLabel.replace(/\s+/g, ' ')}`);
if (!tzLabel.includes('~11.15')) {
  throw new Error(`expected Seoul next-day window ~11.15, got ${tzLabel}`);
}
await waitListImages(tzPage);
await shoot(tzPage, 'tz-la-after-seoul-midnight.png');
await tzContext.close();

const offContext = await browser.newContext({
  ...baseContext,
  timezoneId: 'Asia/Seoul',
});
const offPage = await offContext.newPage();
await gotoKorea(offPage, offUrl);
await openTime(offPage);
await offPage.locator('[data-period-id="thisMonth"][aria-pressed="true"]').waitFor();
if (await offPage.locator('[data-period-id="window30"]').count()) {
  throw new Error('flag off still shows the 30-day chip');
}
await waitListImages(offPage);
await shoot(offPage, 'flag-off.png');
await offContext.close();
}
await onContext.close();
await browser.close();
console.log('captures ok');

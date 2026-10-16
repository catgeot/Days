/**
 * WebKit 390px captures for date-chip label dedupe + weekend window.
 * CAPTURE_BASE_URL (flag on, default http://127.0.0.1:5194)
 * CAPTURE_OFF_URL (flag off, default http://127.0.0.1:5195)
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/date-chip-dedupe');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5193';
const offUrl = process.env.CAPTURE_OFF_URL || 'http://127.0.0.1:5196';

const FIXTURE = [
  {
    contentId: '1001',
    title: '서울 경계 축제',
    eventStartDate: '20261016',
    eventEndDate: '20261016',
    addr1: '서울특별시 종로구 세종대로 1',
    areaCode: '1',
  },
  {
    contentId: '1005',
    title: '서울 둘째 축제',
    eventStartDate: '20261020',
    eventEndDate: '20261021',
    addr1: '서울특별시 마포구 양화로 1',
    areaCode: '1',
  },
  {
    contentId: '1006',
    title: '토요일만 축제',
    eventStartDate: '20261017',
    eventEndDate: '20261017',
    addr1: '서울특별시 용산구 이태원로 1',
    areaCode: '1',
  },
];

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

async function mockFestivalApi(page) {
  await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
    let action = '';
    try {
      action = String(route.request().postDataJSON()?.action || '');
    } catch {
      action = '';
    }
    if (action === 'festivalWindow') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: FIXTURE }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

async function gotoKorea(page, base) {
  await mockFestivalApi(page);
  await page.goto(`${base}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 60_000 });
  await dismissLocHint(page);
  await page.locator('main [data-festival-id]').first().waitFor({ timeout: 60_000 });
}

async function openTime(page, flagOn = true) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  const sel = flagOn ? '[data-period-id="window30"]' : '[data-period-id="thisMonth"]';
  await page.locator(sel).waitFor();
}

const browser = await webkit.launch();
const baseContext = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
};

const onContext = await browser.newContext(baseContext);
const page = await onContext.newPage();
await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
await gotoKorea(page, onUrl);
await page.getByRole('button', { name: /^서울\s+\d+$/ }).click();
await openTime(page);
const windowChip = page.locator('[data-period-id="window30"]');
await windowChip.click();
await windowChip.waitFor({ state: 'visible' });
const chipText = (await windowChip.innerText()).replace(/\s+/g, ' ').trim();
if (!chipText.includes('~11.14')) {
  throw new Error(`chip should show end date once: ${chipText}`);
}
const majorTime = (await page.getByRole('button', { name: /시간 대분류/ }).innerText())
  .replace(/\s+/g, ' ')
  .trim();
if (majorTime.includes('~11.14')) {
  throw new Error(`major time chip should be short: ${majorTime}`);
}
const heading = (await page.locator('[data-festival-list-heading] h2').innerText()).trim();
if (heading.includes('~11.14') || heading.includes('(~')) {
  throw new Error(`heading should be short period only: ${heading}`);
}
if (!heading.includes('30일 안')) {
  throw new Error(`heading missing short period: ${heading}`);
}
await shoot(page, 'flag-on-window30-dedupe.png');

const pickedContext = await browser.newContext(baseContext);
const pickedPage = await pickedContext.newPage();
await pickedPage.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
await gotoKorea(pickedPage, onUrl);
await pickedPage.getByRole('button', { name: /시간 대분류/ }).click();
await pickedPage.locator('[data-period-id="date"]').click();
const pickedSheet = pickedPage.locator('[data-festival-date-sheet]');
await pickedSheet.waitFor();
await pickedSheet.locator('[data-ymd="20261017"]').click();
await pickedSheet.locator('[data-ymd="20261018"]').click();
await pickedSheet.getByRole('button', { name: '이 기간 보기' }).click();
await pickedPage.locator('[data-period-id="date"][aria-pressed="true"]').waitFor();
const pickedMajor = (
  await pickedPage.getByRole('button', { name: /시간 대분류/ }).innerText()
)
  .replace(/\s+/g, ' ')
  .trim();
if (!pickedMajor.includes('10.17')) {
  throw new Error(`major time chip should show picked range: ${pickedMajor}`);
}
const pickedHeading = (
  await pickedPage.locator('[data-festival-list-heading] h2').innerText()
).trim();
if (!pickedHeading.includes('10.17')) {
  throw new Error(`heading should show picked range: ${pickedHeading}`);
}
if (pickedHeading.includes('날짜')) {
  throw new Error(`heading should not show date placeholder: ${pickedHeading}`);
}
await pickedPage.locator('main [data-festival-id]').first().waitFor({ timeout: 30_000 });
await shoot(pickedPage, 'flag-on-picked-range.png');
await pickedContext.close();

const satContext = await browser.newContext(baseContext);
const satPage = await satContext.newPage();
await satPage.clock.install({ time: new Date('2026-10-17T03:00:00.000Z') });
await gotoKorea(satPage, onUrl);
await openTime(satPage);
const weekendChip = satPage.locator('[data-period-id="weekend"]');
await weekendChip.click();
await weekendChip.waitFor();
await satPage.locator('[data-period-id="weekend"][aria-pressed="true"]').waitFor();
await shoot(satPage, 'flag-on-weekend-saturday.png');
await satContext.close();

const offContext = await browser.newContext(baseContext);
const offPage = await offContext.newPage();
await gotoKorea(offPage, offUrl);
await openTime(offPage, false);
await offPage.locator('[data-period-id="thisMonth"][aria-pressed="true"]').waitFor();
if (await offPage.locator('[data-period-id="window30"]').count()) {
  throw new Error('flag off still shows window30');
}
await shoot(offPage, 'flag-off-unchanged.png');
await offContext.close();

await onContext.close();
await browser.close();
console.log('dedupe captures ok');

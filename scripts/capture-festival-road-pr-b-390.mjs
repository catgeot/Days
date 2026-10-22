/**
 * WebKit 390×844 — festival home → region chip → festival → 동선 보기.
 * CAPTURE_BASE_URL default https://127.0.0.1:5196 (flag on).
 * CAPTURE_OFF_URL default https://127.0.0.1:5197 (flag off).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || join(root, 'docs/qa/festival-road-pr-b');
const onBase = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5196';
const offBase = process.env.CAPTURE_OFF_URL || 'https://127.0.0.1:5197';

mkdirSync(outDir, { recursive: true });

const ROUTES = [
  { file: '01-east-coast-on.png', city: '강릉', belt: '동해안' },
  { file: '02-chuncheon-on.png', city: '춘천', belt: '북부 내륙', periods: ['autumn'] },
  { file: '03-wonju-on.png', city: '원주', belt: '중부' },
];

function pngWidth(path) {
  const buf = readFileSync(path);
  return buf.readUInt32BE(16);
}

async function shot(page, name) {
  const file = join(outDir, name);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  const width = pngWidth(file);
  if (width !== 390) throw new Error(`${name} width ${width}`);
  return file;
}

async function alignInDialog(page, selector, offset = 8) {
  await page.locator(selector).evaluate((el, topOffset) => {
    const sheet = el.closest('[role="dialog"]');
    if (!sheet) return;
    const top = el.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop;
    sheet.scrollTop = Math.max(0, top - topOffset);
  }, offset);
}

async function gotoHome(page, base) {
  await page.goto(`${base}/korea`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('[data-festival-id]').first().waitFor({ timeout: 90000 });
  await page.locator('[aria-label="세부 칩"]').getByRole('button', { name: '강원' }).first().waitFor({
    timeout: 20000,
  });
}

function cityRow(page) {
  return page.locator('[aria-label="지역 구분 칩"]');
}

async function selectGangwonCity(page, city, periods = []) {
  const gangwon = page.locator('[aria-label="세부 칩"]').getByRole('button', { name: '강원' }).first();
  try {
    await gangwon.waitFor({ state: 'visible', timeout: 60000 });
  } catch (error) {
    const labels = await page.locator('button').allInnerTexts();
    throw new Error(
      `강원 chip missing: ${labels.slice(0, 25).map((text) => text.replace(/\s+/g, ' ').trim()).join(' | ')}`,
      { cause: error },
    );
  }
  await gangwon.click();
  const row = cityRow(page);
  await row.waitFor({ state: 'visible', timeout: 15000 });
  const chip = () => row.getByRole('button', { name: city, exact: false }).first();
  if (await chip().count()) {
    await chip().click();
    return;
  }
  for (const period of periods) {
    await page.getByRole('button', { name: '시간 대분류' }).click();
    const tab = page.locator(`[data-period-id="${period}"]`);
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await page.getByRole('button', { name: '지역 대분류' }).click();
    if (!(await gangwon.count())) continue;
    await gangwon.click();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    if (await chip().count()) {
      await chip().click();
      return;
    }
  }
  const labels = (await row.locator('button').allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
  throw new Error(`${city} chip missing. chips: ${labels.join(', ')}`);
}

async function openRoad(page, city, belt, periods) {
  await selectGangwonCity(page, city, periods);
  const row = page.locator('[data-festival-id]:not([data-social-promo-card])').first();
  await row.waitFor({ state: 'visible', timeout: 20000 });
  await row.click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 20000 });
  const entry = dialog.locator('[data-festival-road-entry]');
  await entry.waitFor({ state: 'visible', timeout: 15000 });
  await entry.click();
  const road = dialog.locator('[data-festival-road]');
  await road.waitFor({ state: 'visible' });
  const title = await road.locator('p').first().innerText();
  if (!title.includes(belt)) throw new Error(`${city} opened ${title}, wanted ${belt}`);
  await dialog.locator('[data-festival-road-map]').waitFor({ state: 'visible', timeout: 10000 });
  await dialog.locator('[data-festival-road-map-ready="1"]').waitFor({ timeout: 30000 });
  const pins = await dialog.locator('[data-festival-road-pin]').allInnerTexts();
  const numbers = pins.map((text) => Number(text.trim()));
  if (numbers.length < 2) throw new Error(`${city} pins ${numbers.join(',')}`);
  const sorted = [...numbers].sort((a, b) => a - b);
  if (numbers.join(',') !== sorted.join(',')) throw new Error(`${city} pin order ${numbers.join(',')}`);
  await alignInDialog(page, '[data-festival-road-map]', 200);
  return { title, pins: numbers };
}

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('console', msg.text().slice(0, 220));
});
page.on('response', (res) => {
  const url = res.url();
  if (url.includes('mapbox') && res.status() >= 400) {
    console.log('mapbox', res.status(), url.slice(0, 160));
  }
});

try {
  for (const route of ROUTES) {
    await gotoHome(page, onBase);
    const opened = await openRoad(page, route.city, route.belt, route.periods || []);
    const file = await shot(page, route.file);
    console.log(route.file, opened.title, opened.pins.join('-'), file);
  }

  await gotoHome(page, offBase);
  await selectGangwonCity(page, '강릉');
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 20000 });
  await dialog.locator('[data-festival-detail-summary]').waitFor({ timeout: 20000 });
  if (await dialog.locator('[data-festival-road-entry]').count()) {
    throw new Error('flag off still shows the road button');
  }
  await shot(page, '04-flag-off.png');
  console.log('04-flag-off.png');
} finally {
  await browser.close();
}

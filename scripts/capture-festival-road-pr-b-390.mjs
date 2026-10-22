/**
 * WebKit captures — festival home → region chip → festival → 동선 보기 (flag on).
 * Flag-off detail vs main on the same path (강릉·춘천·원주).
 *
 * CAPTURE_BASE_URL — flag on (default https://127.0.0.1:5196)
 * CAPTURE_OFF_URL — flag off build (default https://127.0.0.1:5197)
 * CAPTURE_MAIN_URL — main-line build for compare (optional, default https://127.0.0.1:5198)
 * CAPTURE_WIDTHS — comma list, default 390,1280
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || join(root, 'docs/qa/festival-road-pr-b');
const onBase = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5196';
const offBase = process.env.CAPTURE_OFF_URL || 'https://127.0.0.1:5197';
const mainBase = process.env.CAPTURE_MAIN_URL || 'https://127.0.0.1:5198';
const widths = (process.env.CAPTURE_WIDTHS || '390,1280')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => value > 0);

mkdirSync(outDir, { recursive: true });

const ROUTES_ON = [
  { slug: 'east-coast', city: '강릉', belt: '동해안' },
  { slug: 'chuncheon', city: '춘천', belt: '북부 내륙', periods: ['autumn'] },
  { slug: 'wonju', city: '원주', belt: '중부' },
];

const OFF_CITIES = [
  { slug: 'gangneung', city: '강릉', periods: [] },
  { slug: 'chuncheon', city: '춘천', periods: ['autumn'] },
  { slug: 'wonju', city: '원주', periods: [] },
];

function pngWidth(path) {
  const buf = readFileSync(path);
  return buf.readUInt32BE(16);
}

async function shot(page, name, width, height = 844) {
  const file = join(outDir, name);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width, height },
  });
  const actual = pngWidth(file);
  if (actual !== width) throw new Error(`${name} width ${actual}, wanted ${width}`);
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
  await gangwon.waitFor({ state: 'visible', timeout: 60000 });
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

async function openRoad(page, city, belt, periods, viewportWidth) {
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
  await alignInDialog(page, '[data-festival-road-map]', viewportWidth > 900 ? 120 : 200);
  return { title, pins: numbers };
}

async function openFestivalDetailOnly(page, city, periods) {
  await selectGangwonCity(page, city, periods);
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 20000 });
  await dialog.locator('[data-festival-detail-summary]').waitFor({ timeout: 20000 });
  await alignInDialog(page, '[data-festival-detail-summary]', 12);
}

async function runCaptures() {
  for (const width of widths) {
    const height = width >= 1000 ? 900 : 844;
    const browser = await webkit.launch();
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('mapbox') && res.status() >= 400) {
        console.log('mapbox', res.status(), url.slice(0, 160));
      }
    });

    try {
      let index = 1;
      for (const route of ROUTES_ON) {
        await gotoHome(page, onBase);
        const opened = await openRoad(page, route.city, route.belt, route.periods || [], width);
        const file = await shot(
          page,
          `${String(index).padStart(2, '0')}-${route.slug}-on-${width}.png`,
          width,
          height,
        );
        console.log(file, opened.title, opened.pins.join('-'));
        index += 1;
      }

      for (const city of OFF_CITIES) {
        await gotoHome(page, offBase);
        await openFestivalDetailOnly(page, city.city, city.periods);
        const dialog = page.locator('[role="dialog"]');
        if (await dialog.locator('[data-festival-road-entry]').count()) {
          throw new Error(`flag off still shows road for ${city.city}`);
        }
        if (await dialog.locator('[data-festival-road-slot]').count()) {
          throw new Error(`flag off shows road slot for ${city.city}`);
        }
        const offFile = await shot(page, `off-${city.slug}-${width}.png`, width, height);
        console.log('off', offFile);

        try {
          await gotoHome(page, mainBase);
          await openFestivalDetailOnly(page, city.city, city.periods);
          const mainFile = await shot(page, `main-${city.slug}-${width}.png`, width, height);
          console.log('main', mainFile);
        } catch (error) {
          console.log('main skip', city.slug, String(error.message || error).slice(0, 120));
        }
      }
    } finally {
      await browser.close();
    }
  }
}

await runCaptures();

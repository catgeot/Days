/**
 * WebKit QA r3 — festival road ON interactions + OFF detail after load.
 * Output: docs/qa/festival-road-qa-r3/ and mirror to CAPTURE_ARTIFACT_DIR.
 */
import { mkdirSync, readFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/festival-road-qa-r3');
const artifactDir = process.env.CAPTURE_ARTIFACT_DIR || '/opt/cursor/artifacts/festival-road-qa-r3';
const onBase = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5196';
const offBase = process.env.CAPTURE_OFF_URL || 'https://127.0.0.1:5197';
const widths = (process.env.CAPTURE_WIDTHS || '390,1280')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter((v) => v > 0);

mkdirSync(outDir, { recursive: true });
mkdirSync(artifactDir, { recursive: true });

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
  return readFileSync(path).readUInt32BE(16);
}

async function shot(page, name, width, height) {
  const file = join(outDir, name);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
  if (pngWidth(file) !== width) throw new Error(`${name} width mismatch`);
  cpSync(file, join(artifactDir, name));
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
  await page.goto(`${base}/korea`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.locator('[data-festival-id]').first().waitFor({ timeout: 90000 });
}

async function selectGangwonCity(page, city, periods = []) {
  const gangwon = page.locator('[aria-label="세부 칩"]').getByRole('button', { name: '강원' }).first();
  await gangwon.waitFor({ state: 'visible', timeout: 60000 });
  await gangwon.click();
  const row = page.locator('[aria-label="지역 구분 칩"]');
  await row.waitFor({ state: 'visible', timeout: 15000 });
  const chip = () => row.getByRole('button', { name: city, exact: false }).first();
  if (await chip().count()) {
    await chip().click();
    return;
  }
  for (const period of periods) {
    await page.getByRole('button', { name: '시간 대분류' }).click();
    await page.locator(`[data-period-id="${period}"]`).click();
    await page.getByRole('button', { name: '지역 대분류' }).click();
    await gangwon.click();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    if (await chip().count()) {
      await chip().click();
      return;
    }
  }
  throw new Error(`${city} chip missing`);
}

async function waitDetailLoaded(dialog) {
  await dialog.locator('[data-festival-detail-summary]').waitFor({ timeout: 30000 });
  await dialog.locator('[data-festival-hero-expand="ready"]').waitFor({ timeout: 90000 }).catch(() => {});
  const page = dialog.page();
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const reserve = await dialog.locator('[data-festival-summary-reserve]').count();
    const dateRow = await dialog.locator('[data-festival-summary-date]').count();
    if (reserve === 0 && dateRow > 0) break;
    await page.waitForTimeout(1000);
  }
  await dialog.locator('[data-nearby-parking="ready"]').waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function waitMapIdle(dialog) {
  await dialog.locator('[data-festival-road-map-ready="1"]').waitFor({ timeout: 45000 });
  await dialog.locator('[data-festival-road-map-tiles-idle="1"]').waitFor({ timeout: 45000 });
  await dialog.page().waitForTimeout(800);
}

async function openRoad(page, city, belt, periods, viewportWidth) {
  await selectGangwonCity(page, city, periods);
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await waitDetailLoaded(dialog);
  await dialog.locator('[data-festival-road-entry]').click();
  await dialog.locator('[data-festival-road]').waitFor({ state: 'visible' });
  const title = await dialog.locator('[data-festival-road] p').first().innerText();
  if (!title.includes(belt)) throw new Error(`belt mismatch ${title}`);
  await waitMapIdle(dialog);
  const pins = await dialog.locator('[data-festival-road-pin]').allInnerTexts();
  const numbers = pins.map((t) => Number(t.trim()));
  const sorted = [...numbers].sort((a, b) => a - b);
  if (numbers.join(',') !== sorted.join(',')) {
    throw new Error(`pin DOM order ${numbers.join(',')} not sorted`);
  }
  await alignInDialog(page, '[data-festival-road-map]', viewportWidth > 900 ? 100 : 180);
  return { title, pins: numbers };
}

async function openDetailOnly(page, city, periods) {
  await selectGangwonCity(page, city, periods);
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await waitDetailLoaded(dialog);
  await alignInDialog(page, '[data-festival-detail-summary]', 10);
}

async function captureOnFlow(page, route, width, height) {
  const base = route.slug;
  await gotoHome(page, onBase);
  await openRoad(page, route.city, route.belt, route.periods || [], width);
  const dialog = page.locator('[role="dialog"]');

  await shot(page, `on-${base}-open-${width}.png`, width, height);

  await dialog.locator('[data-week-shortcut="1"]').click();
  await waitMapIdle(dialog);
  await shot(page, `on-${base}-week-next-${width}.png`, width, height);

  const grayCandidates = ['goseong', 'yangyang', 'sokcho', 'cheorwon', 'yanggu', 'hwacheon'];
  let grayClicked = false;
  for (const hubId of grayCandidates) {
    const stop = dialog.locator(`[data-festival-road-stop="${hubId}"][data-festival-road-empty="1"]`);
    if (!(await stop.count())) continue;
    await stop.locator('button').first().click();
    grayClicked = true;
    break;
  }
  if (!grayClicked) {
    await dialog.locator('[data-festival-road-empty="1"]').first().locator('button').first().click();
  }
  await dialog.locator('[data-festival-road-fill]').waitFor({ timeout: 20000 }).catch(() => {});
  if (await dialog.locator('[data-festival-road-fill]').count()) {
    await shot(page, `on-${base}-stop-gray-${width}.png`, width, height);
    const nearby = dialog.locator('[data-festival-road-nearby-target]').first();
    if (await nearby.count()) {
      await nearby.click();
      await page.waitForTimeout(600);
      await shot(page, `on-${base}-nearby-${width}.png`, width, height);
    }
  }
}

async function captureOff(page, city, width, height) {
  await gotoHome(page, offBase);
  await openDetailOnly(page, city.city, city.periods);
  const dialog = page.locator('[role="dialog"]');
  if (await dialog.locator('[data-festival-road-entry]').count()) {
    throw new Error(`road entry on OFF ${city.city}`);
  }
  const official = await dialog.locator('[data-festival-official-home]').count();
  const reserveOfficial = await dialog.locator('[data-festival-detail-summary] a.text-transparent').count();
  console.log(`off-${city.slug}-${width}: official=${official} reservePlaceholder=${reserveOfficial}`);
  await shot(page, `off-${city.slug}-${width}.png`, width, height);
}

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
  try {
    for (const route of ROUTES_ON) {
      await captureOnFlow(page, route, width, height);
      console.log(`ON ${route.slug} ${width}`);
    }
    for (const city of OFF_CITIES) {
      await captureOff(page, city, width, height);
    }
  } finally {
    await browser.close();
  }
}

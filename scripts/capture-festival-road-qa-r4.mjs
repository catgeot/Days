/**
 * WebKit QA r4 — road ON/OFF with map tile idle, origin-stop expand, nearby place sheet.
 */
import { mkdirSync, readFileSync, statSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/festival-road-qa-r4');
const artifactDir = process.env.CAPTURE_ARTIFACT_DIR || '/opt/cursor/artifacts/festival-road-qa-r4';
const onBase = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5196';
const offBase = process.env.CAPTURE_OFF_URL || 'https://127.0.0.1:5197';
const maxKb = Number(process.env.CAPTURE_MAX_KB || 300);
const widths = (process.env.CAPTURE_WIDTHS || '390,1280')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter((v) => v > 0);

mkdirSync(outDir, { recursive: true });
mkdirSync(artifactDir, { recursive: true });

const ROUTES_ON = [
  { slug: 'east-coast', city: '강릉', belt: '동해안', originStop: 'gangneung', originIndex: 4 },
  { slug: 'chuncheon', city: '춘천', belt: '북부 내륙', periods: ['autumn'], originStop: null },
  { slug: 'wonju', city: '원주', belt: '중부', originStop: 'wonju', originIndex: 1 },
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
  const useJpeg = width >= 1000;
  const file = join(outDir, useJpeg ? name.replace(/\.png$/i, '.jpg') : name);
  const clip = { x: 0, y: 0, width, height };
  if (useJpeg) {
    await page.screenshot({
      path: file,
      clip,
      animations: 'disabled',
      type: 'jpeg',
      quality: 68,
    });
  } else {
    await page.screenshot({ path: file, clip, animations: 'disabled' });
    if (pngWidth(file) !== width) throw new Error(`${name} width mismatch`);
  }
  const kb = statSync(file).size / 1024;
  if (kb > maxKb) throw new Error(`${file} ${kb.toFixed(0)}KB > ${maxKb}KB cap`);
  cpSync(file, join(artifactDir, useJpeg ? name.replace(/\.png$/i, '.jpg') : name));
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
  const page = dialog.page();
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const reserve = await dialog.locator('[data-festival-summary-reserve]').count();
    const dateRow = await dialog.locator('[data-festival-summary-date]').count();
    if (reserve === 0 && dateRow > 0) break;
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(400);
}

async function waitMapIdle(dialog) {
  await dialog.locator('[data-festival-road-map-ready="1"]').waitFor({ timeout: 45000 });
  await dialog.locator('[data-festival-road-map-tiles-idle="1"]').waitFor({ timeout: 60000 });
  await dialog.page().evaluate(() => {
    const canvas = document.querySelector('[data-festival-road-map] canvas');
    if (!canvas) return;
    const map = canvas.__mapboxMap || canvas._mapboxMap;
    if (map && typeof map.triggerRepaint === 'function') map.triggerRepaint();
  }).catch(() => {});
  await dialog.page().waitForTimeout(1200);
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
  await alignInDialog(page, '[data-festival-road-map]', viewportWidth > 900 ? 100 : 180);
}

async function openDetailOnly(page, city, periods) {
  await selectGangwonCity(page, city, periods);
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await waitDetailLoaded(dialog);
  await alignInDialog(page, '[data-festival-detail-summary]', 10);
}

async function captureOnRoute(page, route, width, height) {
  const dialog = page.locator('[role="dialog"]');
  await gotoHome(page, onBase);
  await openRoad(page, route.city, route.belt, route.periods || [], width);
  await shot(page, `on-${route.slug}-open-${width}.png`, width, height);

  await dialog.locator('[data-week-shortcut="1"]').click();
  await waitMapIdle(dialog);
  await shot(page, `on-${route.slug}-week-next-${width}.png`, width, height);

  if (route.originStop) {
    const stop = dialog.locator(`[data-festival-road-stop="${route.originStop}"]`);
    await stop.locator('button').first().click();
    await dialog.locator('[data-festival-road-fill]').waitFor({ timeout: 15000 }).catch(() => {});
    const accessInFill = await dialog.locator('[data-festival-road-fill] [data-festival-access-status]').count();
    if (accessInFill > 0) {
      throw new Error(`${route.slug}: 가는 법 duplicated in road fill (${accessInFill})`);
    }
    await shot(page, `on-${route.slug}-origin-stop-${width}.png`, width, height);
  }

  const gray = dialog.locator('[data-festival-road-empty="1"]').first();
  if (await gray.count()) {
    await gray.locator('button').first().click();
    await dialog.locator('[data-festival-road-fill]').waitFor({ timeout: 15000 }).catch(() => {});
    await shot(page, `on-${route.slug}-stop-gray-${width}.png`, width, height);
    const nearby = dialog.locator('[data-festival-road-nearby-target]').first();
    if (await nearby.count()) {
      await nearby.click();
      await page.waitForTimeout(800);
      const placeDialog = page.locator('[role="dialog"]').last();
      await placeDialog.waitFor({ state: 'visible', timeout: 20000 });
      await shot(page, `on-${route.slug}-place-sheet-${width}.png`, width, height);
    }
  }
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
      await captureOnRoute(page, route, width, height);
      console.log('ON', route.slug, width);
    }
    for (const city of OFF_CITIES) {
      await gotoHome(page, offBase);
      await openDetailOnly(page, city.city, city.periods);
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.locator('[data-festival-road-entry]').count()) {
        throw new Error(`OFF road entry ${city.city}`);
      }
      await shot(page, `off-${city.slug}-${width}.png`, width, height);
      console.log('OFF', city.slug, width);
    }
  } finally {
    await browser.close();
  }
}

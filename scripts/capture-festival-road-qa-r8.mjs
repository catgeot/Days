/**
 * WebKit QA r8 — line/pin sync, projected offsets, Safari clip, load gates.
 */
import { mkdirSync, readFileSync, statSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/festival-road-qa-r8');
const artifactDir = process.env.CAPTURE_ARTIFACT_DIR || '/opt/cursor/artifacts/festival-road-qa-r8';
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
  { slug: 'east-coast', city: '강릉', belt: '동해안', originStop: 'gangneung', originBeforeWeekNext: true },
  { slug: 'chuncheon', city: '춘천', belt: '북부 내륙', periods: ['autumn'], originStop: null },
  { slug: 'wonju', city: '원주', belt: '중부', originStop: 'wonju', originBeforeWeekNext: false },
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
    await page.screenshot({ path: file, clip, animations: 'disabled', type: 'jpeg', quality: 68 });
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

async function waitFestivalDetailLoaded(dialog) {
  await dialog.locator('[data-festival-detail-summary]').waitFor({ timeout: 30000 });
  const page = dialog.page();
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const skeleton = await dialog.locator('[data-festival-detail-skeleton]').count();
    const reserve = await dialog.locator('[data-festival-summary-reserve]').count();
    const loading = await dialog.getByText('불러오는 중').count();
    const dateRow = await dialog.locator('[data-festival-summary-date]').count();
    if (skeleton === 0 && reserve === 0 && loading === 0 && dateRow > 0) break;
    await page.waitForTimeout(500);
  }
  if (await dialog.locator('[data-festival-detail-skeleton]').count()) {
    throw new Error('festival detail skeleton still visible');
  }
  if (await dialog.getByText('불러오는 중').count()) {
    throw new Error('festival detail still loading');
  }
  await page.waitForTimeout(500);
}

async function waitMapIdle(dialog, page, width) {
  await alignInDialog(page, '[data-festival-road-map]', width > 900 ? 100 : 180);
  await dialog.locator('[data-festival-road-map-ready="1"]').waitFor({ timeout: 60000 });
  await dialog.locator('[data-festival-road-map-tiles-idle="1"]').waitFor({ state: 'attached', timeout: 90000 });
  await page.waitForFunction(
    () => {
      const slot = document.querySelector('[data-festival-road-map]');
      const canvas = slot?.querySelector('canvas');
      if (!canvas) return false;
      const rect = canvas.getBoundingClientRect();
      return rect.width >= 80 && rect.height >= 80 && canvas.width > 0 && canvas.height > 0;
    },
    { timeout: 90000 },
  );
  await page.waitForTimeout(width > 900 ? 1400 : 1100);
}

async function waitPlaceSheetReady(page, width) {
  const title = page.locator('#korea-theme-spot-modal-title').last();
  await title.waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForFunction(
    () => {
      const heading = document.getElementById('korea-theme-spot-modal-title');
      if (!heading || !String(heading.textContent || '').trim()) return false;
      const dialog = heading.closest('[role="dialog"]');
      if (!dialog) return false;
      const text = dialog.innerText || '';
      if (/불러오는 중|상세를 불러오는|상세 불러오는|Loading details/i.test(text)) {
        return false;
      }
      const loadingLine = dialog.querySelector('p.text-xs.text-stone-500');
      if (loadingLine && /불러오는|Loading/i.test(loadingLine.textContent || '')) {
        return false;
      }
      const hero = dialog.querySelector('img[class*="aspect-"]');
      const heroReady = !hero || hero.naturalWidth > 0;
      const hasBody = dialog.querySelector('dl, [data-theme-spot-official-home], p.text-sm.font-semibold');
      return heroReady && Boolean(hasBody || heading.textContent.trim().length > 1);
    },
    { timeout: 120000 },
  );
  await page.waitForTimeout(width >= 1000 ? 1800 : 1000);
}

async function shotMapZoom(page, name) {
  const clipEl = page.locator('[data-festival-road-map-clip]').first();
  await clipEl.waitFor({ state: 'visible', timeout: 30000 });
  const box = await clipEl.boundingBox();
  if (!box || box.width < 40) throw new Error('map zoom box missing');
  const clip = {
    x: box.x + box.width * 0.1,
    y: box.y + box.height * 0.06,
    width: box.width * 0.8,
    height: box.height * 0.88,
  };
  const file = join(outDir, name);
  await page.screenshot({ path: file, clip, animations: 'disabled' });
  const kb = statSync(file).size / 1024;
  if (kb > maxKb) throw new Error(`${file} ${kb.toFixed(0)}KB > ${maxKb}KB cap`);
  cpSync(file, join(artifactDir, name));
}

async function shotMapClip(page, name, width) {
  const clipEl = page.locator('[data-festival-road-map-clip]').first();
  await clipEl.waitFor({ state: 'visible', timeout: 30000 });
  const box = await clipEl.boundingBox();
  if (!box || box.width < 40) throw new Error('map clip bounding box missing');
  const file = join(outDir, name);
  await page.screenshot({ path: file, clip: box, animations: 'disabled' });
  if (pngWidth(file) !== Math.round(box.width)) {
    throw new Error(`${name} clip width mismatch`);
  }
  const kb = statSync(file).size / 1024;
  if (kb > maxKb) throw new Error(`${file} ${kb.toFixed(0)}KB > ${maxKb}KB cap`);
  cpSync(file, join(artifactDir, name));
}

async function openRoad(page, city, belt, periods, width) {
  await selectGangwonCity(page, city, periods);
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await waitFestivalDetailLoaded(dialog);
  await dialog.locator('[data-festival-road-entry]').click();
  await dialog.locator('[data-festival-road]').waitFor({ state: 'visible' });
  const title = await dialog.locator('[data-festival-road] p').first().innerText();
  if (!title.includes(belt)) throw new Error(`belt mismatch ${title}`);
  await waitMapIdle(dialog, page, width);
}

async function expandOriginStop(dialog, route) {
  if (!route.originStop) return;
  const stop = dialog.locator(`[data-festival-road-stop="${route.originStop}"]`);
  await stop.locator('button').first().click();
  await dialog.locator('[data-festival-road-fill]').waitFor({ timeout: 15000 }).catch(() => {});
  const accessInFill = await dialog.locator('[data-festival-road-fill] [data-festival-access-status]').count();
  if (accessInFill > 0) {
    throw new Error(`${route.slug}: 가는 법 duplicated in road fill (${accessInFill})`);
  }
}

async function openDetailOnly(page, city, periods) {
  await selectGangwonCity(page, city, periods);
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await waitFestivalDetailLoaded(dialog);
  await alignInDialog(page, '[data-festival-detail-summary]', 10);
}

async function captureOnRoute(page, route, width, height) {
  const dialog = page.locator('[role="dialog"]');
  await gotoHome(page, onBase);
  await openRoad(page, route.city, route.belt, route.periods || [], width);
  await waitMapIdle(dialog, page, width);
  await shot(page, `on-${route.slug}-open-${width}.png`, width, height);
  if (route.slug === 'east-coast' && width === 390) {
    await shotMapClip(page, 'on-east-coast-map-corners-390.png', width);
  }
  if (route.slug === 'east-coast' || route.slug === 'chuncheon') {
    await shotMapZoom(page, `on-${route.slug}-map-zoom-${width}.png`);
  }

  if (route.originStop && route.originBeforeWeekNext) {
    await expandOriginStop(dialog, route);
    await waitMapIdle(dialog, page, width);
    await shot(page, `on-${route.slug}-origin-stop-${width}.png`, width, height);
  }

  await dialog.locator('[data-week-shortcut="1"]').click();
  await waitMapIdle(dialog, page, width);
  await shot(page, `on-${route.slug}-week-next-${width}.png`, width, height);

  if (route.originStop && !route.originBeforeWeekNext) {
    await expandOriginStop(dialog, route);
    await waitMapIdle(dialog, page, width);
    await shot(page, `on-${route.slug}-origin-stop-${width}.png`, width, height);
  }

  const gray = dialog.locator('[data-festival-road-empty="1"]').first();
  if (await gray.count()) {
    await gray.locator('button').first().click();
    await dialog.locator('[data-festival-road-fill]').waitFor({ timeout: 15000 }).catch(() => {});
    await waitMapIdle(dialog, page, width);
    await shot(page, `on-${route.slug}-stop-gray-${width}.png`, width, height);
    const nearby = dialog.locator('[data-festival-road-nearby-target]').first();
    if (await nearby.count()) {
      await nearby.click();
      await waitPlaceSheetReady(page, width);
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
      await waitFestivalDetailLoaded(dialog);
      await shot(page, `off-${city.slug}-${width}.png`, width, height);
      console.log('OFF', city.slug, width);
    }
  } finally {
    await browser.close();
  }
}

/**
 * WebKit 390px — festival road draft with VITE_GATEO_FESTIVAL_ROAD=1.
 * CAPTURE_BASE_URL default http://127.0.0.1:5196
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/festival-road-pr-a');
const base = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5196';

mkdirSync(outDir, { recursive: true });

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

async function alignInDialog(page, selector, offset = 12) {
  await page.locator(selector).evaluate((el, topOffset) => {
    const sheet = el.closest('[role="dialog"]');
    if (!sheet) return;
    const top = el.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop;
    sheet.scrollTop = Math.max(0, top - topOffset);
  }, offset);
}

async function dialogScrollTop(page) {
  return page.locator('[role="dialog"]').evaluate((el) => el.scrollTop);
}

const browser = await webkit.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
});

try {
  await page.goto(`${base}/qa/festival-road`, { waitUntil: 'domcontentloaded' });
  const entry = page.locator('[data-festival-road-entry]');
  await entry.waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('[data-festival-summary-place]').waitFor({ state: 'visible', timeout: 20000 });
  await alignInDialog(page, '[data-festival-road-entry]', 80);
  await shot(page, '01-button.png');

  await entry.click();
  await page.locator('[data-festival-road-stops]').waitFor({ state: 'visible' });
  await alignInDialog(page, '[data-festival-road]', 8);
  const stopText = await page.locator('[data-festival-road-stops]').innerText();
  if (!/1[\s\S]*고성[\s\S]*2[\s\S]*양양[\s\S]*3[\s\S]*속초/.test(stopText)) {
    throw new Error(`numbered order missing:\n${stopText}`);
  }
  const mapBox = await page.locator('[data-festival-road-map]').boundingBox();
  if (!mapBox || Math.round(mapBox.height) !== 160) {
    throw new Error(`map slot height ${mapBox?.height}`);
  }
  await shot(page, '02-numbered-order.png');

  const beforeNearby = await dialogScrollTop(page);
  await page.locator('[data-festival-road-stop="goseong"] button').click();
  await page.locator('[data-festival-road-nearby]').waitFor({ state: 'visible' });
  const nearbyText = await page.locator('[data-festival-road-nearby]').innerText();
  if (!nearbyText.includes('주변 볼거리') || !nearbyText.includes('건봉사')) {
    throw new Error(`nearby fill missing:\n${nearbyText}`);
  }
  const grayCopy = await page.locator('[data-festival-road-stop="goseong"]').innerText();
  if (!grayCopy.includes('이 기간엔 축제가 없어요')) {
    throw new Error(`gray copy missing:\n${grayCopy}`);
  }
  if ((await dialogScrollTop(page)) !== beforeNearby) {
    throw new Error('selecting a stop moved the sheet');
  }
  await shot(page, '03-gray-nearby.png');

  const beforeWeek = await dialogScrollTop(page);
  await page.locator('[data-festival-road] [data-week-shortcut="1"]').click();
  await page.locator('[data-festival-road-all-empty]').waitFor({ state: 'visible' });
  const banner = await page.locator('[data-festival-road-all-empty]').innerText();
  if (banner !== '고른 기간에 축제가 없어요. 날짜를 바꿔 보세요') {
    throw new Error(`banner ${banner}`);
  }
  const sokchoDot = await page.locator('[data-festival-road-stop="sokcho"]').getAttribute('data-festival-road-empty');
  if (sokchoDot !== '1') throw new Error(`sokcho should be gray on next week, got ${sokchoDot}`);
  if ((await dialogScrollTop(page)) !== beforeWeek) {
    throw new Error('date chip moved the sheet');
  }
  await shot(page, '04-all-gray.png');
  console.log('festival-road 390 shots ok');
} finally {
  await browser.close();
}

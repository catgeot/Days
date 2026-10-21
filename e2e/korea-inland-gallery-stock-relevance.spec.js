// Inland Korea place photo grids — stock relevance (TourAPI-first, no Busan drift).
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const PHASE = process.env.GALLERY_STOCK_PHASE || 'after';
const OUT_DIR = join(
  '/opt/cursor/artifacts',
  `korea-inland-gallery-${PHASE}`,
);

const PLACES = [
  { query: '양구', cardName: '양구', filePrefix: 'yanggu' },
  { query: '곡성', cardName: '곡성', filePrefix: 'gokseong' },
  { query: '남한산성', cardName: '남한산성', filePrefix: 'namhansanseong' },
  { query: '청주', cardName: '청주', filePrefix: 'cheongju' },
  { query: '카이로', cardName: '카이로', filePrefix: 'cairo-control' },
];

const DRIFT_RE = /busan|hamdeok|seoul-cityscape|sanya|hainan/i;
const TOUR_RE = /visitkorea|tong\.visitkorea|api\.visitkorea/i;

async function openHomeSearch(page) {
  const search = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations|Search on 3D globe/i })
    .first();
  await page.goto('/', { waitUntil: 'commit', timeout: 30_000 });
  await expect(search).toBeVisible({ timeout: 25_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

async function openPlaceFromSearch(page, { query, cardName }) {
  const input = await openHomeSearch(page);
  await input.fill('');
  await input.type(query, { delay: 25 });
  const row = page
    .locator('button')
    .filter({ has: page.getByText(cardName, { exact: false }) })
    .filter({ hasNotText: 'MOONi' })
    .first();
  await expect(row).toBeVisible({ timeout: 40_000 });
  await row.click();
  await expect(page).not.toHaveURL(/\/explore/, { timeout: 45_000 });
  const more = page.getByRole('button', { name: /^더보기$/ }).first();
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForURL(/\/place\//, { timeout: 30_000 });
  }
}

async function readGallerySrcs(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('img[alt^="place-img"], .columns-2 img[src]')].map(
      (img) => img.currentSrc || img.src || '',
    ),
  );
}

async function shotGallery(page, path) {
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: page.viewportSize().width, height: page.viewportSize().height },
  });
}

test.describe(`korea inland gallery stock relevance (${PHASE})`, () => {
  test.beforeAll(async () => {
    await mkdir(OUT_DIR, { recursive: true });
  });

  for (const place of PLACES) {
    test(`${place.filePrefix} gallery webkit`, async ({ browser }, testInfo) => {
      const wide = testInfo.project.name.includes('1280');
      const viewport = wide
        ? { label: '1280', width: 1280, height: 900 }
        : { label: '390', width: 390, height: 844 };
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
      });
      const page = await context.newPage();
        await openPlaceFromSearch(page, place);
        await expect
          .poll(async () => (await readGallerySrcs(page)).length, { timeout: 45_000 })
          .toBeGreaterThan(0);
        const srcs = await readGallerySrcs(page);
        const file = `${place.filePrefix}-${viewport.label}-${PHASE}.png`;
        await shotGallery(page, join(OUT_DIR, file));
        await appendFile(
          join(OUT_DIR, 'audit.txt'),
          `${place.filePrefix}\t${viewport.label}\t${PHASE}\t${srcs.length}\t${page.url()}\n`,
        );
        if (PHASE === 'after' && place.filePrefix !== 'cairo-control') {
          const drift = srcs.filter((src) => DRIFT_RE.test(src));
          expect(drift, `Busan/Seoul drift tiles: ${drift.join(', ')}`).toEqual([]);
          const tourish = srcs.filter((src) => TOUR_RE.test(src));
          expect(tourish.length, 'expect at least one TourAPI/visitkorea image').toBeGreaterThan(0);
        }
        await context.close();
    });
  }
});

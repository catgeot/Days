import { mkdir, writeFile, appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
const OUT_DIR = '/opt/cursor/artifacts/korea-gallery-r3';
const NOTES_PATH = join(OUT_DIR, 'NOTES.md');
const VARIANT = process.env.GALLERY_CAPTURE_VARIANT || 'r2';

const PLACES = [
  { query: '한반도섬', cardName: '한반도섬', key: 'hanbando' },
  { query: '양구', cardName: '양구', key: 'yanggu' },
  { query: '청주', cardName: '청주', key: 'cheongju' },
  { query: '두타연', cardName: '두타연', key: 'dutayeon' },
  { query: '카이로', cardName: '카이로', key: 'cairo' },
];

async function openHomeSearch(page) {
  const search = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations|Search on 3D globe/i })
    .first();
  await page.goto('/', { waitUntil: 'commit', timeout: 30_000 });
  await expect(search).toBeVisible({ timeout: 25_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  return page.locator('input[placeholder]:visible').first();
}

async function ensureGalleryTab(page) {
  const galleryBack = page.getByRole('button', { name: /^사진 보기$/ }).first();
  if (await galleryBack.isVisible().catch(() => false)) {
    await galleryBack.click();
  }
  const url = page.url();
  if (!/\/gallery\/?$/.test(url) && /\/place\//.test(url)) {
    const galleryPath = url.replace(/\/place\/([^/?#]+).*/, '/place/$1/gallery');
    await page.goto(galleryPath, { waitUntil: 'commit', timeout: 30_000 });
  }
  await expect(page.locator('.columns-2').first()).toBeAttached({ timeout: 45_000 });
}

async function openPlaceGallery(page, { query, cardName }) {
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
  await ensureGalleryTab(page);
}

function attachStockCounters(page, bag) {
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('api.unsplash.com/search/photos')) bag.unsplash += 1;
    if (url.includes('api.pexels.com/v1/search') || url.includes('pexels-proxy')) bag.pexels += 1;
  });
}

async function waitTilesPaintBudget(page, budgetMs = 10_000) {
  try {
    await expect
      .poll(
        async () => {
          const stats = await auditGrid(page);
          if (!stats.rows.length) return false;
          return stats.rows.every((r) => r.painted || r.broken);
        },
        { timeout: budgetMs, intervals: [200, 400, 600, 800, 1000] },
      )
      .toBe(true);
  } catch {
    /* budget exhausted — audit records partial paint */
  }
}

async function auditGrid(page) {
  return page.evaluate(() => {
    const column = document.querySelector('.columns-2');
    if (!column) return { painted: 0, broken: 0, empty: 0, rows: [] };
    const scroller = document.querySelector('.custom-scrollbar-blue');
    const scrollerRect = scroller?.getBoundingClientRect();
    const viewTop = scrollerRect?.top ?? 0;
    const viewBottom = scrollerRect?.bottom ?? window.innerHeight;
    const tiles = [...column.children].filter((n) => n instanceof HTMLElement);
    const rows = tiles
      .map((tile) => {
        const rect = tile.getBoundingClientRect();
        const visible =
          rect.width > 4 &&
          rect.height > 4 &&
          rect.bottom > viewTop + 2 &&
          rect.top < viewBottom - 2;
        if (!visible) return null;
        const img = tile.querySelector('img[alt^="place-img"]');
        const hasPulse = Boolean(tile.querySelector('.animate-pulse'));
        const nw = img?.naturalWidth ?? 0;
        const src = (img?.currentSrc || img?.src || '').trim();
        const style = img ? getComputedStyle(img) : null;
        const opacity = style ? Number(style.opacity) : 0;
        const painted = nw > 0 && opacity > 0.05 && !hasPulse;
        const imgHidden = img ? style.display === 'none' : false;
        const broken = Boolean(
          imgHidden || (img && img.complete && nw === 0 && src.length > 0),
        );
        const empty = Boolean(
          !painted &&
            !broken &&
            (hasPulse || !img || nw === 0 || opacity <= 0.05),
        );
        return { painted, broken, empty, src };
      })
      .filter(Boolean);
    return {
      painted: rows.filter((r) => r.painted).length,
      broken: rows.filter((r) => r.broken).length,
      empty: rows.filter((r) => r.empty).length,
      rows,
    };
  });
}

async function shotClip(page, file, width) {
  await page.screenshot({
    path: join(OUT_DIR, file),
    clip: { x: 0, y: 0, width, height: page.viewportSize().height },
  });
}

async function appendNoteRow(row) {
  await appendFile(NOTES_PATH, `${row}\n`);
}

test.describe(`korea gallery r3 capture (${VARIANT})`, () => {
  test.beforeAll(async () => {
    await mkdir(OUT_DIR, { recursive: true });
    try {
      await readFile(NOTES_PATH);
    } catch {
      await writeFile(
        NOTES_PATH,
        `# Korea gallery R3 — ${new Date().toISOString()}\n\n| place | viewport | variant | phase | painted | broken | empty | pexels_reentry |\n| --- | --- | --- | --- | ---: | ---: | ---: | ---: |\n`,
      );
    }
  });

  for (const viewport of [
    { label: '390', width: 390, height: 844 },
    { label: '1280', width: 1280, height: 900 },
  ]) {
    for (const place of PLACES) {
      test(`${place.key} @${viewport.label} ${VARIANT}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          locale: 'ko-KR',
        });
        const page = await context.newPage();
        const stockBag = { unsplash: 0, pexels: 0 };
        attachStockCounters(page, stockBag);

        await openPlaceGallery(page, place);
        await waitTilesPaintBudget(page, 10_000);
        let audit = await auditGrid(page);
        await shotClip(page, `${VARIANT}-${place.key}-${viewport.label}-initial.png`, viewport.width);
        await appendNoteRow(
          `| ${place.key} | ${viewport.label} | ${VARIANT} | initial | ${audit.painted} | ${audit.broken} | ${audit.empty} | — |`,
        );

        const refresh = page.getByRole('button', { name: /더 많은 사진|추가 사진/ }).first();
        if (await refresh.isVisible().catch(() => false)) {
          await refresh.click();
          await waitTilesPaintBudget(page, 10_000);
          audit = await auditGrid(page);
          await shotClip(page, `${VARIANT}-${place.key}-${viewport.label}-after-more.png`, viewport.width);
          await appendNoteRow(
            `| ${place.key} | ${viewport.label} | ${VARIANT} | after-more | ${audit.painted} | ${audit.broken} | ${audit.empty} | — |`,
          );
        }

        const reentryBag = { unsplash: 0, pexels: 0 };
        const page2 = await context.newPage();
        attachStockCounters(page2, reentryBag);
        await openPlaceGallery(page2, place);
        await waitTilesPaintBudget(page2, 10_000);
        await appendFile(
          NOTES_PATH,
          `| ${place.key} | ${viewport.label} | ${VARIANT} | reentry_pexels | — | — | — | ${reentryBag.pexels} |\n`,
        );

        await context.close();
      });
    }
  }
});

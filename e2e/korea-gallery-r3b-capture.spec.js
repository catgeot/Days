import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = '/opt/cursor/artifacts/korea-gallery-r3b';
const NOTES_PATH = join(OUT_DIR, 'NOTES.md');

const RUNS = [
  { query: '양구', cardName: '양구', key: 'yanggu', viewport: { label: '1280', width: 1280, height: 900 } },
  { query: '청주', cardName: '청주', key: 'cheongju', viewport: { label: '390', width: 390, height: 844 } },
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
    await page.goto(url.replace(/\/place\/([^/?#]+).*/, '/place/$1/gallery'), {
      waitUntil: 'commit',
      timeout: 30_000,
    });
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

/** Every visible `.columns-2` direct child is one grid cell. */
export async function auditGalleryGridCells(page) {
  return page.evaluate(() => {
    const column = document.querySelector('.columns-2');
    if (!column) {
      return { cells: 0, painted: 0, broken: 0, empty: 0, rows: [] };
    }
    const scroller = document.querySelector('.custom-scrollbar-blue');
    const scrollerRect = scroller?.getBoundingClientRect();
    const viewTop = scrollerRect?.top ?? 0;
    const viewBottom = scrollerRect?.bottom ?? window.innerHeight;
    const tiles = [...column.children].filter((node) => node instanceof HTMLElement);
    const columnRect = column.getBoundingClientRect();
    const midX = columnRect.left + columnRect.width / 2;
    const rows = tiles.map((tile, index) => {
      const rect = tile.getBoundingClientRect();
      const visible =
        rect.width > 4 &&
        rect.height > 4 &&
        rect.bottom > viewTop + 2 &&
        rect.top < viewBottom - 2;
      const side = rect.left + rect.width / 2 < midX ? 'L' : 'R';
      const img = tile.querySelector('img[alt^="place-img"]');
      const nw = img?.naturalWidth ?? 0;
      const src = (img?.currentSrc || img?.src || '').trim();
      const hasPulse = Boolean(tile.querySelector('.animate-pulse'));
      const style = img ? getComputedStyle(img) : null;
      const opacity = style ? Number(style.opacity) : 0;
      const painted = nw > 0 && opacity > 0.05 && !hasPulse;
      const imgHidden = img ? style.display === 'none' : false;
      const broken = Boolean(
        imgHidden || (img && img.complete && nw === 0 && src.length > 0),
      );
      const empty = Boolean(
        visible && !painted && !broken && (hasPulse || !img || nw === 0 || opacity <= 0.05),
      );
      return {
        index,
        side,
        top: Math.round(rect.top),
        visible,
        hasImg: Boolean(img),
        complete: img?.complete ?? false,
        nw,
        painted,
        broken,
        empty,
        hasPulse,
        src: src.slice(0, 72),
      };
    });
    const vis = rows.filter((r) => r.visible);
    const topL = vis.filter((r) => r.side === 'L').sort((a, b) => a.top - b.top)[0];
    const topR = vis.filter((r) => r.side === 'R').sort((a, b) => a.top - b.top)[0];
    return {
      cells: vis.length,
      painted: vis.filter((r) => r.painted).length,
      broken: vis.filter((r) => r.broken).length,
      empty: vis.filter((r) => r.empty).length,
      topRowL: topL ? (topL.painted ? 'P' : topL.broken ? 'B' : 'E') : '-',
      topRowR: topR ? (topR.painted ? 'P' : topR.broken ? 'B' : 'E') : '-',
      rows: vis,
    };
  });
}

async function waitGalleryReady(page) {
  await page.locator('.columns-2').first().scrollIntoViewIfNeeded();
  const loadingLine = page.getByText('사진을 불러오는 중', { exact: false });
  await expect
    .poll(async () => ((await loadingLine.isVisible().catch(() => false)) ? 1 : 0), {
      timeout: 45_000,
    })
    .toBe(0);
  await expect
    .poll(async () => documentColumnCount(page), { timeout: 45_000 })
    .toBeGreaterThan(1);
  await expect
    .poll(
      async () =>
        page.locator('[aria-busy="true"]').filter({ hasText: /사진/ }).count(),
      { timeout: 45_000 },
    )
    .toBe(0);
}

async function documentColumnCount(page) {
  return page.evaluate(
    () => document.querySelectorAll('.columns-2 > div').length,
  );
}

async function waitPaintBudget(page, budgetMs = 10_000) {
  await waitGalleryReady(page);
  const end = Date.now() + budgetMs;
  let last = null;
  while (Date.now() < end) {
    const stats = await auditGalleryGridCells(page);
    last = stats;
    const topRowOk = stats.topRowL === 'P' && (stats.topRowR === 'P' || stats.topRowR === 'B');
    if (
      stats.cells >= 2 &&
      stats.empty === 0 &&
      topRowOk &&
      stats.rows.every((r) => r.painted || r.broken)
    ) {
      return stats;
    }
    await page.waitForTimeout(400);
  }
  return last ?? auditGalleryGridCells(page);
}

async function scrollGalleryEnd(page) {
  const scroller = page.locator('.custom-scrollbar-blue').first();
  if (!(await scroller.count())) return;
  await scroller.evaluate((el) => {
    for (let i = 0; i < 32; i += 1) {
      el.scrollTop = el.scrollHeight;
    }
  });
}

function formatPerCell(rows) {
  return rows
    .map(
      (r) =>
        `#${r.index}${r.side}:${r.painted ? 'P' : r.broken ? 'B' : 'E'}(nw=${r.nw},y=${r.top},pulse=${r.hasPulse ? 1 : 0})`,
    )
    .join(' ');
}

test.describe('korea gallery r3b — yanggu/cheongju audit', () => {
  test.beforeAll(async () => {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      NOTES_PATH,
      `# Korea gallery R3b — ${new Date().toISOString()}\n\nPath: home search → place → \`/gallery\` (사진). WebKit, 10s paint budget.\n\n`,
    );
  });

  for (const run of RUNS) {
    test(`${run.key} @${run.viewport.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: run.viewport.width, height: run.viewport.height },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
      });
      const page = await context.newPage();
      await openPlaceGallery(page, run);
      let audit = await waitPaintBudget(page, 10_000);
      await page.waitForTimeout(300);
      audit = await auditGalleryGridCells(page);
      await page.screenshot({
        path: join(OUT_DIR, `r2-${run.key}-${run.viewport.label}-initial.png`),
        clip: { x: 0, y: 0, width: run.viewport.width, height: run.viewport.height },
      });
      await appendFile(
        NOTES_PATH,
        `## ${run.key} @${run.viewport.label} — initial\n\n` +
          `- cells: ${audit.cells} · painted: ${audit.painted} · broken: ${audit.broken} · empty: ${audit.empty} · top L/R: ${audit.topRowL}/${audit.topRowR}\n` +
          `- per-cell: ${formatPerCell(audit.rows)}\n\n`,
      );

      const refresh = page.getByRole('button', { name: /더 많은 사진|추가 사진/ }).first();
      if (run.key === 'yanggu' && (await refresh.isVisible().catch(() => false))) {
        await refresh.click();
        await page.waitForTimeout(500);
        audit = await waitPaintBudget(page, 10_000);
        await scrollGalleryEnd(page);
        await page.waitForTimeout(300);
        audit = await auditGalleryGridCells(page);
        await page.screenshot({
          path: join(OUT_DIR, `r2-${run.key}-${run.viewport.label}-after-more.png`),
          clip: { x: 0, y: 0, width: run.viewport.width, height: run.viewport.height },
        });
        await appendFile(
          NOTES_PATH,
          `## ${run.key} @${run.viewport.label} — after-more\n\n` +
            `- cells: ${audit.cells} · painted: ${audit.painted} · broken: ${audit.broken} · empty: ${audit.empty} · top L/R: ${audit.topRowL}/${audit.topRowR}\n` +
            `- per-cell: ${formatPerCell(audit.rows)}\n\n`,
        );
      }

      await context.close();
    });
  }
});

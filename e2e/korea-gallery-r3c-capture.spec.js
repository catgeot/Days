import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { runGalleryGridAudit } from './gallery-grid-audit.mjs';

const OUT_DIR = '/opt/cursor/artifacts/korea-gallery-r3c';
const NOTES_PATH = join(OUT_DIR, 'NOTES.md');
const VARIANT = process.env.GALLERY_CAPTURE_VARIANT || 'r2';
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173';
const IMAGE_DELAY_MS = Number(process.env.GALLERY_IMAGE_DELAY_MS || 1500);

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
  if (await galleryBack.isVisible().catch(() => false)) await galleryBack.click();
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

async function waitGalleryReady(page) {
  await page.locator('.columns-2').first().scrollIntoViewIfNeeded();
  const loadingLine = page.getByText('사진을 불러오는 중', { exact: false });
  await expect
    .poll(async () => ((await loadingLine.isVisible().catch(() => false)) ? 1 : 0), {
      timeout: 45_000,
    })
    .toBe(0);
  await expect
    .poll(
      async () => page.evaluate(() => document.querySelectorAll('.columns-2 > div').length),
      { timeout: 45_000 },
    )
    .toBeGreaterThan(1);
}

async function waitPaintBudget(page, budgetMs = 10_000) {
  await waitGalleryReady(page);
  const end = Date.now() + budgetMs;
  let last = null;
  while (Date.now() < end) {
    last = await runGalleryGridAudit(page);
    const topOk = last.topRowL === 'P' && (last.topRowR === 'P' || last.topRowR === 'B');
    if (last.cells >= 2 && last.empty === 0 && topOk && last.orphanPulse === 0) return last;
    await page.waitForTimeout(400);
  }
  return last ?? runGalleryGridAudit(page);
}

function formatPerCell(rows) {
  return rows
    .map(
      (r) =>
        `#${r.index}${r.side}:${r.painted ? 'P' : r.broken ? 'B' : 'E'}(${r.paintState},nw=${r.nw},y=${r.top},pulse=${r.hasPulse ? 1 : 0})`,
    )
    .join(' ');
}

/** Audit + overlay + screenshot — single synchronous browser turn for overlay, then immediate shot. */
async function captureAuditScreenshot(page, filePath, viewport) {
  const audit = await runGalleryGridAudit(page);
  await page.evaluate((summary) => {
    let el = document.getElementById('gallery-audit-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gallery-audit-overlay';
      el.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:99999;background:rgba(0,0,0,0.88);color:#6ee7b7;font:10px/1.35 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap;';
      document.body.appendChild(el);
    }
    el.textContent = summary;
  }, `audit@${audit.capturedAt?.toFixed?.(0) ?? '?'}\ncells=${audit.cells} P=${audit.painted} E=${audit.empty} B=${audit.broken}\ntop L/R=${audit.topRowL}/${audit.topRowR} orphanPulse=${audit.orphanPulse} dom=${audit.domTileCount}\nskelGrid=${audit.hasInitialSkeletonGrid ? 1 : 0}`);
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  await page.evaluate(() => document.getElementById('gallery-audit-overlay')?.remove());
  return audit;
}

async function attachImageThrottle(context) {
  await context.route('**/*', async (route) => {
    const req = route.request();
    const type = req.resourceType();
    const url = req.url();
    const isGalleryImage =
      type === 'image' &&
      (/visitkorea|unsplash|pexels|supabase/i.test(url) ||
        /\.(jpe?g|png|webp)(\?|$)/i.test(url));
    if (!isGalleryImage) return route.continue();
    await new Promise((r) => setTimeout(r, IMAGE_DELAY_MS + Math.floor(Math.random() * 500)));
    return route.continue();
  });
}

test.describe('korea gallery r3c', () => {
  test.beforeAll(async () => {
    await mkdir(OUT_DIR, { recursive: true });
  });

  test('cheongju @390 atomic audit screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    await openPlaceGallery(page, { query: '청주', cardName: '청주', key: 'cheongju' });
    await waitPaintBudget(page, 10_000);
    const audit = await captureAuditScreenshot(
      page,
      join(OUT_DIR, 'r2-cheongju-390-initial.png'),
      { width: 390, height: 844 },
    );
    await appendFile(
      NOTES_PATH,
      `## cheongju @390 initial (${VARIANT})\n\n` +
        `- cells: ${audit.cells} · painted: ${audit.painted} · broken: ${audit.broken} · empty: ${audit.empty}\n` +
        `- top L/R: ${audit.topRowL}/${audit.topRowR} · orphanPulse: ${audit.orphanPulse} · domTiles: ${audit.domTileCount}\n` +
        `- per-cell: ${formatPerCell(audit.rows)}\n\n`,
    );
    expect(audit.topRowR, 'top-right cell should be painted').toBe('P');
    expect(audit.empty, 'no empty viewport cells').toBe(0);
    await context.close();
  });

  for (const place of [
    { query: '청주', cardName: '청주', key: 'cheongju' },
    { query: '한반도섬', cardName: '한반도섬', key: 'hanbando' },
  ]) {
    test(`throttle ${place.key} @390 ${VARIANT}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
      });
      await attachImageThrottle(context);
      const page = await context.newPage();
      await openPlaceGallery(page, place);
      await waitGalleryReady(page);
      await page.waitForTimeout(18_000);
      const audit = await runGalleryGridAudit(page);
      const domCount = await page.evaluate(
        () => document.querySelectorAll('.columns-2 > div').length,
      );
      await appendFile(
        NOTES_PATH,
        `| ${place.key} | 390 | ${VARIANT} | delay ${IMAGE_DELAY_MS}ms | ${domCount} | ${audit.painted} | ${audit.empty} | ${audit.broken} | ${audit.topRowL}/${audit.topRowR} |\n`,
      );
      await context.close();
    });
  }
});

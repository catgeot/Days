/**
 * 390px WebKit screenshots: 주변 볼거리 더보기 append (before / after first tap).
 *
 *   npm run build && npx vite preview --host 127.0.0.1 --port 4173
 *   node scripts/capture-festival-nearby-append-390.mjs
 *
 * Env: CAPTURE_BASE_URL (default https://127.0.0.1:4173)
 *      FESTIVAL_IDS=comma-separated contentIds (optional; default discovers 양평 지평 + 2 fixtures)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { webkit, devices } from 'playwright';
import {
  ensureFestivalNearbyMoreButtonVisible,
  tapFestivalNearbyLoadMore,
  waitFestivalNearbyAttractionsReady,
  waitFestivalNearbyMoreButtonEnabled,
} from './lib/festival-nearby-load-more-qa.mjs';

const OUT_DIR = '/opt/cursor/artifacts/festival-nearby-append-390';
const BASE = (process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');
const DEFAULT_IDS = (process.env.FESTIVAL_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function discoverFestivalIds(page) {
  if (DEFAULT_IDS.length) return DEFAULT_IDS;
  const ids = new Set();
  await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const mobileSearch = page.locator('#korea-festival-search');
  if (!(await mobileSearch.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /검색/ }).first().click({ timeout: 15_000 }).catch(() => {});
  }
  const search = page.locator('#korea-festival-search').first();
  await search.waitFor({ state: 'visible', timeout: 30_000 });
  await search.fill('양평 지평');
  await page.waitForTimeout(800);
  const hrefs = await page.locator('a[href*="festival="]').evaluateAll((els) =>
    els.map((a) => {
      try {
        const u = new URL(a.href);
        return u.searchParams.get('festival') || '';
      } catch {
        return '';
      }
    }),
  );
  for (const id of hrefs) {
    if (id) ids.add(id);
  }
  for (const fallback of ['4133567', '2930716', '8099001']) {
    ids.add(fallback);
  }
  return [...ids].slice(0, 3);
}

async function rowNames(page) {
  return page.evaluate(() => {
    const list = document.querySelector('[data-nearby-list]');
    if (!list) return [];
    return [...list.querySelectorAll('[data-nearby-attraction-row]')].map(
      (el) => el.getAttribute('data-nearby-row-key') || el.textContent?.trim()?.slice(0, 40) || '',
    );
  });
}

async function clipShot(page, path) {
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  ...devices['iPhone 12'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
await mkdir(OUT_DIR, { recursive: true });

const festivalIds = await discoverFestivalIds(page);
const report = { baseUrl: BASE, festivals: [] };

for (const festivalId of festivalIds) {
  const slug = festivalId;
  const beforePath = `${OUT_DIR}/${slug}-before-more-390.png`;
  const afterPath = `${OUT_DIR}/${slug}-after-more-390.png`;
  try {
    await page.goto(`${BASE}/korea/?festival=${festivalId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyAttractionsReady(page);
    const more = page.locator('[data-festival-near-scenic-more]:not([disabled])').first();
    const hasMore = await more.count();
    if (!hasMore) {
      report.festivals.push({ festivalId, skipped: 'no 더보기' });
      continue;
    }
    await ensureFestivalNearbyMoreButtonVisible(page);
    const namesBefore = await rowNames(page);
    await clipShot(page, beforePath);
    await waitFestivalNearbyMoreButtonEnabled(page);
    await tapFestivalNearbyLoadMore(page);
    await page
      .waitForFunction(
        () => {
          const list = document.querySelector('[data-nearby-list]');
          return list && list.querySelectorAll('[data-nearby-attraction-row]').length > 0;
        },
        { timeout: 60_000 },
      )
      .catch(() => {});
    await page.waitForTimeout(400);
    const namesAfter = await rowNames(page);
    await clipShot(page, afterPath);
    const prefixOk =
      namesBefore.length > 0 &&
      namesAfter.length >= namesBefore.length &&
      namesBefore.every((key, i) => namesAfter[i] === key);
    report.festivals.push({
      festivalId,
      title: await page.locator('#korea-festival-sheet-title').innerText().catch(() => ''),
      beforePath,
      afterPath,
      namesBefore,
      namesAfter,
      appendPrefixOk: prefixOk,
    });
  } catch (err) {
    report.festivals.push({ festivalId, error: String(err?.message || err) });
  }
}

await writeFile(`${OUT_DIR}/capture-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();

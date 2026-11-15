/**
 * Review detail hero + hub cards — 390 & 1280 preview captures (fixture when Supabase unreachable).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/review-detail-photo';
const baseHost = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173';

const HUB_DOMESTIC =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=domestic';
const HWASEONG_REVIEW_ID = 'a9e7d546-7b70-47ce-bea1-362f36d12156';
const NO_PHOTO_ID = 'e2e-hwaseong-no-photo';

const REVIEW_ROWS = JSON.parse(
  readFileSync(join(root, 'e2e/fixtures/logbook-review-detail-photo-reviews.json'), 'utf8'),
);

mkdirSync(outDir, { recursive: true });

function fulfillPlaceReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = REVIEW_ROWS.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function clipShot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  return path;
}

async function openHub(page) {
  await page.goto(`${baseHost}${HUB_DOMESTIC}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 90_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 30_000 });
}

async function capture(width) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 900 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  await page.route('**/rest/v1/place_reviews**', fulfillPlaceReviews);

  const meta = { width, data: 'fixture + local place_reviews mock (E2E fixture)', captures: [] };

  try {
    await openHub(page);
    await page.getByTestId('logbook-review-filter-major-domestic').click();
    const cardPath = await clipShot(page, `blog-review-cards-${width}.png`, width);
    meta.captures.push(cardPath);

    const card = page.locator(
      `[data-testid="logbook-official-review-hub-item"][data-review-id="${HWASEONG_REVIEW_ID}"]`,
    );
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await page.waitForURL(/hwaseong-fortress\/reviews/, { timeout: 90_000 });
      await page.getByTestId('place-card-route-loading').waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});
      await page
        .locator(`[data-review-id="${HWASEONG_REVIEW_ID}"]`)
        .getByTestId('logbook-editorial-review-detail-hero')
        .waitFor({ timeout: 60_000 })
        .catch(() => {});
      const detailPath = await clipShot(page, `hwaseong-review-detail-top-${width}.png`, width);
      meta.captures.push(detailPath);
    }

    await page.goto(
      `${baseHost}/place/hwaseong-fortress/reviews?review=${NO_PHOTO_ID}&logbook_review_hub=1&logbook_filter=1`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.getByTestId('logbook-editorial-review-detail-hero-fallback').waitFor({ timeout: 60_000 }).catch(() => {});
    const fallbackPath = await clipShot(page, `review-detail-no-photo-fallback-${width}.png`, width);
    meta.captures.push(fallbackPath);
  } finally {
    writeFileSync(join(outDir, `manifest-${width}.json`), `${JSON.stringify(meta, null, 2)}\n`);
    await browser.close();
  }
}

for (const w of [390, 1280]) {
  await capture(w);
}

console.log(`Saved review-detail-photo captures under ${outDir}`);
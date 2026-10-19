/**
 * WebKit 390×844 — Logbook official review hub PR-1 captures.
 * CAPTURE_BASE_URL — dev/preview (default https://127.0.0.1:5195)
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-hub-pr1
 * CAPTURE_MODE — flag-on (default) | flag-off
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-hub-pr1';
const onUrl = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5195';
const mode = process.env.CAPTURE_MODE || 'flag-on';

const PLACE_CAPTURES = [
  { slug: 'kyoto', file: '04-place-reviews-kyoto-from-hub.png' },
  { slug: 'dubai', file: '05-place-reviews-dubai-from-hub.png' },
  { slug: 'venice', file: '06-place-reviews-venice-from-hub.png' },
];

mkdirSync(outDir, { recursive: true });

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log(`shot ${path}`);
}

async function waitForPlaceReviewsSurface(page, { reviewId, placeLabel } = {}) {
  await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 90_000 });
  await page.getByText('GATEO 리뷰어', { exact: false }).first().waitFor({
    state: 'visible',
    timeout: 120_000,
  });
  await page.getByRole('heading', { name: /장소 리뷰|리뷰/ }).first().waitFor({
    state: 'visible',
    timeout: 60_000,
  }).catch(() => {});
  if (placeLabel) {
    await page.getByText(placeLabel, { exact: false }).first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  }
  if (reviewId) {
    const reviewCard = page.locator(`[data-review-id="${reviewId}"]`).first();
    await reviewCard.waitFor({ state: 'visible', timeout: 60_000 });
    const expandBtn = reviewCard.getByRole('button', { name: /^더보기$/ }).first();
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(400);
    }
    await reviewCard.scrollIntoViewIfNeeded();
  }
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      if (!root) return false;
      const t = root.innerText || '';
      return t.includes('GATEO 리뷰어') && t.length > 280;
    },
    null,
    { timeout: 90_000 },
  );
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(800);
}

async function openHubFeed(page) {
  await page.goto(`${onUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {});
  const hub = page.getByTestId('logbook-official-review-hub');
  await hub.waitFor({ state: 'visible', timeout: 90_000 });
  return hub;
}

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

if (mode === 'flag-off') {
  await openHubFeed(page).catch(async () => {
    await page.goto(`${onUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  });
  const hub = page.getByTestId('logbook-official-review-hub');
  if (await hub.isVisible().catch(() => false)) {
    throw new Error('Hub card visible with flag off — expected hidden');
  }
  await shoot(page, '07-feed-flag-off-unchanged.png');
  await browser.close();
  console.log('capture-logbook-review-hub-pr1-390 flag-off OK');
  process.exit(0);
}

const hub = await openHubFeed(page);

await shoot(page, '01-feed-hub-collapsed-flag-on.png');
await hub.getByTestId('logbook-official-review-hub-toggle').click();
await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
await page.waitForFunction(
  () => {
    const imgs = [...document.querySelectorAll('[data-testid="logbook-official-review-hub-item"] img')];
    if (!imgs.length) return true;
    return imgs.every((img) => img.complete && (img.naturalWidth > 0 || img.naturalHeight === 0));
  },
  null,
  { timeout: 60_000 },
).catch(() => {});
await page.waitForTimeout(600);
await shoot(page, '02-feed-hub-expanded-list.png');

const more = page.getByTestId('logbook-official-review-hub-more');
if (await more.isVisible().catch(() => false)) {
  await more.click();
  await page.waitForTimeout(400);
  await shoot(page, '03-feed-hub-more.png');
}

for (const { slug, file } of PLACE_CAPTURES) {
  const hubForPlace = await openHubFeed(page);
  await hubForPlace.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });

  const item = page.locator(`[data-hub-place-slug="${slug}"]`).first();
  await item.waitFor({ state: 'visible', timeout: 30_000 });
  const placeLabel = (await item.locator('span.text-xs.font-semibold').first().textContent())?.trim() || '';
  const reviewId = await item.getAttribute('data-review-id');
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await waitForPlaceReviewsSurface(page, { reviewId, placeLabel });
  await shoot(page, file);
}

await browser.close();
console.log('capture-logbook-review-hub-pr1-390 OK');

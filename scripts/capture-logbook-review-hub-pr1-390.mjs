/**
 * WebKit — Logbook official review hub PR-1 captures.
 * CAPTURE_BASE_URL — local dev/preview (default https://127.0.0.1:5195)
 * CAPTURE_FLAG_OFF_URL — local without hub flag (default https://127.0.0.1:5196)
 * CAPTURE_PROD_URL — prod baseline (default https://www.gateo.kr)
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-hub-pr1
 * CAPTURE_MODE — flag-on (default) | flag-off-compare | expanded-only
 */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-hub-pr1';
const onUrl = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5195';
const flagOffUrl = process.env.CAPTURE_FLAG_OFF_URL || 'https://127.0.0.1:5196';
const prodUrl = process.env.CAPTURE_PROD_URL || 'https://www.gateo.kr';
const mode = process.env.CAPTURE_MODE || 'flag-on';
const storeDirs = (process.env.CAPTURE_STORE_DIRS || '/cursor/stores/self/artifacts/logbook-review-hub-pr1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const PLACE_CAPTURES = [
  { slug: 'kyoto', file: '04-place-reviews-kyoto-from-hub.png' },
  { slug: 'dubai', file: '05-place-reviews-dubai-from-hub.png' },
  { slug: 'venice', file: '06-place-reviews-venice-from-hub.png' },
];

mkdirSync(outDir, { recursive: true });

async function shoot(page, name, { width = 390, height = 844 } = {}) {
  await page.setViewportSize({ width, height });
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  console.log(`shot ${path} (${width}px)`);
}

async function waitForPublicLogbookFeedReady(page) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      if (/동기화하는 중/.test(text)) return false;
      const loadingSkeletons = document.querySelectorAll(
        '.h-28.bg-gray-50\\/50.rounded-2xl.animate-pulse',
      );
      if (loadingSkeletons.length >= 3) return false;
      return /Public LogBook|공개 피드|피드/.test(text) || /기록/.test(text);
    },
    null,
    { timeout: 120_000 },
  );
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
}

async function waitForHubThumbsReady(page) {
  await page.waitForFunction(
    () => {
      const items = [...document.querySelectorAll('[data-testid="logbook-official-review-hub-item"]')];
      if (!items.length) return false;
      for (const item of items) {
        const wantsThumb = item.getAttribute('data-hub-has-thumb') === 'true';
        const visibleThumb = item.querySelector('img.h-14');
        const loadingProbe = item.querySelector('img[aria-hidden]');
        if (wantsThumb && loadingProbe && !visibleThumb) return false;
        if (visibleThumb && (!visibleThumb.complete || visibleThumb.naturalWidth === 0)) {
          return false;
        }
      }
      return true;
    },
    null,
    { timeout: 90_000 },
  );
}

async function waitForPlaceReviewsSurface(page, { reviewId, placeLabel } = {}) {
  await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 90_000 });
  await page.getByText('GATEO 리뷰어', { exact: false }).first().waitFor({
    state: 'visible',
    timeout: 120_000,
  });
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
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(800);
}

async function openHubFeed(page, baseUrl) {
  await page.goto(`${baseUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {});
  const hub = page.getByTestId('logbook-official-review-hub');
  await hub.waitFor({ state: 'visible', timeout: 90_000 });
  return hub;
}

async function captureExpandedListShots(page, hub) {
  await hub.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
  await waitForHubThumbsReady(page);
  await shoot(page, '02-feed-hub-expanded-list.png', { width: 390 });
  await waitForHubThumbsReady(page);
  await shoot(page, '02-feed-hub-expanded-list-1280.png', { width: 1280, height: 900 });
}

function mirrorArtifactsToStore() {
  const src = resolve(outDir);
  for (const dir of storeDirs) {
    const dest = resolve(dir);
    if (src === dest) {
      console.log(`artifacts already at store path ${dest}`);
      continue;
    }
    mkdirSync(dest, { recursive: true });
    cpSync(outDir, dest, { recursive: true });
    console.log(`copied artifacts → ${dest}`);
  }
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

if (mode === 'flag-off-compare') {
  await page.goto(`${prodUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  if (await page.getByTestId('logbook-official-review-hub').isVisible().catch(() => false)) {
    throw new Error('Prod main should not show review hub card');
  }
  await shoot(page, '07-feed-prod-main-flag-off-baseline.png', { width: 390 });

  await page.goto(`${flagOffUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  const hub = page.getByTestId('logbook-official-review-hub');
  if (await hub.isVisible().catch(() => false)) {
    throw new Error('Local flag-off build must not show review hub card');
  }
  await shoot(page, '07-feed-flag-off-unchanged.png', { width: 390 });

  await browser.close();
  mirrorArtifactsToStore();
  console.log('capture-logbook-review-hub-pr1-390 flag-off-compare OK');
  process.exit(0);
}

if (mode === 'expanded-only') {
  const hub = await openHubFeed(page, onUrl);
  await captureExpandedListShots(page, hub);
  await browser.close();
  mirrorArtifactsToStore();
  console.log('capture-logbook-review-hub-pr1-390 expanded-only OK');
  process.exit(0);
}

const hub = await openHubFeed(page, onUrl);

await shoot(page, '01-feed-hub-collapsed-flag-on.png', { width: 390 });
await captureExpandedListShots(page, hub);

const more = page.getByTestId('logbook-official-review-hub-more');
if (await more.isVisible().catch(() => false)) {
  await more.click();
  await waitForHubThumbsReady(page);
  await shoot(page, '03-feed-hub-more.png', { width: 390 });
}

for (const { slug, file } of PLACE_CAPTURES) {
  const hubForPlace = await openHubFeed(page, onUrl);
  await hubForPlace.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });

  const item = page.locator(`[data-hub-place-slug="${slug}"]`).first();
  await item.waitFor({ state: 'visible', timeout: 30_000 });
  const placeLabel = (await item.locator('span.text-xs.font-semibold').first().textContent())?.trim() || '';
  const reviewId = await item.getAttribute('data-review-id');
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await waitForPlaceReviewsSurface(page, { reviewId, placeLabel });
  await shoot(page, file, { width: 390 });
}

await browser.close();
mirrorArtifactsToStore();
console.log('capture-logbook-review-hub-pr1-390 OK');

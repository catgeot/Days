/**
 * WebKit captures — logbook official review hub follow-up (flag ON local + prod read-only).
 *
 * CAPTURE_BASE_URL — hub flag ON (default https://127.0.0.1:5195)
 * CAPTURE_FLAG_OFF_URL — hub flag OFF local (default https://127.0.0.1:5196)
 * CAPTURE_PROD_URL — prod baseline (default https://www.gateo.kr)
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-hub-followup
 */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir =
  process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-hub-followup';
const onUrl = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5195';
const flagOffUrl = process.env.CAPTURE_FLAG_OFF_URL || 'https://127.0.0.1:5196';
const prodUrl = process.env.CAPTURE_PROD_URL || 'https://www.gateo.kr';
const mode = process.env.CAPTURE_MODE || 'full';
const PARIS_REVIEW_ID =
  process.env.CAPTURE_PARIS_REVIEW_ID || '62190bb0-b77d-4485-9e83-98ec5e3d85f6';

const PLACE_CAPTURES = [
  { slug: 'kyoto', file: '08-place-reviews-kyoto-from-hub.png' },
  { slug: 'dubai', file: '09-place-reviews-dubai-from-hub.png' },
  { slug: 'venice', file: '10-place-reviews-venice-from-hub.png' },
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

async function expandHubList(page, hub) {
  await hub.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
  await waitForHubThumbsReady(page);
}

async function paginateUntilReviewVisible(page, reviewId) {
  let moreClicks = 0;
  const more = page.getByTestId('logbook-official-review-hub-more');
  const target = page.locator(`[data-review-id="${reviewId}"]`);
  while (!(await target.isVisible().catch(() => false))) {
    if (!(await more.isVisible().catch(() => false))) {
      throw new Error(`Review ${reviewId} not found and no 더 보기`);
    }
    await more.click();
    moreClicks += 1;
    await page.waitForTimeout(350);
    await waitForHubThumbsReady(page);
  }
  await target.scrollIntoViewIfNeeded();
  return moreClicks;
}

async function paginateUntilPlaceSlugVisible(page, slug) {
  let moreClicks = 0;
  const more = page.getByTestId('logbook-official-review-hub-more');
  const target = page.locator(`[data-hub-place-slug="${slug}"]`).first();
  while (!(await target.isVisible().catch(() => false))) {
    if (!(await more.isVisible().catch(() => false))) {
      throw new Error(`Place slug ${slug} not found in hub`);
    }
    await more.click();
    moreClicks += 1;
    await page.waitForTimeout(350);
    await waitForHubThumbsReady(page);
  }
  await target.scrollIntoViewIfNeeded();
  return moreClicks;
}

function mirrorArtifactsToStore() {
  const storeDirs = (process.env.CAPTURE_STORE_DIRS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const src = resolve(outDir);
  for (const dir of storeDirs) {
    const dest = resolve(dir);
    if (src === dest) continue;
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

if (mode === 'load-failed') {
  await page.route('**/rest/v1/place_reviews**', (route) => {
    const url = route.request().url();
    if (url.includes('is_editorial=eq.true')) {
      return route.abort('failed');
    }
    return route.continue();
  });
  await page.goto(`${onUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  const failed = page.getByTestId('logbook-official-review-hub');
  await failed.waitFor({ state: 'visible', timeout: 60_000 });
  await shoot(page, '05-feed-hub-load-failed.png', { width: 390 });
  await shoot(page, '05-feed-hub-load-failed-1280.png', { width: 1280, height: 900 });
  await browser.close();
  mirrorArtifactsToStore();
  console.log('capture followup load-failed OK');
  process.exit(0);
}

if (mode === 'flag-off-compare') {
  await page.goto(`${prodUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  if (await page.getByTestId('logbook-official-review-hub').isVisible().catch(() => false)) {
    throw new Error('Prod should not show review hub card');
  }
  await shoot(page, '11-feed-prod-flag-off-baseline.png', { width: 390 });

  await page.goto(`${flagOffUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  if (await page.getByTestId('logbook-official-review-hub').isVisible().catch(() => false)) {
    throw new Error('Local flag-off must not show hub');
  }
  await shoot(page, '11-feed-flag-off-unchanged.png', { width: 390 });
  await browser.close();
  mirrorArtifactsToStore();
  process.exit(0);
}

const hub = await openHubFeed(page, onUrl);

await shoot(page, '01-feed-hub-collapsed-390.png', { width: 390 });
await shoot(page, '01-feed-hub-collapsed-1280.png', { width: 1280, height: 900 });

await expandHubList(page, hub);
await shoot(page, '02-feed-hub-expanded-list-390.png', { width: 390 });
await shoot(page, '02-feed-hub-expanded-list-1280.png', { width: 1280, height: 900 });

await hub.getByTestId('logbook-official-review-hub-toggle').click();
await page.getByTestId('logbook-official-review-hub-panel').waitFor({ state: 'hidden', timeout: 10_000 });
await shoot(page, '03-feed-hub-title-row-collapsed-390.png', { width: 390 });

await hub.getByTestId('logbook-official-review-hub-toggle').click();
await page.getByTestId('logbook-official-review-hub-panel').waitFor({ state: 'visible', timeout: 10_000 });
await waitForHubThumbsReady(page);

const parisMoreClicks = await paginateUntilReviewVisible(page, PARIS_REVIEW_ID);
const parisItem = page.locator(`[data-review-id="${PARIS_REVIEW_ID}"]`);
const parisBadge = await parisItem.getAttribute('data-hub-persona-badge');
const parisPlace = await parisItem.locator('span.text-xs.font-semibold').first().textContent();
console.log(
  JSON.stringify({
    parisReviewId: PARIS_REVIEW_ID,
    moreClicksToParis: parisMoreClicks,
    personaBadge: parisBadge?.trim(),
    placeName: parisPlace?.trim(),
  }),
);
await shoot(page, '04-feed-hub-paris-row-390.png', { width: 390 });
await shoot(page, '04-feed-hub-paris-row-1280.png', { width: 1280, height: 900 });

let koreaSlug = '';
const koreaItem = page
  .locator('[data-testid="logbook-official-review-hub-item"]')
  .filter({ hasText: /서울|부산|제주|경주|한국|인천|대구|광주/ })
  .first();
if (await koreaItem.isVisible().catch(() => false)) {
  koreaSlug = (await koreaItem.getAttribute('data-hub-place-slug')) || '';
}

const placeCaptures = [...PLACE_CAPTURES];
if (koreaSlug) {
  placeCaptures.push({
    slug: koreaSlug,
    file: '10-place-reviews-korea-from-hub.png',
  });
}

for (const { slug, file } of placeCaptures) {
  const hubForPlace = await openHubFeed(page, onUrl);
  await expandHubList(page, hubForPlace);
  const placeMoreClicks = await paginateUntilPlaceSlugVisible(page, slug);
  if (placeMoreClicks > 0) {
    console.log(`paginated ${placeMoreClicks}× 더 보기 for slug ${slug}`);
  }
  const item = page.locator(`[data-hub-place-slug="${slug}"]`).first();
  const placeLabel = (await item.locator('span.text-xs.font-semibold').first().textContent())?.trim() || '';
  const reviewId = await item.getAttribute('data-review-id');
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await waitForPlaceReviewsSurface(page, { reviewId, placeLabel });
  await shoot(page, file, { width: 390 });
}

await browser.close();
mirrorArtifactsToStore();
console.log('capture-logbook-review-hub-followup OK');

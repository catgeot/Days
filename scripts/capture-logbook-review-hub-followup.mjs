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

const STORE_DIRS = (process.env.CAPTURE_STORE_DIRS ||
  '/cursor/stores/self/artifacts/logbook-review-hub-followup,/cursor/stores/bot/artifacts/logbook-review-hub-followup')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function newFeedPage(browser, width) {
  const isMobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: isMobile ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  return { page, context, isMobile };
}

async function shootViewport(page, name, { width, height }) {
  const h = height ?? (width < 768 ? 844 : 900);
  await page.setViewportSize({ width, height: h });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  const path = join(outDir, name);
  await page.screenshot({ path, fullPage: false });
  const metrics = await measureHubInViewport(page);
  console.log(`shot ${path} (${width}×${h}) ${JSON.stringify(metrics)}`);
  return metrics;
}

async function measureHubInViewport(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const vw = window.innerWidth;
    const toggle =
      document.querySelector('[data-testid="logbook-official-review-hub-toggle"]') ||
      document.querySelector('[data-testid="logbook-official-review-hub-title-row"]');
    const count = document.querySelector('[data-testid="logbook-official-review-hub-count"]');
    const hub = document.querySelector('[data-testid="logbook-official-review-hub"]');
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top) };
    };
    const t = rect(toggle);
    const c = rect(count);
    const h = rect(hub);
    const within = (r) => (r ? r.left >= 0 && r.right <= vw : null);
    return {
      innerWidth: vw,
      scrollWidth: de.scrollWidth,
      overflowPx: de.scrollWidth - vw,
      hub: h,
      toggle: t,
      count: c,
      hubFullyInViewport: within(h),
      toggleFullyInViewport: within(t),
      countFullyInViewport: within(c),
    };
  });
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

async function scrollReviewIntoMainViewport(page, reviewId) {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-review-id="${id}"]`);
    const main = document.querySelector('[data-logbook-main-scroll]');
    if (!el || !main) {
      el?.scrollIntoView({ block: 'center' });
      return;
    }
    const elRect = el.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    main.scrollTop +=
      elRect.top - mainRect.top - main.clientHeight / 2 + elRect.height / 2;
  }, reviewId);
  await page.waitForTimeout(450);
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
  const src = resolve(outDir);
  for (const dir of STORE_DIRS) {
    const dest = resolve(dir);
    if (src === dest) {
      console.log(`artifacts already at store path ${dest}`);
      continue;
    }
    mkdirSync(dest, { recursive: true });
    try {
      cpSync(outDir, dest, { recursive: true });
      console.log(`copied artifacts → ${dest}`);
    } catch (error) {
      if (error?.code === 'ERR_FS_CP_EINVAL') {
        console.log(`skip mirror (same path) ${dest}`);
        continue;
      }
      throw error;
    }
  }
}

const browser = await webkit.launch();
const captureMetrics = [];

async function runHubFlow(page, baseUrl) {
  const hub = await openHubFeed(page, baseUrl);
  captureMetrics.push({
    shot: '01-collapsed',
    w390: await shootViewport(page, '01-feed-hub-collapsed-390.png', { width: 390 }),
  });
  const { page: desktop, context: desktopCtx } = await newFeedPage(browser, 1280);
  const hubDesk = await openHubFeed(desktop, baseUrl);
  captureMetrics.push({
    shot: '01-collapsed',
    w1280: await shootViewport(desktop, '01-feed-hub-collapsed-1280.png', { width: 1280 }),
  });

  await expandHubList(page, hub);
  captureMetrics.push({
    shot: '02-expanded',
    w390: await shootViewport(page, '02-feed-hub-expanded-list-390.png', { width: 390 }),
  });
  await expandHubList(desktop, hubDesk);
  captureMetrics.push({
    shot: '02-expanded',
    w1280: await shootViewport(desktop, '02-feed-hub-expanded-list-1280.png', { width: 1280 }),
  });

  await hub.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ state: 'hidden', timeout: 10_000 });
  await shootViewport(page, '03-feed-hub-title-row-collapsed-390.png', { width: 390 });

  await hub.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ state: 'visible', timeout: 10_000 });
  await waitForHubThumbsReady(page);

  const parisMoreClicks = await paginateUntilReviewVisible(page, PARIS_REVIEW_ID);
  const parisItem = page.locator(`[data-review-id="${PARIS_REVIEW_ID}"]`);
  await parisItem.scrollIntoViewIfNeeded();
  await scrollReviewIntoMainViewport(page, PARIS_REVIEW_ID);
  const parisBadge = await parisItem.getAttribute('data-hub-persona-badge');
  const parisPlace = await parisItem.locator('span.text-xs.font-semibold').first().textContent();
  captureMetrics.push({
    shot: '04-paris',
    w390: await shootViewport(page, '04-feed-hub-paris-row-390.png', { width: 390 }),
    paris: {
      parisReviewId: PARIS_REVIEW_ID,
      moreClicksToParis: parisMoreClicks,
      personaBadge: parisBadge?.trim(),
      placeName: parisPlace?.trim(),
    },
  });

  await paginateUntilReviewVisible(desktop, PARIS_REVIEW_ID);
  const parisDesk = desktop.locator(`[data-review-id="${PARIS_REVIEW_ID}"]`);
  await parisDesk.scrollIntoViewIfNeeded();
  await scrollReviewIntoMainViewport(desktop, PARIS_REVIEW_ID);
  captureMetrics.push({
    shot: '04-paris',
    w1280: await shootViewport(desktop, '04-feed-hub-paris-row-1280.png', { width: 1280 }),
  });

  await desktopCtx.close();

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
    placeCaptures.push({ slug: koreaSlug, file: '10-place-reviews-korea-from-hub.png' });
  }

  for (const { slug, file } of placeCaptures) {
    const hubForPlace = await openHubFeed(page, baseUrl);
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
    await shootViewport(page, file, { width: 390 });
  }

  return page.context();
}

if (mode === 'load-failed') {
  for (const width of [390, 1280]) {
    const { page, context } = await newFeedPage(browser, width);
    await page.route('**/rest/v1/place_reviews**', (route) => {
      const url = route.request().url();
      if (url.includes('is_editorial=eq.true')) {
        return route.abort('failed');
      }
      return route.continue();
    });
    await page.goto(`${onUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
    await waitForPublicLogbookFeedReady(page);
    await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
    const file =
      width === 390 ? '05-feed-hub-load-failed.png' : '05-feed-hub-load-failed-1280.png';
    const m = await shootViewport(page, file, { width });
    if (!m.toggleFullyInViewport) {
      throw new Error(`loadFailed ${width}px: hub toggle not fully in viewport`);
    }
    await context.close();
  }
  await browser.close();
  mirrorArtifactsToStore();
  console.log('capture followup load-failed OK');
  process.exit(0);
}

if (mode === 'flag-off-compare') {
  const { page, context } = await newFeedPage(browser, 390);
  await page.goto(`${prodUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  if (await page.getByTestId('logbook-official-review-hub').isVisible().catch(() => false)) {
    throw new Error('Prod should not show review hub card');
  }
  await shootViewport(page, '11-feed-prod-flag-off-baseline.png', { width: 390 });
  await context.close();

  const off = await newFeedPage(browser, 390);
  await off.page.goto(`${flagOffUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(off.page);
  if (await off.page.getByTestId('logbook-official-review-hub').isVisible().catch(() => false)) {
    throw new Error('Local flag-off must not show hub');
  }
  await shootViewport(off.page, '11-feed-flag-off-unchanged.png', { width: 390 });
  await off.context.close();
  await browser.close();
  mirrorArtifactsToStore();
  process.exit(0);
}

const { page: mobilePage, context: mobileCtx } = await newFeedPage(browser, 390);
await runHubFlow(mobilePage, onUrl);

for (const row of captureMetrics) {
  for (const key of ['w390', 'w1280']) {
    const m = row[key];
    if (m && m.toggleFullyInViewport === false) {
      throw new Error(`Hub toggle clipped for ${row.shot} at ${key}`);
    }
  }
}

await mobileCtx.close();
await browser.close();

const { writeFileSync } = await import('node:fs');
writeFileSync(
  join(outDir, 'overflow-metrics.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), shots: captureMetrics }, null, 2)}\n`,
);

mirrorArtifactsToStore();
console.log('capture-logbook-review-hub-followup OK');

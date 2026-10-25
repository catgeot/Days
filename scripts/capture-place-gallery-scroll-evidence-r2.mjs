#!/usr/bin/env node
/**
 * WebKit 390 scroll evidence for PR #555 QA r2 (not part of CI e2e).
 *   npm run build:e2e-mooni && npx vite preview --host 127.0.0.1 --port 4173 --strictPort &
 *   SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/capture-place-gallery-scroll-evidence-r2.mjs
 */
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PLACE_GALLERY_POP_SHOT_DIR || '/opt/cursor/artifacts/place-gallery-pop-scroll-390';
const VIEWPORT = { width: 390, height: 844 };
const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, '../e2e/fixtures/place-visit-story-reviews.json'), 'utf8'),
);

const PRAGUE_REVIEW_ROWS = Array.from({ length: 14 }, (_, i) => ({
  id: `e2e-prague-pad-${i}`,
  place_slug: 'prague',
  content: `E2E Prague padding review ${i} — scroll depth filler.`,
  content_blocks: null,
  persona_label: null,
  is_public: true,
  is_editorial: false,
  created_at: `2026-10-${String(20 - i).padStart(2, '0')}T10:00:00.000Z`,
  rating: 5,
  user_id: `e2e-prague-u-${i}`,
  user: { id: `e2e-prague-u-${i}`, display_name: `Prague ${i}`, avatar_url: null },
  likes: [],
  images: i === 0
    ? [{ url: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600' }]
    : [],
}));

const metrics = [];

async function clipShot(page, name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  return path;
}

function record(caseId, phase, scrollTop, extra = {}) {
  metrics.push({ caseId, phase, scrollTop, ...extra });
}

async function fulfillPlaceReviews(route, rows) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) {
    return route.continue();
  }
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = rows.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function openCairoFromExplore(page, { forceSearchClick = false } = {}) {
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 60_000 });
  await search.click(forceSearchClick ? { force: true } : undefined);
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('카이로');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '카이로여행지' })
    .first();
  await row.waitFor({ state: 'visible', timeout: 20_000 });
  await row.click();
  await page.waitForURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
}

async function scrollGalleryDeep(page, minTop = 1000) {
  const gallery = page.locator('[data-place-gallery-scroll]');
  for (let i = 0; i < 60; i += 1) {
    const h = await gallery.evaluate((el) => el.scrollHeight);
    if (h > minTop + 200) break;
    await page.waitForTimeout(500);
  }
  return gallery.evaluate((el, min) => {
    const target = Math.min(el.scrollHeight - 8, Math.max(min, 1100));
    el.scrollTop = target;
    el.setAttribute('data-gallery-last-scroll', String(target));
    return el.scrollTop;
  }, minTop);
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route, REVIEW_ROWS));

  // 1 — Cairo lightbox
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await openCairoFromExplore(page);
  const gallery = page.locator('[data-place-gallery-scroll]');
  await gallery.waitFor({ state: 'visible', timeout: 30_000 });
  const lightboxBefore = await scrollGalleryDeep(page, 1200);
  record('cairo-lightbox-back', 'before-open', lightboxBefore);
  await clipShot(page, 'r2-01-cairo-lightbox-before');
  const tile = gallery.locator('img').first();
  await tile.evaluate((img) => {
    const root = img.closest('.break-inside-avoid') || img;
    root.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.locator('[data-place-lightbox]').waitFor({ state: 'visible', timeout: 15_000 });
  await clipShot(page, 'r2-02-cairo-lightbox-open');
  await page.goBack({ waitUntil: 'commit' });
  await page.locator('[data-place-lightbox]').waitFor({ state: 'hidden', timeout: 15_000 });
  for (let i = 0; i < 24; i += 1) {
    const top = await gallery.evaluate((el) => el.scrollTop);
    if (top >= lightboxBefore - 8) break;
    await page.waitForTimeout(500);
  }
  const lightboxAfter = await gallery.evaluate((el) => el.scrollTop);
  record('cairo-lightbox-back', 'after-close', lightboxAfter, {
    diff: Math.abs(lightboxAfter - lightboxBefore),
  });
  await clipShot(page, 'r2-03-cairo-lightbox-after');

  // 2 — Cairo reviews → browser back (POP)
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await openCairoFromExplore(page);
  await gallery.waitFor({ state: 'visible', timeout: 30_000 });
  const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  await storiesHeader.click();
  const popBefore = await gallery.evaluate((el) => {
    el.scrollTop = 320;
    el.setAttribute('data-gallery-last-scroll', '320');
    return el.scrollTop;
  });
  record('cairo-review-pop-back', 'before-reviews', popBefore);
  await clipShot(page, 'r2-04-cairo-gallery-before-reviews');
  const focusStory = page
    .locator('[data-visit-story-kind="review"]')
    .filter({ hasText: 'E2E visit story — target review' })
    .first();
  await focusStory.waitFor({ state: 'visible', timeout: 20_000 });
  await focusStory.click();
  await page.waitForURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
  await clipShot(page, 'r2-05-cairo-reviews');
  await page.goBack();
  await page.waitForURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
  let popAfter = popBefore;
  for (let i = 0; i < 50; i += 1) {
    popAfter = await gallery.evaluate((el) => el.scrollTop);
    if (Math.abs(popAfter - popBefore) <= 8) break;
    await page.waitForTimeout(400);
  }
  record('cairo-review-pop-back', 'after-pop-back', popAfter, {
    diff: Math.abs(popAfter - popBefore),
  });
  await clipShot(page, 'r2-06-cairo-gallery-after-pop-back');

  // 3 — Prague review viewer
  await page.unroute('**/rest/v1/place_reviews**');
  await page.route('**/rest/v1/place_reviews**', (route) =>
    fulfillPlaceReviews(route, [...REVIEW_ROWS, ...PRAGUE_REVIEW_ROWS]),
  );
  await page.goto(`${baseURL}place/prague/reviews?lang=ko`, { waitUntil: 'domcontentloaded' });
  const root = page.locator('[data-place-reviews-scroll-root]');
  await root.waitFor({ state: 'visible', timeout: 60_000 });
  const expand = page.getByRole('button', { name: /^더보기$/ }).first();
  for (let i = 0; i < 8; i += 1) {
    if (!(await expand.isVisible().catch(() => false))) break;
    await expand.click().catch(() => {});
    await page.waitForTimeout(250);
  }
  for (let i = 0; i < 60; i += 1) {
    const max = await root.evaluate((el) => el.scrollHeight - el.clientHeight);
    if (max > 1500) break;
    await page.waitForTimeout(500);
  }
  const pragueBefore = await root.evaluate((el) => {
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const target = Math.min(max, Math.max(1200, max - 40));
    el.scrollTop = target;
    el.setAttribute('data-gallery-last-scroll', String(el.scrollTop));
    return el.scrollTop;
  });
  record('prague-review-viewer-close', 'before-open', pragueBefore);
  await clipShot(page, 'r2-07-prague-reviews-scrolled');
  const reviewWithImage = root.locator('[data-review-id="e2e-prague-pad-0"]');
  const expandReview = reviewWithImage.getByRole('button', { name: /^더보기$/ });
  if (await expandReview.isVisible().catch(() => false)) {
    await expandReview.click();
  }
  const thumb = reviewWithImage.locator('img[alt^="review img"]').first();
  await thumb.waitFor({ state: 'visible', timeout: 30_000 });
  await thumb.evaluate((img) => {
    img.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.getByAltText(/갤러리 뷰어 이미지|Gallery viewer image/).waitFor({ state: 'visible', timeout: 15_000 });
  await clipShot(page, 'r2-08-prague-viewer-open');
  await page.goBack({ waitUntil: 'commit' });
  await page.getByAltText(/갤러리 뷰어 이미지|Gallery viewer image/).waitFor({ state: 'hidden', timeout: 15_000 });
  await page.waitForTimeout(800);
  const pragueAfter = await root.evaluate((el) => el.scrollTop);
  record('prague-review-viewer-close', 'after-close', pragueAfter, {
    diff: Math.abs(pragueAfter - pragueBefore),
  });
  await clipShot(page, 'r2-09-prague-reviews-after-viewer');

  // 4 — In-app explore link → gallery at 0
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await openCairoFromExplore(page);
  await gallery.waitFor({ state: 'visible' });
  await scrollGalleryDeep(page, 900);
  record('cairo-in-app-link', 'gallery-scrolled', await gallery.evaluate((el) => el.scrollTop));
  await storiesHeader.click();
  await focusStory.click();
  await page.waitForURL(/\/place\/cairo\/reviews/);
  await page.getByRole('button', { name: /홈으로 이동|Go home/i }).click();
  await page.waitForURL(/\/(?:\?|$)/, { timeout: 30_000 });
  await openCairoFromExplore(page);
  await gallery.waitFor({ state: 'visible' });
  const inAppTop = await gallery.evaluate((el) => el.scrollTop);
  record('cairo-in-app-link', 'after-in-app-link', inAppTop);
  await clipShot(page, 'r2-10-cairo-in-app-link-gallery-top');

  const summary = metrics.map((row) => {
    if (row.caseId === 'cairo-in-app-link') {
      return { ...row, pass: row.phase === 'after-in-app-link' ? row.scrollTop < 40 : undefined };
    }
    if (row.diff != null) {
      return { ...row, pass: row.diff <= 8 };
    }
    return row;
  });

  await writeFile(join(OUT, 'scroll-metrics-r2.json'), JSON.stringify({ capturedAt: new Date().toISOString(), rows: summary }, null, 2));
  await browser.close();

  const failed = summary.filter((r) => r.pass === false);
  if (failed.length) {
    console.error('Evidence FAIL', failed);
    process.exit(1);
  }
  console.log(`Wrote ${OUT}/scroll-metrics-r2.json and r2-*.png`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

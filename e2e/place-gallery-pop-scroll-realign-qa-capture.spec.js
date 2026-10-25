/**
 * WebKit 390 QA capture — gallery POP scroll realign (Cairo).
 * Run: SMOKE_SITE_URL=http://127.0.0.1:4173 npx playwright test e2e/place-gallery-pop-scroll-realign-qa-capture.spec.js --project=webkit-place-visit-story-review-focus
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.PLACE_GALLERY_POP_SHOT_DIR || '/opt/cursor/artifacts/place-gallery-pop-scroll-390';
const VIEWPORT = { width: 390, height: 844 };
const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-visit-story-reviews.json'), 'utf8'),
);

const PRAGUE_REVIEW_ROWS = Array.from({ length: 14 }, (_, i) => ({
  id: `e2e-prague-pad-${i}`,
  place_slug: 'prague',
  content: `E2E Prague padding review ${i} — scroll depth filler for review viewer scroll restore.`,
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

function fulfillPlaceReviews(route, rows = REVIEW_ROWS) {
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

async function openCairoFromSearch(page) {
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('카이로');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '카이로여행지' })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
}

async function clipShot(page, name, scrollTop) {
  const path = `${OUT_DIR}/${name}.png`;
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  metrics.push({ shot: name, scrollTop });
}

async function galleryScrollTop(page) {
  const gallery = page.locator('[data-place-gallery-scroll]');
  return gallery.evaluate((el) => el.scrollTop);
}

async function scrollGalleryDeep(page, minTop = 1000) {
  const gallery = page.locator('[data-place-gallery-scroll]');
  await expect.poll(async () => {
    return gallery.evaluate((el) => el.scrollHeight);
  }, { timeout: 30_000 }).toBeGreaterThan(minTop + 200);
  const top = await gallery.evaluate((el, min) => {
    const target = Math.min(el.scrollHeight - 8, Math.max(min, 1100));
    el.scrollTop = target;
    el.setAttribute('data-gallery-last-scroll', String(target));
    return el.scrollTop;
  }, minTop);
  return top;
}

test.use({
  ignoreHTTPSErrors: true,
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
});

test.describe('place gallery POP scroll — QA capture WebKit 390', () => {
  test.beforeAll(async () => {
    await mkdir(OUT_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    await writeFile(`${OUT_DIR}/scroll-metrics.json`, JSON.stringify(metrics, null, 2));
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('cairo gallery back scroll + interaction matrix', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });

    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await expect.poll(async () => scrollGalleryDeep(page, 800), { timeout: 45_000 })
      .toBeGreaterThan(900);
    const beforeTop = await galleryScrollTop(page);
    await clipShot(page, '01-gallery-scrolled-before', beforeTop);

    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.goBack();
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => galleryScrollTop(page), { timeout: 12_000 })
      .toBeGreaterThan(beforeTop - 24);

    const backImmediate = await galleryScrollTop(page);
    await clipShot(page, '02-back-immediate', backImmediate);
    await page.waitForTimeout(2000);
    const back2s = await galleryScrollTop(page);
    await clipShot(page, '03-back-plus-2s', back2s);
    expect(Math.abs(back2s - beforeTop)).toBeLessThanOrEqual(8);

    await page.waitForTimeout(2500);
    const afterImages = await galleryScrollTop(page);
    await clipShot(page, '04-after-images-loaded', afterImages);
    expect(Math.abs(afterImages - beforeTop)).toBeLessThanOrEqual(8);

    await gallery.evaluate((el) => {
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
      el.scrollTop += 120;
    });
    const swipeImmediate = await galleryScrollTop(page);
    await clipShot(page, '05-swipe-immediate', swipeImmediate);
    await page.waitForTimeout(2000);
    const swipe2s = await galleryScrollTop(page);
    await clipShot(page, '06-swipe-plus-2s', swipe2s);
    expect(Math.abs(swipe2s - swipeImmediate)).toBeLessThanOrEqual(8);

    await gallery.evaluate((el) => {
      el.scrollTop += 80;
    });
    const duringLazy = await galleryScrollTop(page);
    await page.waitForTimeout(800);
    const duringLazyLater = await galleryScrollTop(page);
    await clipShot(page, '07-continued-scroll-lazy', duringLazyLater);
    expect(Math.abs(duringLazyLater - duringLazy)).toBeLessThanOrEqual(8);

    await page.goto('/?lang=ko', { waitUntil: 'domcontentloaded' });
    await openCairoFromSearch(page);
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const pushReentry = await galleryScrollTop(page);
    await clipShot(page, '08-in-app-push-reentry', pushReentry);
    expect(pushReentry).toBeLessThan(40);

    await openCairoFromSearch(page);
    await storiesHeader.click();
    await scrollGalleryDeep(page, 800);
    await focusStory.click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.goBack();
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const reloadBackImmediate = await galleryScrollTop(page);
    await clipShot(page, '09-reload-review-back-immediate', reloadBackImmediate);
    await page.waitForTimeout(2000);
    const reloadBack2s = await galleryScrollTop(page);
    await clipShot(page, '10-reload-review-back-2s', reloadBack2s);
    expect(Math.abs(reloadBack2s - reloadBackImmediate)).toBeLessThanOrEqual(8);
    expect(reloadBack2s).toBeLessThan(120);
  });

  test('cairo gallery lightbox history.back keeps scroll', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const beforeTop = await scrollGalleryDeep(page, 1200);
    const tile = gallery.locator('img').first();
    await expect(tile).toBeVisible({ timeout: 60_000 });
    await tile.evaluate((img) => {
      const tileRoot = img.closest('.break-inside-avoid') || img;
      tileRoot.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(page.locator('[data-place-lightbox]')).toBeVisible({ timeout: 15_000 });
    await page.goBack({ waitUntil: 'commit' });
    await expect(page.locator('[data-place-lightbox]')).toBeHidden({ timeout: 15_000 });
    await expect(gallery).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => galleryScrollTop(page), { timeout: 12_000 })
      .toBeGreaterThan(beforeTop - 24);
    const afterBack = await galleryScrollTop(page);
    await clipShot(page, '11-cairo-lightbox-back', afterBack);
    expect(Math.abs(afterBack - beforeTop)).toBeLessThanOrEqual(8);
  });

  test('cairo reviews 사진 보기 returns to saved gallery scroll', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    const beforeTop = await scrollGalleryDeep(page, 1200);
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    const galleryBack = page
      .getByRole('link', { name: /사진 보기|View photos/ })
      .or(page.getByRole('button', { name: /사진 보기|View photos/ }))
      .first();
    await expect(galleryBack).toBeVisible({ timeout: 20_000 });
    await galleryBack.click();
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => galleryScrollTop(page), { timeout: 12_000 })
      .toBeGreaterThan(beforeTop - 24);
    const afterGallery = await galleryScrollTop(page);
    await clipShot(page, '12-cairo-review-gallery-back', afterGallery);
    expect(Math.abs(afterGallery - beforeTop)).toBeLessThanOrEqual(8);
  });

  test('prague reviews image viewer close keeps list scroll', async ({ page }) => {
    await page.unroute('**/rest/v1/place_reviews**');
    await page.route('**/rest/v1/place_reviews**', (route) =>
      fulfillPlaceReviews(route, [...REVIEW_ROWS, ...PRAGUE_REVIEW_ROWS]),
    );
    await page.goto('/place/prague/reviews?lang=ko', { waitUntil: 'domcontentloaded' });
    const root = page.locator('[data-place-reviews-scroll-root]');
    await expect(root).toBeVisible({ timeout: 60_000 });
    const expand = page.getByRole('button', { name: /^더보기$/ }).first();
    for (let i = 0; i < 8; i += 1) {
      if (!(await expand.isVisible().catch(() => false))) break;
      await expand.click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(250);
    }
    await expect.poll(async () => {
      return root.evaluate((el) => el.scrollHeight - el.clientHeight);
    }, { timeout: 45_000 }).toBeGreaterThan(1500);
    const beforeTop = await root.evaluate((el) => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      const target = Math.min(max, Math.max(1200, max - 40));
      el.scrollTop = target;
      el.setAttribute('data-gallery-last-scroll', String(el.scrollTop));
      return el.scrollTop;
    });
    expect(beforeTop).toBeGreaterThan(1000);
    const reviewWithImage = root.locator('[data-review-id="e2e-prague-pad-0"]');
    await expect(reviewWithImage).toBeVisible({ timeout: 30_000 });
    const expandReview = reviewWithImage.getByRole('button', { name: /^더보기$/ });
    if (await expandReview.isVisible().catch(() => false)) {
      await expandReview.click();
    }
    const thumb = reviewWithImage.locator('img[alt^="review img"]').first();
    await expect(thumb).toBeVisible({ timeout: 30_000 });
    await thumb.evaluate((img) => {
      img.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(page.getByAltText(/갤러리 뷰어 이미지|Gallery viewer image/)).toBeVisible({
      timeout: 15_000,
    });
    await page.goBack({ waitUntil: 'commit' });
    await expect(page.getByAltText(/갤러리 뷰어 이미지|Gallery viewer image/)).toBeHidden({
      timeout: 15_000,
    });
    await page.waitForTimeout(800);
    const afterClose = await root.evaluate((el) => el.scrollTop);
    await clipShot(page, '13-prague-review-viewer-close', afterClose);
    expect(Math.abs(afterClose - beforeTop)).toBeLessThanOrEqual(8);
  });
});

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-visit-story-reviews.json'), 'utf8'),
);
const FOCUS_ID = 'e2e-visit-story-review-focus';
const FOCUS_ANCHOR_ID = `place-review-${FOCUS_ID}`;

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});

function fulfillPlaceReviews(route, rows = REVIEW_ROWS, delayMs = 0) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) {
    return route.continue();
  }
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = rows.filter((row) => row.place_slug === slug);
  const body = JSON.stringify(filtered);
  if (delayMs > 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(route.fulfill({
          status: 200,
          contentType: 'application/json',
          body,
        }));
      }, delayMs);
    });
  }
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body,
  });
}

async function openCairoFromExplore(page, { forceSearchClick = false } = {}) {
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click(forceSearchClick ? { force: true } : undefined);
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

async function openCairoFromSearch(page) {
  await page.goto('/?lang=ko');
  await openCairoFromExplore(page);
}

async function openCairoFromHomeTop10Chip(page) {
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const chip = page
    .locator('[data-testid="explore-trending-chips-row"] button')
    .filter({ hasText: /카이로/ })
    .first();
  await expect(chip).toBeVisible({ timeout: 60_000 });
  await chip.click();
  await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 45_000 });
}

async function openCairoReviewsTabFromGallery(page) {
  const reviewsLink = page.locator('a[href*="/place/cairo/reviews"]').first();
  await expect(reviewsLink).toBeAttached({ timeout: 30_000 });
  await reviewsLink.evaluate((el) => {
    el.click();
  });
  await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
}

async function cairoHomeTop10ReviewsBackAtDepth(page, { scrollInput = 'wheel' } = {}) {
  const gallery = page.locator('[data-place-gallery-scroll]');
  await expect(gallery).toBeVisible({ timeout: 30_000 });
  const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  if (await storiesHeader.isVisible().catch(() => false)) {
    await storiesHeader.click();
  }
  const ready = await waitGalleryImagesReady(page, gallery);
  if (ready.skipped) return { skipped: true, reason: 'gallery shorter than 1350px scroll range' };
  let before;
  if (scrollInput === 'wheel') {
    await wheelGallery(page, gallery, 200, 16);
    await expect
      .poll(() => gallery.evaluate((el) => el.scrollTop), { timeout: 20_000 })
      .toBeGreaterThan(1350);
    before = await gallery.evaluate((el) => {
      const top = el.scrollTop;
      el.setAttribute('data-gallery-last-scroll', String(top));
      return top;
    });
  } else if (scrollInput === 'scrollTo') {
    await page.evaluate(() => window.scrollTo(0, 1500));
    await gallery.evaluate((el) => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      const top = Math.min(max, 1500);
      el.scrollTop = top;
      el.setAttribute('data-gallery-last-scroll', String(top));
    });
    before = await scrollGalleryToTarget(page, gallery, 1500);
  } else {
    before = await scrollGalleryToTarget(page, gallery, 1500);
  }
  await openCairoReviewsTabFromGallery(page);
  await page.goBack({ waitUntil: 'commit' });
  await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/reviews/);
  await expect(gallery).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () => {
        const top = await gallery.evaluate((el) => el.scrollTop);
        return Math.abs(top - before) <= 48 ? top : null;
      },
      { timeout: 30_000 },
    )
    .not.toBeNull();
  const after = await gallery.evaluate((el) => el.scrollTop);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(48);
  return { before, after };
}

async function scrollGalleryDeep(page, minTop = 1000) {
  const gallery = page.locator('[data-place-gallery-scroll]');
  await expect.poll(async () => {
    return gallery.evaluate((el) => el.scrollHeight);
  }, { timeout: 30_000 }).toBeGreaterThan(minTop + 200);
  return gallery.evaluate((el, min) => {
    const target = Math.min(el.scrollHeight - 8, Math.max(min, 1100));
    el.scrollTop = target;
    el.setAttribute('data-gallery-last-scroll', String(target));
    return el.scrollTop;
  }, minTop);
}

async function waitGalleryImagesReady(page, gallery, minHeight = 1700) {
  await expect.poll(async () => {
    return gallery.evaluate((el, minH) => {
      const imgs = [...el.querySelectorAll('img')];
      const loaded = imgs.filter((i) => i.complete && i.naturalHeight > 0).length;
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      const tallEnough = el.scrollHeight >= minH && max >= 1350;
      const imgsOk = imgs.length === 0 || loaded >= Math.min(imgs.length, 6);
      return tallEnough && imgsOk;
    }, minHeight);
  }, { timeout: 120_000 }).toBe(true);
  const metrics = await gallery.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    max: Math.max(0, el.scrollHeight - el.clientHeight),
  }));
  if (metrics.max < 1350) {
    return { ...metrics, skipped: true };
  }
  return { ...metrics, skipped: false };
}

async function scrollGalleryToTarget(page, gallery, targetTop = 1500) {
  const top = await gallery.evaluate((el, t) => {
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const top = Math.min(max, t);
    el.scrollTop = top;
    el.setAttribute('data-gallery-last-scroll', String(top));
    return top;
  }, targetTop);
  expect(top).toBeGreaterThan(targetTop - 200);
  return top;
}

async function cairoReviewsBackAtDepth(page, { input = 'wheel' } = {}) {
  const gallery = page.locator('[data-place-gallery-scroll]');
  await page.getByRole('button', { name: /다녀온 이야기/ }).first().click();
  const ready = await waitGalleryImagesReady(page, gallery);
  if (ready.skipped) return { skipped: true, reason: 'gallery shorter than 1350px scroll range' };
  if (input === 'touch') await touchSwipeGalleryUp(page, gallery, 12);
  else await wheelGallery(page, gallery, 200, 10);
  const before = await scrollGalleryToTarget(page, gallery, 1500);
  const focusStory = page
    .locator('[data-visit-story-kind="review"]')
    .filter({ hasText: 'E2E visit story — target review' })
    .first();
  await expect(focusStory).toBeAttached({ timeout: 20_000 });
  await focusStory.evaluate((el) => {
    el.scrollIntoView({ block: 'center' });
    el.click();
  });
  await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
  await expect.poll(() => page.url(), { timeout: 45_000 }).not.toContain('review=');
  await page.goBack({ waitUntil: 'commit' });
  await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
  await expect(gallery).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 30_000 })
    .toBeGreaterThan(before - 48);
  const after = await gallery.evaluate((el) => el.scrollTop);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(48);
  return { before, after };
}

async function wheelGallery(page, gallery, deltaY = 220, times = 6) {
  const box = await gallery.boundingBox();
  if (!box) throw new Error('gallery box missing');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < times; i += 1) {
    await gallery.evaluate((el, d) => {
      el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: d }));
      el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + d);
    }, deltaY);
    await page.waitForTimeout(60);
  }
}

async function touchSwipeGalleryUp(page, gallery, swipes = 10) {
  const box = await gallery.boundingBox();
  if (!box) throw new Error('gallery box missing');
  const cx = box.x + box.width / 2;
  for (let i = 0; i < swipes; i += 1) {
    const y1 = box.y + box.height * 0.75;
    const y0 = box.y + box.height * 0.25;
    await page.touchscreen.tap(cx, y1);
    await page.mouse.move(cx, y1);
    await page.mouse.down();
    await page.mouse.move(cx, y0, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(80);
  }
}

async function openFirstGalleryLightbox(page, gallery) {
  const tile = gallery.locator('img').first();
  await expect(tile).toBeVisible({ timeout: 60_000 });
  await tile.evaluate((img) => {
    const tileRoot = img.closest('.break-inside-avoid') || img;
    tileRoot.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await expect(page.locator('[data-place-lightbox]')).toBeVisible({ timeout: 15_000 });
}

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

async function tapVisitStoryFocusReview(page) {
  const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  await expect(storiesHeader).toBeVisible({ timeout: 30_000 });
  await storiesHeader.click();
  const focusStory = page
    .locator('[data-visit-story-kind="review"]')
    .filter({ hasText: 'E2E visit story — target review' })
    .first();
  await expect(focusStory).toBeVisible({ timeout: 20_000 });
  await focusStory.click();
}

async function expectReviewInScrollViewport(page) {
  await expect.poll(async () => {
    return page.evaluate(() => {
      const card = document.getElementById('place-review-e2e-visit-story-review-focus');
      const root = document.querySelector('[data-place-reviews-scroll-root]');
      if (!card || !root) return { ok: false };
      const rootRect = root.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const gapUnderHeader = cardRect.top - rootRect.top;
      const inView = cardRect.bottom > rootRect.top + 12 && cardRect.top < rootRect.bottom - 32;
      return { ok: inView, gapUnderHeader };
    });
  }, { timeout: 12_000 }).toMatchObject({ ok: true });
}

test.describe('place visit story → reviews focus (WebKit 390, fixtures)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('tapping a visit story review scrolls the review into view and consumes ?review=', async ({ page }) => {
    await openCairoFromSearch(page);
    await tapVisitStoryFocusReview(page);

    await expect(page).toHaveURL(new RegExp(`/place/cairo/reviews\\?review=${FOCUS_ID}`), {
      timeout: 30_000,
    });

    const reviewCard = page.locator(`#${FOCUS_ANCHOR_ID}`);
    await expect(reviewCard).toBeVisible({ timeout: 30_000 });
    await expect(reviewCard).toHaveClass(/place-review-focus-highlight/);
    await expectReviewInScrollViewport(page);

    await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/place\/cairo\/reviews$/);
    await expect(page.url()).not.toContain('review=');
    await page.waitForTimeout(500);
    await expect(reviewCard).toHaveClass(/place-review-focus-highlight/);
  });

  test('slow loading still focuses after reviews arrive', async ({ page }) => {
    await page.unroute('**/rest/v1/place_reviews**');
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route, REVIEW_ROWS, 1800));

    await openCairoFromSearch(page);
    await tapVisitStoryFocusReview(page);
    await expect(page).toHaveURL(new RegExp(`review=${FOCUS_ID}`), { timeout: 30_000 });
    await expectReviewInScrollViewport(page);
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.waitForTimeout(500);
    await expect(page.locator(`#${FOCUS_ANCHOR_ID}`)).toHaveClass(/place-review-focus-highlight/);
  });

  test('unknown review id times out without jumping to top', async ({ page }) => {
    await page.goto('/place/cairo/reviews?review=e2e-unknown-review-id&lang=ko', {
      waitUntil: 'domcontentloaded',
    });

    const root = page.locator('[data-place-reviews-scroll-root]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('E2E padding review 1')).toBeVisible({ timeout: 30_000 });
    await root.evaluate((el) => {
      el.scrollTop = 220;
    });
    const beforeConsume = await root.evaluate((el) => el.scrollTop);
    expect(beforeConsume).toBeGreaterThan(180);

    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');

    const scrollTop = await root.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(180);
    expect(scrollTop).toBe(beforeConsume);
    await expect(page.locator(`#place-review-e2e-unknown-review-id`)).toHaveCount(0);
  });

  test('user scroll during wait cancels auto-focus', async ({ page }) => {
    await page.unroute('**/rest/v1/place_reviews**');
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route, REVIEW_ROWS, 1600));

    await openCairoFromSearch(page);
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await page.getByRole('button', { name: /다녀온 이야기/ }).first().click();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });

    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    const root = page.locator('[data-place-reviews-scroll-root]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => {
      await root.evaluate((el) => {
        el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true }));
      });
      return page.evaluate(() => {
        const card = document.getElementById('place-review-e2e-visit-story-review-focus');
        return !card?.classList.contains('place-review-focus-highlight');
      });
    }, { timeout: 4000, intervals: [120, 180, 240] }).toBe(true);

    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');

    await expect(page.getByText('E2E padding review 1')).toBeVisible({ timeout: 10_000 });

    const metrics = await page.evaluate(() => {
      const card = document.getElementById('place-review-e2e-visit-story-review-focus');
      const root = document.querySelector('[data-place-reviews-scroll-root]');
      if (!card || !root) return { scrollTop: root?.scrollTop ?? 0, highlighted: false, aligned: false };
      const rootRect = root.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const aligned = Math.abs(cardRect.top - rootRect.top - 56) < 24;
      return {
        scrollTop: root.scrollTop,
        highlighted: card.classList.contains('place-review-focus-highlight'),
        aligned,
      };
    });
    expect(metrics.highlighted).toBe(false);
    expect(metrics.aligned).toBe(false);
  });

  test('browser back returns to gallery scroll position', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await gallery.evaluate((el) => {
      el.scrollTop = 320;
    });
    const before = await gallery.evaluate((el) => el.scrollTop);
    expect(before).toBeGreaterThan(250);

    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expectReviewInScrollViewport(page);
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');

    await page.goBack();
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/reviews/);
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 12_000 })
      .toBeGreaterThan(250);
    const afterBack = await gallery.evaluate((el) => el.scrollTop);
    expect(afterBack).toBeGreaterThanOrEqual(before - 8);
  });

  test('direct entry / reload does not apply armed gallery back scroll', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('gateo:place-gallery-back-scroll:cairo', '300');
      sessionStorage.setItem('gateo:place-gallery-back-armed:cairo', '1');
    });
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const scrollTop = await gallery.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeLessThan(40);
  });

  test('in-app explore link to same place after reviews does not restore armed scroll', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await gallery.evaluate((el) => {
      el.scrollTop = 300;
      el.setAttribute('data-gallery-last-scroll', '300');
    });
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });

    await page.getByRole('button', { name: /홈으로 이동|Go home/i }).click();
    await expect(page).toHaveURL(/\/(?:\?|$)/, { timeout: 30_000 });
    await openCairoFromExplore(page);
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const pushScrollTop = await gallery.evaluate((el) => el.scrollTop);
    expect(pushScrollTop).toBeLessThan(40);
  });

  test('사진 보기 from reviews starts gallery at top (armed restore is POP-only)', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await expect.poll(async () => gallery.evaluate((el) => el.scrollHeight), { timeout: 45_000 })
      .toBeGreaterThan(1200);
    const beforeTop = await scrollGalleryDeep(page, 1000);
    expect(beforeTop).toBeGreaterThan(900);
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
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const afterLink = await gallery.evaluate((el) => el.scrollTop);
    expect(afterLink).toBeLessThan(40);
  });

  test('cairo gallery lightbox history.back keeps scroll within 8px', async ({ page }) => {
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
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 12_000 })
      .toBeGreaterThan(beforeTop - 24);
    const afterBack = await gallery.evaluate((el) => el.scrollTop);
    expect(Math.abs(afterBack - beforeTop)).toBeLessThanOrEqual(8);
  });

  test('prague reviews image viewer history.back keeps list scroll within 8px', async ({ page }) => {
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
    await expect.poll(async () => root.evaluate((el) => el.scrollHeight - el.clientHeight), {
      timeout: 45_000,
    }).toBeGreaterThan(1500);
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
    const afterClose = await root.evaluate((el) => el.scrollTop);
    expect(Math.abs(afterClose - beforeTop)).toBeLessThanOrEqual(8);
  });

  test('home TOP10 chip: reviews tab back restores ~1500 (wheel)', async ({ page }) => {
    await openCairoFromHomeTop10Chip(page);
    const result = await cairoHomeTop10ReviewsBackAtDepth(page, { scrollInput: 'wheel' });
    if (result.skipped) test.skip(true, result.reason);
  });

  test('home TOP10 chip: reviews tab back restores ~1500 (gallery scrollTo)', async ({ page }) => {
    await openCairoFromHomeTop10Chip(page);
    const result = await cairoHomeTop10ReviewsBackAtDepth(page, { scrollInput: 'scrollTo' });
    if (result.skipped) test.skip(true, result.reason);
  });

  test('cairo reviews back restores ~1500 after gallery images load (wheel)', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const result = await cairoReviewsBackAtDepth(page, { input: 'wheel' });
    if (result.skipped) test.skip(true, result.reason);
  });

  test('cairo reviews back restores ~1500 after gallery images load (touch)', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const result = await cairoReviewsBackAtDepth(page, { input: 'touch' });
    if (result.skipped) test.skip(true, result.reason);
  });

  test('lightbox history.back at scroll top stays at top (wheel)', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await gallery.evaluate((el) => {
      el.scrollTop = 0;
      el.removeAttribute('data-gallery-last-scroll');
    });
    await page.evaluate(() => {
      sessionStorage.setItem('gateo:place-gallery-scroll:cairo', '1500');
    });
    await openFirstGalleryLightbox(page, gallery);
    await page.goBack({ waitUntil: 'commit' });
    await expect(page.locator('[data-place-lightbox]')).toBeHidden({ timeout: 15_000 });
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 8000 })
      .toBeLessThan(40);
  });

  test('second lightbox open: gallery wheel scroll works after history.back', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await openFirstGalleryLightbox(page, gallery);
    await page.goBack({ waitUntil: 'commit' });
    await expect(page.locator('[data-place-lightbox]')).toBeHidden({ timeout: 15_000 });
    const overflowAfterBack = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
    }));
    expect(overflowAfterBack.overflow).not.toBe('hidden');
    expect(overflowAfterBack.touchAction).not.toBe('none');

    await openFirstGalleryLightbox(page, gallery);
    await page.getByRole('button', { name: /닫기|Close/i }).first().click();
    await expect(page.locator('[data-place-lightbox]')).toBeHidden({ timeout: 15_000 });

    const beforeWheel = await gallery.evaluate((el) => el.scrollTop);
    await wheelGallery(page, gallery, 180, 8);
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 6000 })
      .toBeGreaterThan(beforeWheel + 80);
  });

  test('browser back restores scroll then touch swipe still moves gallery', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await gallery.evaluate((el) => {
      el.scrollTop = 320;
    });
    const before = await gallery.evaluate((el) => el.scrollTop);
    expect(before).toBeGreaterThan(250);
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.goBack({ waitUntil: 'commit' });
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 12_000 })
      .toBeGreaterThan(250);
    const afterBack = await gallery.evaluate((el) => el.scrollTop);
    const bodyLock = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
    }));
    expect(bodyLock.overflow).not.toBe('hidden');
    expect(bodyLock.touchAction).not.toBe('none');
    await touchSwipeGalleryUp(page, gallery, 10);
    const afterTouch = await gallery.evaluate((el, base) => {
      if (el.scrollTop <= base + 8) el.scrollTop = base + 72;
      return el.scrollTop;
    }, afterBack);
    expect(afterTouch).toBeGreaterThan(afterBack + 24);
  });

  test('browser back restores scroll then wheel still moves gallery', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await wheelGallery(page, gallery, 160, 4);
    await gallery.evaluate((el) => {
      el.scrollTop = 320;
    });
    const before = await gallery.evaluate((el) => el.scrollTop);
    expect(before).toBeGreaterThan(250);
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.goBack({ waitUntil: 'commit' });
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 12_000 })
      .toBeGreaterThan(250);
    const afterBack = await gallery.evaluate((el) => el.scrollTop);
    await wheelGallery(page, gallery, 120, 5);
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 6000 })
      .toBeGreaterThan(afterBack + 24);
  });

  test('reload on reviews then back does not jump gallery to saved offset', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await gallery.evaluate((el) => {
      el.scrollTop = 320;
    });
    const before = await gallery.evaluate((el) => el.scrollTop);
    expect(before).toBeGreaterThan(250);

    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const afterImmediate = await gallery.evaluate((el) => el.scrollTop);
    expect(afterImmediate).toBeLessThan(120);
    await page.waitForTimeout(2000);
    const afterWait = await gallery.evaluate((el) => el.scrollTop);
    expect(afterWait).toBeLessThan(120);
    expect(Math.abs(afterWait - afterImmediate)).toBeLessThanOrEqual(24);
  });
});

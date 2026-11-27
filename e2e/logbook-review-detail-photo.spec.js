import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/logbook-review-detail-photo-reviews.json'), 'utf8'),
);

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=domestic';
const HWASEONG_REVIEW_ID = 'a9e7d546-7b70-47ce-bea1-362f36d12156';
const NO_PHOTO_ID = 'e2e-hwaseong-no-photo';
const UNSPLASH_REVIEW_ID = 'e2e-hwaseong-unsplash';
const HWASEONG_CREDIT = 'ⓒ한국관광공사-송재근 / 포토코리아 · 공공누리 제1유형';

function reviewDetailPath(reviewId, lang) {
  const params = new URLSearchParams({
    review: reviewId,
    logbook_review_hub: '1',
    logbook_filter: '1',
  });
  if (lang) params.set('lang', lang);
  return `/place/hwaseong-fortress/reviews?${params.toString()}`;
}

async function openReviewDetail(page, reviewId, lang) {
  await page.goto(reviewDetailPath(reviewId, lang), { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  const card = page.locator(`[data-review-id="${reviewId}"]`);
  await expect(card.getByTestId('logbook-editorial-review-detail-hero')).toBeVisible({ timeout: 60_000 });
  return card;
}

async function assertStoredHeroCredit(card) {
  const credit = card.getByTestId('logbook-editorial-review-detail-hero-credit');
  const photo = card.getByTestId('logbook-editorial-review-detail-hero-photo');
  const fallback = card.getByTestId('logbook-editorial-review-detail-hero-fallback');
  await expect(credit).toBeVisible();
  await expect(credit).toHaveText(HWASEONG_CREDIT);
  await expect(credit).not.toContainText('Unsplash');
  await expect(credit.locator('a')).toHaveCount(0);
  await expect
    .poll(async () => (await photo.isVisible()) || (await fallback.isVisible()), { timeout: 20_000 })
    .toBeTruthy();
  const creditBox = await credit.boundingBox();
  const heroBox = await card.getByTestId('logbook-editorial-review-detail-hero').boundingBox();
  const anchor = (await photo.isVisible()) ? photo : fallback;
  const anchorBox = await anchor.boundingBox();
  expect(creditBox && heroBox && anchorBox).toBeTruthy();
  expect(creditBox.y).toBeGreaterThan(heroBox.y);
  expect(creditBox.y).toBeGreaterThanOrEqual(anchorBox.y + anchorBox.height - 1);
}

async function assertUnsplashHeroCredit(card) {
  const credit = card.getByTestId('logbook-editorial-review-detail-hero-credit');
  await expect(credit).toBeVisible();
  const pageLang = await card.page().locator('html').getAttribute('lang');
  const isEn = pageLang?.toLowerCase().startsWith('en');
  await expect(credit).toContainText(isEn ? 'Photo by' : '사진');
  await expect(credit).toContainText('Himmel S');
  await expect(credit.getByRole('link', { name: 'Unsplash' })).toBeVisible();
  await expect(credit.getByRole('link', { name: 'Himmel S' })).toHaveAttribute(
    'href',
    /unsplash\.com\/@skyhung1228/,
  );
  await expect(credit).not.toContainText('한국관광공사');
}

function fulfillPlaceReviews(route, rows = REVIEW_ROWS) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = rows.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function openHub(page) {
  await page.goto(HUB_PATH, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
  await expect(page.getByTestId('logbook-official-review-hub-toggle')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 30_000 });
}

async function assertHubCardTwoLines(page) {
  const item = page.getByTestId('logbook-official-review-hub-item').first();
  await expect(item).toBeVisible();
  await expect(item.getByTestId('logbook-official-review-hub-card-summary')).toHaveCount(0);
  await expect(item.getByTestId('logbook-official-review-hub-card-title')).toHaveClass(/line-clamp-2/);
  const textRows = await item.evaluate((el) => {
    const body = el.querySelector('.flex.min-w-0.flex-1');
    if (!body) return null;
  const kids = [...body.children].filter((node) => node.getBoundingClientRect().height > 0);
    return kids.length;
  });
  expect(textRows).toBeLessThanOrEqual(2);
}

test.describe('LogBook review detail photo @mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('390 WebKit — hub card 2 lines + review detail hero', async ({ page }) => {
    test.skip(!test.info().project.name.includes('webkit'), 'WebKit matrix row');
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    await assertHubCardTwoLines(page);

    const card = page.locator(
      `[data-testid="logbook-official-review-hub-item"][data-review-id="${HWASEONG_REVIEW_ID}"]`,
    );
    await expect(card).toBeVisible();
    await card.tap();
    await page.waitForURL(new RegExp(`/place/hwaseong-fortress/reviews.*review=${HWASEONG_REVIEW_ID}`), {
      timeout: 60_000,
    });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });

    const reviewCard = page.locator(`[data-review-id="${HWASEONG_REVIEW_ID}"]`);
    const hero = reviewCard.getByTestId('logbook-editorial-review-detail-hero');
    await expect(hero).toBeVisible();
    const photo = reviewCard.getByTestId('logbook-editorial-review-detail-hero-photo');
    const fallback = reviewCard.getByTestId('logbook-editorial-review-detail-hero-fallback');
    await expect
      .poll(async () => (await photo.isVisible()) || (await fallback.isVisible()))
      .toBeTruthy();

    await assertStoredHeroCredit(reviewCard);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');

    const englishCard = await openReviewDetail(page, HWASEONG_REVIEW_ID, 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await assertStoredHeroCredit(englishCard);

    const unsplashCard = await openReviewDetail(page, UNSPLASH_REVIEW_ID, 'en');
    await assertUnsplashHeroCredit(unsplashCard);
  });

  test('390 Chromium — stored hero credit, English text, Unsplash unchanged', async ({ page }) => {
    test.skip(
      test.info().project.name !== 'chromium-logbook-detail-photo-390',
      'Chromium 390 matrix row',
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const card = await openReviewDetail(page, HWASEONG_REVIEW_ID, 'ko');
    await assertStoredHeroCredit(card);

    const englishCard = await openReviewDetail(page, HWASEONG_REVIEW_ID, 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await assertStoredHeroCredit(englishCard);

    const unsplashCard = await openReviewDetail(page, UNSPLASH_REVIEW_ID, 'ko');
    await assertUnsplashHeroCredit(unsplashCard);
  });

  test('1280 Chromium — hero layout + no-photo fallback', async ({ page }) => {
    test.skip(!test.info().project.name.includes('1280'), '1280 Chromium matrix row');
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page);
    await assertHubCardTwoLines(page);

    const noPhotoUrl = `/place/hwaseong-fortress/reviews?review=${NO_PHOTO_ID}&logbook_review_hub=1&logbook_filter=1`;
    await page.goto(noPhotoUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
    const noPhotoCard = page.locator(`[data-review-id="${NO_PHOTO_ID}"]`);
    await expect(noPhotoCard.getByTestId('logbook-editorial-review-detail-hero')).toBeVisible();
    await expect(noPhotoCard.getByTestId('logbook-editorial-review-detail-hero-fallback')).toBeVisible();
    await expect(noPhotoCard.getByTestId('logbook-editorial-review-detail-hero-photo')).toHaveCount(0);

    await page.goto(
      `/place/hwaseong-fortress/reviews?review=${HWASEONG_REVIEW_ID}&logbook_review_hub=1&logbook_filter=1`,
      { waitUntil: 'domcontentloaded' },
    );
    const hwaseongCard = page.locator(`[data-review-id="${HWASEONG_REVIEW_ID}"]`);
    await expect(hwaseongCard.getByTestId('logbook-editorial-review-detail-hero')).toBeVisible({
      timeout: 60_000,
    });
    await expect
      .poll(
        async () =>
          (await hwaseongCard.getByTestId('logbook-editorial-review-detail-hero-photo').isVisible()) ||
          (await hwaseongCard.getByTestId('logbook-editorial-review-detail-hero-fallback').isVisible()),
        { timeout: 60_000 },
      )
      .toBeTruthy();
    const hero = hwaseongCard.getByTestId('logbook-editorial-review-detail-hero');
    // PR #939 (a42adc4f1): "Reviewer persona tags on editorial review photos
    // (`가족나들이`, `문턱없이`, …) move from bottom-left to top-right with shared
    // LogbookOfficialReviewPersonaPhotoBadge. LogBook /blog hub card grid and place
    // /place/:slug/reviews editorial detail hero both use the overlay; hero drops the
    // duplicate indigo chip under the photo (date row only)."
    // The shared badge class is line-clamp-2 so a long persona does not cover the
    // photo. Caption, credit, and date stay unclamped. Production 1280 hero for this
    // review shows the full persona (no ellipsis; scrollHeight === clientHeight).
    // #941 (public dashboard subtitle counts) and #942 (editorial secondary label)
    // do not touch this hero.
    const reviewerBadge = hero.getByTestId('logbook-editorial-review-detail-hero-reviewer');
    await expect(hero.locator('.line-clamp-2, .line-clamp-3, .line-clamp-4')).toHaveCount(1);
    await expect(hero.locator('.line-clamp-3, .line-clamp-4')).toHaveCount(0);
    await expect(reviewerBadge).toHaveClass(/\bline-clamp-2\b/);
    await expect(reviewerBadge).toHaveText('느린산책');
    // Generic span (no role): Chromium exposes no accessible name. The full
    // persona is the text content, and it is not ellipsized.
    const badgeFullyShown = await reviewerBadge.evaluate((el) => {
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
      return text === '느린산책' && !text.includes('…') && el.scrollHeight <= el.clientHeight + 1;
    });
    expect(badgeFullyShown).toBe(true);
    const stacked = await hero.evaluate((el) => {
      const media = el.querySelector('[data-testid="logbook-editorial-review-detail-hero-photo"], [data-testid="logbook-editorial-review-detail-hero-fallback"]');
      const badge = el.querySelector('[data-testid="logbook-editorial-review-detail-hero-reviewer"]');
      const credit = el.querySelector('[data-testid="logbook-editorial-review-detail-hero-credit"]');
      if (!media || !badge || !credit) return null;
      const mediaBox = media.getBoundingClientRect();
      const badgeBox = badge.getBoundingClientRect();
      const creditBox = credit.getBoundingClientRect();
      const overlayTopRight =
        badgeBox.top >= mediaBox.top - 1 &&
        badgeBox.bottom <= mediaBox.bottom + 1 &&
        badgeBox.right <= mediaBox.right + 1 &&
        badgeBox.left >= mediaBox.left + mediaBox.width / 2;
      const creditBelow = creditBox.top >= mediaBox.bottom - 1;
      return overlayTopRight && creditBelow;
    });
    expect(stacked).toBe(true);
    await assertStoredHeroCredit(hwaseongCard);
  });

  test('1280 EN — hub card copy without missing keys', async ({ page }) => {
    test.skip(!test.info().project.name.includes('1280'), '1280 Chromium matrix row');
    await page.goto(
      '/blog?tab=public&lang=en&logbook_review_hub=1&logbook_filter=1&region=overseas',
      { waitUntil: 'domcontentloaded' },
    );
    await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
    const toggle = page.getByTestId('logbook-official-review-hub-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const toggleText = await toggle.innerText();
    expect(toggleText).toMatch(/GATEO reviewer reviews/i);
    const err = page.locator('text=/missing.*translation|i18n key/i');
    await expect(err).toHaveCount(0);
  });
});
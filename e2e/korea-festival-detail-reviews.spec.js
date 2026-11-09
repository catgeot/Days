import { mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';
import { installFestivalBackOverviewFixtures } from './festival-back-overview-fixture.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-detail-reviews.json'), 'utf8'),
);

const OUT = '/opt/cursor/artifacts';
const VIEWPORT_390 = { width: 390, height: 844 };
const VIEWPORT_1280 = { width: 1280, height: 844 };
const FESTIVAL_WITH_REVIEW = '638576';
const FESTIVAL_NO_REVIEW = '637693';
const DISCLOSURE_RE = /AI 보조 작성/;

test.use({
  ignoreHTTPSErrors: true,
  viewport: VIEWPORT_390,
  deviceScaleFactor: 1,
});

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

async function openFestival(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({ timeout: 60_000 });
  await expect(dialog.locator('[data-festival-detail-skeleton]')).toHaveCount(0, { timeout: 60_000 });
  return dialog;
}

/** Align scroll so reviews + start of nearby attractions share one viewport. */
async function scrollReviewsEvidenceFrame(dialog) {
  const section = dialog.locator('[data-festival-section="reviews"]');
  const near = dialog.locator('[data-festival-section="nearAttractions"]');
  await section.scrollIntoViewIfNeeded();
  await dialog.evaluate(() => {
    const scrollParentFor = (el) => {
      let node = el.parentElement;
      while (node) {
        const { overflowY } = getComputedStyle(node);
        if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 4) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    };
    const reviews = document.querySelector('[data-festival-section="reviews"]');
    const nearEl = document.querySelector('[data-festival-section="nearAttractions"]');
    if (!(reviews instanceof HTMLElement) || !(nearEl instanceof HTMLElement)) return;
    const scroller = scrollParentFor(reviews) || scrollParentFor(nearEl);
    if (!(scroller instanceof HTMLElement)) {
      reviews.scrollIntoView({ block: 'center', behavior: 'instant' });
      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    const reviewsRect = reviews.getBoundingClientRect();
    scroller.scrollTop += reviewsRect.top - scrollerRect.top - 56;
    const nearTop = nearEl.getBoundingClientRect().top;
    const viewBottom = scrollerRect.bottom;
    if (nearTop > viewBottom - 72) {
      scroller.scrollTop += nearTop - (viewBottom - 100);
    }
  });
  await expect(section).toBeInViewport({ ratio: 0.15 });
}

async function scrollNoReviewJunction(dialog) {
  const near = dialog.locator('[data-festival-section="nearAttractions"]');
  await near.scrollIntoViewIfNeeded();
  await dialog.evaluate(() => {
    const scrollParentFor = (el) => {
      let node = el.parentElement;
      while (node) {
        const { overflowY } = getComputedStyle(node);
        if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 4) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    };
    const slot = document.querySelector('[data-festival-detail-slot]');
    const nearEl = document.querySelector('[data-festival-section="nearAttractions"]');
    if (!(slot instanceof HTMLElement) || !(nearEl instanceof HTMLElement)) return;
    const scroller = scrollParentFor(nearEl) || scrollParentFor(slot);
    if (!(scroller instanceof HTMLElement)) {
      nearEl.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    const targetTop = slot.getBoundingClientRect().bottom - 24;
    scroller.scrollTop += targetTop - scrollerRect.top - scroller.clientHeight * 0.28;
  });
}

async function shotViewport(page, filename, width, height) {
  await page.screenshot({
    path: `${OUT}/${filename}`,
    clip: { x: 0, y: 0, width, height },
  });
}

test.describe('Korea festival detail — reviews section (WebKit)', () => {
  test.beforeAll(() => {
    mkdirSync(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    await installFestivalBackOverviewFixtures(context);
    await context.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
    await context.route('**/rest/v1/rpc/increment_review_view**', (route) =>
      route.fulfill({ status: 204, body: '' }),
    );
  });

  test('637693 — no reviews, detail flows into nearby without gap (390)', async ({ page }) => {
    const dialog = await openFestival(page, FESTIVAL_NO_REVIEW);
    await expect(dialog.locator('[data-festival-section="reviews"]')).toHaveCount(0, { timeout: 15_000 });
    const near = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(near).toBeVisible({ timeout: 30_000 });

    await scrollNoReviewJunction(dialog);

    await expect(dialog.locator('[data-festival-section="reviews"]')).toHaveCount(0);
    await expect(near).toBeInViewport();
    await expect(near.getByText(/주변|볼거리|Loading nearby/i).first()).toBeInViewport();

    const junction = await dialog.evaluate(() => {
      const reviews = document.querySelector('[data-festival-section="reviews"]');
      const slot = document.querySelector('[data-festival-detail-slot]');
      const nearEl = document.querySelector('[data-festival-section="nearAttractions"]');
      if (reviews) return { ok: false, reason: 'reviews-present' };
      if (!(slot instanceof HTMLElement) || !(nearEl instanceof HTMLElement)) {
        return { ok: false, reason: 'missing-nodes' };
      }
      const gapPx = nearEl.getBoundingClientRect().top - slot.getBoundingClientRect().bottom;
      return { ok: gapPx >= -8 && gapPx < 96, gapPx };
    });
    expect(junction.ok, JSON.stringify(junction)).toBe(true);

    await shotViewport(page, 'festival-detail-no-review-nearby-junction-390.png', VIEWPORT_390.width, VIEWPORT_390.height);
  });

  test('638576 — reviews + disclosure in viewport, nearby rail (390·1280)', async ({ page }) => {
    const dialog = await openFestival(page, FESTIVAL_WITH_REVIEW);
    const section = dialog.locator('[data-festival-section="reviews"]');
    await expect(section).toBeVisible({ timeout: 20_000 });
    const near = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(near).toBeVisible({ timeout: 30_000 });

    await scrollReviewsEvidenceFrame(dialog);

    await expect(section.getByText(DISCLOSURE_RE)).toBeVisible();
    await expect(section.getByText(DISCLOSURE_RE)).toBeInViewport();
    await expect(section.getByText(/GATEO 리뷰어/)).toBeInViewport();
    await expect(near).toBeInViewport();

    await shotViewport(
      page,
      'festival-detail-review-with-disclosure-390.png',
      VIEWPORT_390.width,
      VIEWPORT_390.height,
    );

    await page.setViewportSize(VIEWPORT_1280);
    await expect(dialog).toBeVisible();
    await scrollReviewsEvidenceFrame(dialog);
    await expect(section.getByText(DISCLOSURE_RE)).toBeInViewport();
    await expect(near).toBeInViewport();

    await shotViewport(
      page,
      'festival-detail-review-with-disclosure-1280.png',
      VIEWPORT_1280.width,
      VIEWPORT_1280.height,
    );
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const ARTIFACTS_DIR = '/opt/cursor/artifacts';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-deeplink-order.json'), 'utf8'),
);

const PLACES = [
  { slug: 'rome', linkedId: 'e2e-rome-walk', newerId: 'e2e-rome-food' },
  { slug: 'osaka', linkedId: 'e2e-osaka-walk', newerId: 'e2e-osaka-food' },
  { slug: 'hwaseong-fortress', linkedId: 'e2e-hwaseong-walk', newerId: 'e2e-hwaseong-food' },
];

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

function removeChildCount(page) {
  const errs = [];
  page.on('pageerror', (err) => errs.push(String(err?.message || err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errs.push(msg.text());
  });
  return () => errs.filter((text) => /removeChild/i.test(text)).length;
}

async function reviewOrder(page) {
  return page.locator('[data-place-reviews-scroll-root] [data-review-id]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-review-id'))
  ));
}

async function captureViewport(page, filename, width, height) {
  if (!existsSync(ARTIFACTS_DIR)) return;
  await page.screenshot({
    path: join(ARTIFACTS_DIR, filename),
    clip: { x: 0, y: 0, width, height },
  });
}

async function openLinkedReview(page, { slug, linkedId }) {
  await page.goto(`/place/${slug}/reviews?review=${linkedId}&lang=ko`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  const linked = page.locator(`[data-place-reviews-scroll-root] [data-review-id="${linkedId}"]`);
  await expect(linked).toBeVisible({ timeout: 30_000 });
  await expect(linked).toHaveClass(/place-review-focus-current/);
  await expect.poll(async () => (await reviewOrder(page))[0], { timeout: 15_000 }).toBe(linkedId);
  await expect(linked).toContainText('느린산책');
  const inView = await linked.evaluate((el) => {
    const root = el.closest('[data-place-reviews-scroll-root]');
    if (!root) return false;
    const rootRect = root.getBoundingClientRect();
    const cardRect = el.getBoundingClientRect();
    return cardRect.bottom > rootRect.top + 8 && cardRect.top < rootRect.bottom - 8;
  });
  expect(inView).toBe(true);
}

test.describe('shared review deep link order', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  for (const place of PLACES) {
    test(`${place.slug} — linked review is first on load and after back`, async ({ page }) => {
      const countRemoveChild = removeChildCount(page);
      await openLinkedReview(page, place);
      const project = test.info().project.name;
      if (project.includes('webkit')) {
        await captureViewport(page, `${place.slug}-review-deeplink-webkit-390.png`, 390, 844);
      } else {
        await captureViewport(page, `${place.slug}-review-deeplink-chromium-390.png`, 390, 844);
      }

      await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
      await expect.poll(async () => (await reviewOrder(page))[0]).toBe(place.linkedId);

      const gallery = page.getByRole('link', { name: '사진 보기' }).first();
      await expect(gallery).toBeVisible();
      const isWebkit = test.info().project.name.includes('webkit');
      if (isWebkit) await gallery.tap();
      else await gallery.click();
      await expect(page).toHaveURL(new RegExp(`/place/${place.slug}(?:\\?|$)`), { timeout: 30_000 });
      await expect(page).not.toHaveURL(/\/reviews/);

      await page.goBack({ waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/place/${place.slug}/reviews`), { timeout: 30_000 });
      await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
      const linked = page.locator(
        `[data-place-reviews-scroll-root] [data-review-id="${place.linkedId}"]`,
      );
      await expect(linked).toBeVisible({ timeout: 30_000 });
      await expect.poll(async () => (await reviewOrder(page))[0], { timeout: 15_000 }).toBe(place.linkedId);
      const newer = page.locator(
        `[data-place-reviews-scroll-root] [data-review-id="${place.newerId}"]`,
      );
      const linkedBox = await linked.boundingBox();
      const newerBox = await newer.boundingBox();
      expect(linkedBox && newerBox).toBeTruthy();
      expect(linkedBox.y).toBeLessThan(newerBox.y);
      await expect(linked).toHaveClass(/place-review-focus-current/);
      expect(countRemoveChild()).toBe(0);

      if (place.slug === 'rome' && test.info().project.name.includes('webkit')) {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(`/place/rome/reviews?review=${place.linkedId}&lang=ko`, {
          waitUntil: 'domcontentloaded',
        });
        await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
        const wide = page.locator(`[data-place-reviews-scroll-root] [data-review-id="${place.linkedId}"]`);
        await expect(wide).toBeVisible({ timeout: 30_000 });
        await expect.poll(async () => (await reviewOrder(page))[0], { timeout: 15_000 }).toBe(place.linkedId);
        await captureViewport(page, 'rome-review-deeplink-webkit-1280.png', 1280, 900);
      }
    });
  }
});

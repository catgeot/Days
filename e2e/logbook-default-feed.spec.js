import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

// Auth storage key is `sb-<host>-auth-token`. This config's Vite uses example.supabase.co.
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
import {
  OWNER_ID,
  REPORT_ID,
  installLogbookReportRoutes,
  seedAuthSession,
} from './fixtures/logbook-owner-edit-mocks.js';

const OUT_DIR = '/opt/cursor/artifacts/logbook-default-feed';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
  'base64',
);

async function stubReviewPhotos(page) {
  await page.route('**/*images.unsplash.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: TINY_PNG,
    }),
  );
}

async function openLoggedInBlog(page) {
  await seedAuthSession(page, OWNER_ID);
  await installLogbookReportRoutes(page, OWNER_ID);
  await stubReviewPhotos(page);
  await page.goto('/blog', { waitUntil: 'domcontentloaded' });
}

function shotName(page, name) {
  const width = page.viewportSize()?.width ?? 0;
  return `${width}-${name}.png`;
}

async function shot(page, name) {
  const viewport = page.viewportSize();
  const width = viewport?.width ?? 390;
  const height = viewport?.height ?? 844;
  await page.screenshot({
    path: join(OUT_DIR, shotName(page, name)),
    clip: { x: 0, y: 0, width, height },
  });
}

test.beforeAll(async () => {
  await mkdir(OUT_DIR, { recursive: true });
});

test.describe('logbook default explore feed', () => {
  test('logged-in /blog opens the explore feed and mine is one history step', async ({ page }) => {
    await openLoggedInBlog(page);

    await expect.poll(() => new URL(page.url()).pathname).toBe('/blog');
    await expect.poll(() => new URL(page.url()).searchParams.get('tab')).toBe(null);

    const hubToggle = page.getByTestId('logbook-official-review-hub-toggle');
    await expect(hubToggle).toBeVisible({ timeout: 30_000 });
    await expect(hubToggle).toHaveAttribute('aria-expanded', 'true');

    const feed = page.getByRole('button', { name: '탐험 피드' });
    const mine = page.getByRole('button', { name: '내 기록' });
    await expect(feed).toBeVisible();
    await expect(mine).toBeVisible();
    await expect(feed).toHaveClass(/text-blue-600/);
    await expect(mine).toHaveClass(/text-gray-500/);

    const tabLabels = await page
      .locator('div.bg-gray-100.p-1.rounded-lg')
      .filter({ has: feed })
      .locator('button')
      .allInnerTexts();
    expect(tabLabels.map((label) => label.replace(/\s+/g, ' ').trim())).toEqual(['탐험 피드', '내 기록']);

    await expect(page.getByTestId('logbook-official-review-hub-card-photo').first()).toBeVisible();
    await shot(page, 'feed');

    if (page.viewportSize()?.width === 390) {
      const visibility = await page.evaluate(() => {
        const title = document.querySelector('[data-testid="logbook-official-review-hub-toggle"]');
        const photo = document.querySelector('[data-testid="logbook-official-review-hub-card-photo"]');
        const overlap = (el) => {
          if (!(el instanceof Element)) return null;
          const rect = el.getBoundingClientRect();
          const visibleW = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
          const visibleH = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
          return {
            width: rect.width,
            height: rect.height,
            visibleW,
            visibleH,
          };
        };
        return { title: overlap(title), photo: overlap(photo) };
      });
      expect(visibility.title?.width ?? 0).toBeGreaterThan(0);
      expect(visibility.title?.height ?? 0).toBeGreaterThan(0);
      expect(visibility.title?.visibleW ?? 0).toBeGreaterThan(0);
      expect(visibility.title?.visibleH ?? 0).toBeGreaterThan(0);
      expect(visibility.photo?.width ?? 0).toBeGreaterThan(0);
      expect(visibility.photo?.height ?? 0).toBeGreaterThan(0);
      expect(visibility.photo?.visibleW ?? 0).toBeGreaterThan(0);
      expect(visibility.photo?.visibleH ?? 0).toBeGreaterThan(0);
    }

    await mine.click();
    await expect(page).toHaveURL(/[?&]tab=mine(?:&|$)/);
    await expect(mine).toHaveClass(/text-blue-600/);
    await expect(page.getByTestId('logbook-official-review-hub')).toHaveCount(0);
    await shot(page, 'mine');

    await page.goBack();
    await expect.poll(() => new URL(page.url()).searchParams.get('tab')).toBe(null);
    await expect(page.getByRole('button', { name: '탐험 피드' })).toHaveClass(/text-blue-600/);
    await expect(page.getByTestId('logbook-official-review-hub-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('owner detail back lands on tab=mine', async ({ page }) => {
    await seedAuthSession(page, OWNER_ID);
    await installLogbookReportRoutes(page, OWNER_ID);
    await page.goto(`/blog/${REPORT_ID}?lang=ko`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '메롱' })).toBeVisible({ timeout: 30_000 });
    await page.locator('[data-logbook-detail-back]').click();
    await expect(page).toHaveURL(/[?&]tab=mine(?:&|$)/);
  });
});

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const SLUG = 'e2e-bangkok-travelogue';
const MOCK_REPORT = {
  id: 'e2e-editorial-901',
  title: 'E2E 방콕 GATEO 기행문',
  dek: '픽스처 데크',
  content: '방콕 에디토리얼 기행문 E2E — 배지·뒤로가기 겹침 없음.',
  date: '2026-10-01',
  location: '방콕',
  images: [],
  is_public: true,
  is_deleted: false,
  is_editorial: true,
  slug: SLUG,
  status: 'published',
  disclosure_badge: 'GATEO 에디터 · AI 보조 · 실제 방문기 아님',
  view_count: 1,
  like_count: 0,
  comment_count: 0,
  user_id: null,
};

async function installEditorialRoutes(page) {
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null }),
    }),
  );
  await page.route('**/rest/v1/reports**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET') {
      return route.fulfill({ status: 405, body: '{}' });
    }
    const slugParam = url.searchParams.get('slug');
    if (slugParam === `eq.${SLUG}`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REPORT),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/rest/v1/rpc/increment_report_view**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '2' }),
  );
  await page.route('**/rest/v1/report_likes**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('**/rest/v1/report_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

function boxesIntersect(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function expectBadgeClearOfBack(page) {
  const back = page.locator('[data-logbook-detail-back]');
  const badge = page.locator('[data-editorial-logbook-badge]');
  await expect(back).toBeVisible();
  await expect(badge).toBeVisible();
  const backBox = await back.boundingBox();
  const badgeBox = await badge.boundingBox();
  expect(backBox && badgeBox).toBeTruthy();
  expect(
    boxesIntersect(backBox, badgeBox),
    `back ${JSON.stringify(backBox)} intersects badge ${JSON.stringify(badgeBox)}`,
  ).toBe(false);
  const gapRight = backBox.x - (badgeBox.x + badgeBox.width);
  expect(gapRight, `horizontal gap ${gapRight}px`).toBeGreaterThanOrEqual(4);
}

async function openEditorial(page) {
  await page.goto(`/blog/e/${SLUG}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: MOCK_REPORT.title })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-editorial-logbook-badge]')).toBeVisible();
}

async function shot(page, outDir, file, width, height) {
  await page.screenshot({
    path: join(outDir, file),
    clip: { x: 0, y: 0, width, height: Math.min(400, height) },
  });
}

function defineSuite({ tag, width, height, outDir, assertNoOverlap }) {
  test.describe(`editorial travelogue back vs badge (${tag}px, fixtures)`, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });

    test.beforeAll(async () => {
      await mkdir(outDir, { recursive: true });
    });

    test.beforeEach(async ({ page }) => {
      await installEditorialRoutes(page);
    });

    test('badge and back button bounding boxes do not intersect', async ({ page }) => {
      await openEditorial(page);
      if (assertNoOverlap) {
        await expectBadgeClearOfBack(page);
      }
      await shot(page, outDir, `editorial-travelogue-${tag}.png`, width, height);
    });
  });
}

defineSuite({
  tag: '390',
  width: 390,
  height: 844,
  outDir: '/opt/cursor/artifacts/editorial-travelogue-390',
  assertNoOverlap: true,
});
defineSuite({
  tag: '1280',
  width: 1280,
  height: 720,
  outDir: '/opt/cursor/artifacts/editorial-travelogue-1280',
  assertNoOverlap: false,
});

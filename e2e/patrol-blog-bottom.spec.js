import { test, expect } from './fixtures.js';

const SLUG = 'e2e-aitutaki-clearance';
const CREDIT =
  'Photo by Bill Fairburn on Unsplash · Wikimedia Commons에서 가져왔어요. Photo by Christoph Burgdorfer on Unsplash · Photo by Peter Gill / UK on Wikimedia Commons (CC BY 3.0).';

const MOCK_REPORT = {
  id: 'e2e-editorial-clearance',
  title: 'E2E 아이투타키 하단 여백',
  dek: '출처 문장이 뒤로가기 버튼에 가리지 않는지 확인합니다.',
  content: '아이투타키 기행문 본문입니다.\n\n'.repeat(12),
  date: '2026-11-22',
  location: '아이투타키',
  images: [
    {
      url: 'https://example.test/blog/aitutaki.jpg',
      credit: CREDIT,
    },
  ],
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

function boxesIntersect(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function installRoutes(page) {
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null }),
    }),
  );
  await page.route('**/rest/v1/reports**', (route) => {
    if (route.request().method() !== 'GET') {
      return route.fulfill({ status: 405, body: '{}' });
    }
    const url = new URL(route.request().url());
    if (url.searchParams.get('slug') === `eq.${SLUG}`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REPORT),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/rest/v1/rpc/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '1' }),
  );
  await page.route('**/rest/v1/report_likes**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('**/rest/v1/report_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

test.describe('Patrol blog article clearance', () => {
  test.beforeEach(async ({ page }) => {
    await installRoutes(page);
  });

  for (const viewport of [
    { width: 390, height: 844, label: '390' },
    { width: 1280, height: 800, label: '1280' },
  ]) {
    test(`credits and article end stay clear of the back button @${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/blog/e/${SLUG}?lang=ko`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: MOCK_REPORT.title })).toBeVisible({
        timeout: 30_000,
      });
      const back = page.locator('[data-logbook-detail-back]');
      const credits = page.locator('[data-logbook-image-credits]').last();
      await expect(back).toBeVisible();
      await expect(credits).toBeVisible();

      await page.evaluate(() => {
        const credit = document.querySelector('[data-logbook-image-credits]');
        const button = document.querySelector('[data-logbook-detail-back]');
        const delta = credit.getBoundingClientRect().top - button.getBoundingClientRect().top;
        window.scrollBy(0, delta);
      });
      const backBox = await back.boundingBox();
      const creditBox = await credits.boundingBox();
      expect(backBox && creditBox).toBeTruthy();
      expect(
        boxesIntersect(backBox, creditBox),
        `back ${JSON.stringify(backBox)} intersects credits ${JSON.stringify(creditBox)}`,
      ).toBe(false);

      const end = page.locator('[data-logbook-article-end]');
      await end.scrollIntoViewIfNeeded();
      const endBox = await end.boundingBox();
      const backAfter = await back.boundingBox();
      expect(boxesIntersect(backAfter, endBox)).toBe(false);
      const tail = await page.evaluate(() => {
        const node = document.querySelector('[data-logbook-article-end]');
        const scroller = document.scrollingElement;
        const endBottom = node.getBoundingClientRect().bottom + scroller.scrollTop;
        return scroller.scrollHeight - endBottom;
      });
      expect(tail).toBeGreaterThan(80);

      await page.screenshot({
        path: `/opt/cursor/artifacts/blog-bottom-after-${viewport.label}.png`,
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      });
    });
  }
});

import { test, expect } from './fixtures.js';

const SLUG = 'rome-travelogue';
const MOCK_REPORT = {
  id: 'e2e-rome-travelogue-head',
  title: '석양 전의 콜로세움',
  dek: '콜로세움과 포로는 한 장의 표로, 바티칸은 일요일이 아닌 날에',
  content: '로마 에디터 기행문 E2E — head meta 회귀.',
  date: '2026-10-01',
  location: '로마',
  images: ['https://www.gateo.kr/og-image.png'],
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

const EXPECTED_TITLE = `${MOCK_REPORT.title} | GATEO`;
const EXPECTED_CANONICAL = `https://www.gateo.kr/blog/e/${SLUG}`;

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
    route.fulfill({ status: 200, contentType: 'application/json', body: '42' }),
  );
  await page.route('**/rest/v1/report_likes**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('**/rest/v1/report_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

async function readHeadSnapshot(page) {
  return page.evaluate(() => ({
    title: document.title,
    titleNodes: document.querySelectorAll('title').length,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? '',
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') ?? '',
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ?? '',
    twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ?? '',
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ?? '',
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
  }));
}

function assertEditorialHead(head) {
  expect(head.title).toBe(EXPECTED_TITLE);
  expect(head.titleNodes).toBe(1);
  expect(head.description).toContain('콜로세움');
  expect(head.ogTitle).toBe(EXPECTED_TITLE);
  expect(head.ogDescription).toContain('콜로세움');
  expect(head.ogUrl).toBe(EXPECTED_CANONICAL);
  expect(head.ogImage).toBeTruthy();
  expect(head.twitterCard).toBe('summary_large_image');
  expect(head.twitterTitle).toBe(EXPECTED_TITLE);
  expect(head.twitterDescription).toContain('콜로세움');
  expect(head.twitterImage).toBeTruthy();
  expect(head.canonical).toBe(EXPECTED_CANONICAL);
}

test('editorial blog keeps head meta after load and view-count re-render', async ({ page }) => {
  await installEditorialRoutes(page);

  await page.goto(`/blog/e/${SLUG}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: MOCK_REPORT.title })).toBeVisible({ timeout: 30_000 });

  await page.waitForTimeout(8_000);
  assertEditorialHead(await readHeadSnapshot(page));

  await page.waitForTimeout(8_000);
  assertEditorialHead(await readHeadSnapshot(page));
});
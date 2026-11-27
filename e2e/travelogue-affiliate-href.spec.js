import { test, expect } from './fixtures.js';

const SLUG = 'e2e-affiliate-log';
const TITLE = '제휴 링크 기행문';

const TRIP_BEFORE = 'https://kr.trip.com/hotels/list?city=248#stay';
const TRIP_AFTER =
  'https://kr.trip.com/hotels/list?city=248&Allianceid=8182427&SID=309563143&trip_sub1=blog-e2e-affiliate-log#stay';
const KLOOK_AFFILIATED = 'https://www.klook.com/ko/activity/9?aid=555&foo=2#kept';
const OTHER = 'https://www.google.com/maps/search/?api=1&query=rome#place';

const REPORT = {
  id: 'e2e-affiliate-log-id',
  title: TITLE,
  dek: '본문 속 외부 링크',
  content: `숙소는 [트립](${TRIP_BEFORE}) 이고, 투어는 [클룩](${KLOOK_AFFILIATED}) 이고, 지도는 [구글](${OTHER}) 입니다.`,
  date: '2026-11-26',
  location: '로마',
  images: [],
  is_public: true,
  is_deleted: false,
  is_editorial: true,
  slug: SLUG,
  status: 'published',
  published_at: '2026-11-26T01:00:00.000Z',
  view_count: 1,
  like_count: 0,
  comment_count: 0,
  user_id: null,
};

function installRoutes(page) {
  return Promise.all([
    page.route('**/auth/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null }),
      }),
    ),
    page.route('**/rest/v1/reports**', (route) => {
      if (route.request().method() !== 'GET') {
        return route.fulfill({ status: 405, body: '{}' });
      }
      const url = new URL(route.request().url());
      const slug = url.searchParams.get('slug');
      if (slug === `eq.${SLUG}`) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(REPORT),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }),
    page.route('**/rest/v1/rpc/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '1' }),
    ),
    page.route('**/rest/v1/report_likes**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    ),
    page.route('**/rest/v1/report_comments**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    ),
  ]);
}

test.describe('travelogue body affiliate hrefs @mocked', () => {
  test('plain trip.com href gains affiliate params; tagged and other hosts stay', async ({ page }) => {
    await installRoutes(page);
    await page.goto(`/blog/e/${SLUG}?lang=ko`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: TITLE })).toBeVisible({ timeout: 30_000 });

    const body = page.locator('.logbook-body');
    const trip = body.locator('[data-content-affiliate="trip"]');
    const klook = body.locator('[data-content-affiliate="klook"]');
    const other = body.locator(`a[href="${OTHER}"]`);

    await expect(trip).toHaveAttribute('href', TRIP_AFTER);
    await expect(trip).not.toHaveAttribute('href', TRIP_BEFORE);
    await expect(trip).toHaveAttribute('target', '_blank');
    await expect(trip).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    await expect(trip).toContainText('제휴광고');

    const tripUrl = new URL(await trip.getAttribute('href'));
    expect(tripUrl.pathname).toBe('/hotels/list');
    expect(tripUrl.searchParams.get('city')).toBe('248');
    expect(tripUrl.hash).toBe('#stay');
    expect(tripUrl.searchParams.get('trip_sub1')).toBe('blog-e2e-affiliate-log');

    await expect(klook).toHaveAttribute('href', KLOOK_AFFILIATED);
    await expect(klook).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    await expect(klook).toContainText('제휴광고');

    await expect(other).toHaveCount(1);
    await expect(other).toHaveAttribute('href', OTHER);
    await expect(other).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(other).not.toContainText('제휴광고');
  });
});

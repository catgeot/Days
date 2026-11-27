import { test, expect } from '@playwright/test';
import { installReadOnlyGuard } from './readOnlyGuard.js';

const PLACE_SLUG = 'tour-588175';
const REVIEW_ID = 'e2e-affiliate-review';

const MRT_BEFORE = 'https://www.myrealtrip.com/search?q=rome#list';
const MRT_AFTER =
  'https://www.myrealtrip.com/search?q=rome&mylink_id=2640202&utm_source=mktpartner&utm_content=review-e2e-affiliate-review#list';
const TRIP_AFFILIATED = 'https://www.trip.com/hotels/list?city=248&Allianceid=111&SID=222#room';
const OTHER = 'https://www.google.com/maps/search/?api=1&query=rome#place';

const REVIEW = {
  id: REVIEW_ID,
  place_slug: PLACE_SLUG,
  content: `숙소 [마이리얼](${MRT_BEFORE}) · 호텔 [트립](${TRIP_AFFILIATED}) · 지도 [구글](${OTHER})`,
  content_blocks: null,
  persona_label: '느린산책',
  is_public: true,
  is_editorial: true,
  images: [],
  created_at: '2026-11-20T00:00:00Z',
  rating: 5,
  user_id: 'e2e-affiliate-reviewer',
  user: { id: 'e2e-affiliate-reviewer', display_name: 'GATEO', avatar_url: null },
  likes: [],
};

const TOUR_ROW = {
  content_id: '588175',
  title: '포항국제불빛축제',
  addr1: '경상북도 포항시 북구 두호동',
  addr2: '',
  area_code: '35',
  sigungu_code: '11',
  mapx: '129.365',
  mapy: '36.056',
  first_image: '',
  active: true,
  cat1: 'A02',
  cat2: 'A0207',
  cat3: 'A02070200',
  content_type_id: '15',
  modified_time: '2026-01-01T00:00:00',
};

function fulfillTour(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/tourapi_attraction')) return route.continue();
  const raw = url.searchParams.get('content_id') || '';
  const id = raw.replace(/^eq\./, '');
  const accept = route.request().headers().accept || '';
  if (id !== '588175') {
    const empty = accept.includes('object+json') ? 'null' : '[]';
    return route.fulfill({ status: 200, contentType: 'application/json', body: empty });
  }
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(accept.includes('object+json') ? TOUR_ROW : [TOUR_ROW]),
  });
}

function fulfillReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slug = (url.searchParams.get('place_slug') || '').replace(/^eq\./, '');
  const rows = slug === PLACE_SLUG ? [REVIEW] : [];
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(rows),
  });
}

test.describe('review body affiliate hrefs @mocked', () => {
  test.beforeEach(async ({ page }) => {
    await installReadOnlyGuard(page);
    await page.route('**/rest/v1/tourapi_attraction**', (route) => fulfillTour(route));
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillReviews(route));
    await page.addInitScript(() => {
      window.localStorage.setItem('gateo.locale', 'ko');
    });
  });

  test('plain myrealtrip href gains mylink params; tagged and other hosts stay', async ({ page }) => {
    await page.goto(`/place/${PLACE_SLUG}/reviews?lang=ko`, { waitUntil: 'domcontentloaded' });
    const card = page.locator(`[data-review-id="${REVIEW_ID}"]`);
    await expect(card).toBeVisible();

    const mrt = card.locator('[data-content-affiliate="mrt"]');
    const trip = card.locator('[data-content-affiliate="trip"]');
    const other = card.locator(`a[href="${OTHER}"]`);

    await expect(mrt).toHaveAttribute('href', MRT_AFTER);
    await expect(mrt).not.toHaveAttribute('href', MRT_BEFORE);
    await expect(mrt).toHaveAttribute('target', '_blank');
    await expect(mrt).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    await expect(mrt).toContainText('제휴광고');

    const mrtUrl = new URL(await mrt.getAttribute('href'));
    expect(mrtUrl.pathname).toBe('/search');
    expect(mrtUrl.searchParams.get('q')).toBe('rome');
    expect(mrtUrl.hash).toBe('#list');
    expect(mrtUrl.searchParams.get('mylink_id')).toBe('2640202');
    expect(mrtUrl.searchParams.get('utm_content')).toBe('review-e2e-affiliate-review');

    await expect(trip).toHaveAttribute('href', TRIP_AFFILIATED);
    await expect(trip).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    await expect(trip).toContainText('제휴광고');

    await expect(other).toHaveCount(1);
    await expect(other).toHaveAttribute('href', OTHER);
    await expect(other).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    await expect(other).not.toContainText('제휴광고');
  });
});

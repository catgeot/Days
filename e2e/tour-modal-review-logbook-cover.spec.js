/**
 * 리뷰 → 투어 딥링크 → 모달 닫기 → 뒤로.
 * 1280×800에서 리뷰가 화면에 남고, 로그북 빈 화면이 위를 덮지 않는지.
 * «당신의 여행을 기록하세요»는 닫힌 패널 안에 항상 있으므로 DOM 존재로 판정하지 않는다.
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js tour-modal-review-logbook-cover --project=chromium-1280-review-back
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-deeplink-order.json'), 'utf8'),
);

const ROUND_PLAN = [
  { slug: 'bangkok', fresh: true, onReviewsPath: false },
  { slug: 'bangkok', fresh: false, onReviewsPath: true },
  { slug: 'khao-lak', fresh: true, onReviewsPath: false },
  { slug: 'khao-lak', fresh: false, onReviewsPath: true },
  { slug: 'bangkok', fresh: true, onReviewsPath: true },
];
const TOUR_LINK_NAME = '투어 보기';
const REVIEWS_TOUR_LINK = '리뷰에서 투어';
const LOGBOOK_EMPTY = '당신의 여행을 기록하세요';
const REVIEW_TITLE = '장소 리뷰';
const REVIEW_TITLE_MOBILE = '리뷰';

const PLACES = [
  { slug: 'bangkok' },
  { slug: 'khao-lak' },
];

function rowsFor(slug) {
  const template = REVIEW_ROWS.find((row) => row.place_slug === 'rome');
  return Array.from({ length: 5 }, (_, index) => {
    const id = `e2e-${slug}-r${index}`;
    const content =
      index === 0
        ? `${slug} 투어 딥링크. [${TOUR_LINK_NAME}](https://www.gateo.kr/place/${slug}?open=tour&from=review) [${REVIEWS_TOUR_LINK}](https://www.gateo.kr/place/${slug}/reviews?open=tour&from=review)`
        : `${slug} 리뷰 ${index + 1}`;
    return {
      ...template,
      id,
      place_slug: slug,
      content,
      persona_label: index === 0 ? '투어링크' : `리뷰${index + 1}`,
      created_at: new Date(Date.UTC(2026, 10, 14 - index, 8, 0, 0)).toISOString(),
      user_id: id,
      user: { id, display_name: 'GATEO', avatar_url: null },
    };
  });
}

const ROWS = PLACES.flatMap(({ slug }) => rowsFor(slug));

const GYG_STUB = `(() => {
  const mount = () => {
    document.querySelectorAll('[data-gyg-widget="activities"]').forEach((el) => {
      const q = el.getAttribute('data-gyg-q') || '';
      let frame = el.querySelector('iframe');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.title = 'GetYourGuide activities';
        el.appendChild(frame);
      }
      frame.setAttribute('data-mock-gyg-q', q);
    });
  };
  const obs = new MutationObserver(mount);
  obs.observe(document.documentElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['data-gyg-q'] });
  mount();
})();`;

async function installGygMock(page) {
  await page.route('**/*getyourguide.com/**', (route) => route.abort());
  await page.route('**/pa.umd.production.min.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: GYG_STUB,
    }),
  );
}

function fulfillPlaceReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = ROWS.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function closeTourModal(page, viewport) {
  const closeTour =
    viewport.width < 1024
      ? page.getByRole('button', { name: '투어 목록 닫기' }).first()
      : page.locator('#globe-tour-strip-panel').getByRole('button', { name: '투어 목록 닫기' });
  await closeTour.click({ force: true });
}

async function expectTourModalOpen(page, viewport) {
  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '투어 목록' })).toBeVisible({ timeout: 60_000 });
  }
}

test.use({ screenshot: 'only-on-failure' });

test.describe('review deeplink back does not leave the logbook layer up', () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await installGygMock(page);
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test(`reviews stay on screen after tour deeplink close and back (${ROUND_PLAN.length} rounds)`, async ({
    page,
  }) => {
    test.setTimeout(ROUND_PLAN.length * 90_000);
    const viewport = page.viewportSize() || { width: 1280, height: 800 };
    const desktop = viewport.width >= 1024;
    const title = page.getByRole('heading', {
      name: desktop ? REVIEW_TITLE : REVIEW_TITLE_MOBILE,
      exact: true,
    });

    for (let round = 0; round < ROUND_PLAN.length; round += 1) {
      const place = ROUND_PLAN[round];
      const linkName = place.onReviewsPath ? REVIEWS_TOUR_LINK : TOUR_LINK_NAME;
      const openPath = place.onReviewsPath
        ? `/place/${place.slug}/reviews`
        : `/place/${place.slug}`;
      if (place.fresh) {
        await page.goto(`/place/${place.slug}/reviews?lang=ko`, { waitUntil: 'domcontentloaded' });
      }
      await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });

      const cards = page.locator('[data-place-reviews-scroll-root] [data-review-id]');
      await expect(title).toBeVisible({ timeout: 30_000 });
      await expect(title).toBeInViewport();
      await expect(cards).toHaveCount(5, { timeout: 30_000 });
      const linked = cards.filter({ hasText: linkName }).first();
      await expect(linked).toBeVisible();
      await expect(linked).toBeInViewport();

      await linked.getByRole('link', { name: linkName }).click();
      await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
      await expectTourModalOpen(page, viewport);
      await expect
        .poll(async () => new URL(page.url()).pathname.replace(/\/$/, ''))
        .toBe(openPath);

      await closeTourModal(page, viewport);
      await expect
        .poll(async () => {
          if (viewport.width < 1024) {
            return page.getByRole('dialog', { name: '투어 전체 목록' }).count();
          }
          return page.getByRole('region', { name: '투어 목록' }).count();
        })
        .toBe(0);

      await page.goBack({ waitUntil: 'domcontentloaded' });

      await expect
        .poll(async () => new URL(page.url()).pathname.replace(/\/$/, ''))
        .toBe(`/place/${place.slug}/reviews`);
      await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 9_000 });
      await expect(cards).toHaveCount(5, { timeout: 9_000 });
      await expect(title, `round ${round} ${place.slug} review title`).toBeVisible({
        timeout: 9_000,
      });
      await expect(title).toBeInViewport();
      await expect(linked, `round ${round} ${place.slug} review card`).toBeVisible({
        timeout: 9_000,
      });
      await expect(linked).toBeInViewport();

      const logbook = page.getByRole('heading', { name: LOGBOOK_EMPTY });
      const logbookCount = await logbook.count();
      for (let i = 0; i < logbookCount; i += 1) {
        await expect(
          logbook.nth(i),
          `round ${round} ${place.slug} logbook empty screen on top`,
        ).not.toBeInViewport();
      }
    }
  });
});

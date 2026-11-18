/**
 * 리뷰 탭 → ?open=tour 딥링크 → 투어 닫기 → 브라우저 뒤로: 리뷰 복귀·layout.get pageerror 0.
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js tour-modal-review-tour-back
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-deeplink-order.json'), 'utf8'),
);

const ROME_LINKED_ID = 'e2e-rome-walk';
const STRESS_ROUNDS = Number(process.env.GATEO_STRESS_ROUNDS || '1');
const BENCHMARK_MAIN = process.env.GATEO_STRESS_BENCHMARK === '1';

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
  const filtered = REVIEW_ROWS.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

function isLayoutPageError(message) {
  return /layout\.get|getLayoutProperty|getStyle\(\)|getLayer\(|reading 'get'\)/i.test(
    String(message || ''),
  );
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

async function expectReviewSurface(page, linkedId) {
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 9_000 });
  const linked = page.locator(`[data-place-reviews-scroll-root] [data-review-id="${linkedId}"]`);
  await expect(linked).toBeVisible({ timeout: 9_000 });
  await expect(linked).toContainText('느린산책');
  return linked;
}

test.describe('review → tour deeplink → close → back', () => {
  test.beforeEach(async ({ page }) => {
    await installGygMock(page);
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test(`${STRESS_ROUNDS} rounds — review visible and layout pageerror 0`, async ({ page }) => {
    test.setTimeout(STRESS_ROUNDS * 90_000);
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    const allPageErrors = [];
    let blankAfterBack = 0;

    page.on('pageerror', (err) => {
      allPageErrors.push(String(err?.message || err));
    });

    for (let round = 0; round < STRESS_ROUNDS; round += 1) {
      await page.goto(`/place/rome/reviews?review=${ROME_LINKED_ID}&lang=ko`, {
        waitUntil: 'domcontentloaded',
      });
      await expectReviewSurface(page, ROME_LINKED_ID);

      await page.goto(
        `/place/rome/reviews?review=${ROME_LINKED_ID}&open=tour&from=review&lang=ko`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
      await expectTourModalOpen(page, viewport);
      if (!BENCHMARK_MAIN) {
        await expect
          .poll(async () => {
            const url = new URL(page.url());
            return {
              pathname: url.pathname,
              hasOpen: url.searchParams.has('open'),
              hasFrom: url.searchParams.has('from'),
            };
          })
          .toEqual({
            pathname: '/place/rome/reviews',
            hasOpen: false,
            hasFrom: false,
          });
      }

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
      try {
        await expectReviewSurface(page, ROME_LINKED_ID);
      } catch {
        blankAfterBack += 1;
      }
    }

    const layoutErrors = allPageErrors.filter(isLayoutPageError);
    expect(
      { blankAfterBack, layoutErrors },
      `rounds=${STRESS_ROUNDS} project=${test.info().project.name} pageErrors=${JSON.stringify(allPageErrors)} layoutFiltered=${JSON.stringify(layoutErrors)}`,
    ).toEqual({
      blankAfterBack: 0,
      layoutErrors: [],
    });
  });
});
/**
 * 리뷰 탭 → 리뷰 안 투어 링크 → 모달 닫기 → 뒤로.
 * layout.get pageerror 0, 뒤로 간 뒤 리뷰 표면 0회 공백.
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js tour-modal-review-tour-back --project=chromium-1280-review-back
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-deeplink-order.json'), 'utf8'),
);

const ROME_LINKED_ID = 'e2e-rome-walk';
const TOUR_LINK_NAME = '투어 보기';
const STRESS_ROUNDS = Number(process.env.GATEO_STRESS_ROUNDS || '12');

const ROWS = REVIEW_ROWS.map((row) => {
  if (row.id !== ROME_LINKED_ID) return row;
  return {
    ...row,
    content: `로마 느린산책 리뷰. [${TOUR_LINK_NAME}](https://www.gateo.kr/place/rome?open=tour&from=review)`,
  };
});

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

function isLayoutPageError(message) {
  return /layout\.get|getLayoutProperty|reading 'get'|LAYOUT_MISSING/i.test(String(message || ''));
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

async function pageLooksBlank(page) {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    const rootChildren = root ? root.childElementCount : 0;
    return {
      textLength: text.length,
      rootChildren,
      textSample: text.slice(0, 120),
    };
  });
}

test.describe('review → tour link → close → back', () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await installGygMock(page);
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test(`${STRESS_ROUNDS} rounds — review visible and layout pageerror 0`, async ({ page }) => {
    test.setTimeout(STRESS_ROUNDS * 90_000);
    const viewport = page.viewportSize() || { width: 1280, height: 800 };
    const pageErrors = [];
    const consoleLayoutErrors = [];
    let blankAfterBack = 0;

    page.on('pageerror', (err) => {
      pageErrors.push({
        message: String(err?.message || err),
        stack: String(err?.stack || ''),
      });
    });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (!isLayoutPageError(text)) return;
      consoleLayoutErrors.push(text);
    });

    await page.goto(`/place/rome/reviews?review=${ROME_LINKED_ID}&lang=ko`, {
      waitUntil: 'domcontentloaded',
    });
    const linked = page.locator(`[data-place-reviews-scroll-root] [data-review-id="${ROME_LINKED_ID}"]`);
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
    await expect(linked).toBeVisible({ timeout: 30_000 });
    await expect(linked).toContainText('느린산책');
    // CI 잡에는 Mapbox 토큰이 없어 지구본이 마운트되지 않는다. 토큰이 있으면 캔버스 뒤에 루프를 돌린다.
    if (process.env.VITE_MAPBOX_TOKEN) {
      await expect(page.locator('.mapboxgl-canvas').first()).toBeAttached({ timeout: 30_000 });
    }

    for (let round = 0; round < STRESS_ROUNDS; round += 1) {
      const tourLink = linked.getByRole('link', { name: TOUR_LINK_NAME });
      await expect(tourLink).toBeVisible();
      await tourLink.click();

      await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
      await expectTourModalOpen(page, viewport);

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
        await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 9_000 });
        await expect(linked).toBeVisible({ timeout: 9_000 });
        await expect(linked).toContainText('느린산책');
        const surface = await pageLooksBlank(page);
        if (surface.textLength < 20 || surface.rootChildren === 0) blankAfterBack += 1;
      } catch {
        blankAfterBack += 1;
      }
    }

    const layoutErrors = pageErrors.filter((entry) => isLayoutPageError(entry.message));
    const artifactPath = '/opt/cursor/artifacts/review-tour-back-stacks.json';
    if (existsSync('/opt/cursor/artifacts')) {
      writeFileSync(
        artifactPath,
        JSON.stringify({ blankAfterBack, pageErrors, layoutErrors, consoleLayoutErrors }, null, 2),
      );
    }

    expect(
      { blankAfterBack, layoutErrors: layoutErrors.map((entry) => entry.message) },
      `rounds=${STRESS_ROUNDS} project=${test.info().project.name} stacks=${JSON.stringify(layoutErrors)}`,
    ).toEqual({
      blankAfterBack: 0,
      layoutErrors: [],
    });
  });
});

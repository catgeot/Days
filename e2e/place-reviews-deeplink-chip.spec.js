import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { installReadOnlyGuard } from './readOnlyGuard.js';

const ARTIFACTS_DIR = '/opt/cursor/artifacts';

const TOUR_ROWS = {
  588175: {
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
  },
  127937: {
    content_id: '127937',
    title: '장흥 고산사',
    addr1: '전라남도 장흥군 유치면',
    addr2: '',
    area_code: '38',
    sigungu_code: '11',
    mapx: '126.85',
    mapy: '34.72',
    first_image: '',
    active: true,
    cat1: 'A02',
    cat2: 'A0201',
    cat3: 'A02010800',
    content_type_id: '12',
    modified_time: '2026-01-01T00:00:00',
  },
};

function reviewRow(slug) {
  const lines = [
    `${slug} 리뷰 본문입니다. 칩바 여유를 확인하려고 본문을 충분히 길게 적습니다. 더보기를 연 뒤 마지막 줄이 하단 바 위에 있어야 합니다.`,
    '둘째 줄은 칩바 위로 남아야 합니다.',
    '셋째 줄도 잘리지 않아야 합니다.',
    '넷째 줄은 스크롤 끝에서 확인합니다.',
    '다섯째 줄은 고정 하단 바보다 위에 있습니다.',
    '마지막 줄 LASTLINE-E2E',
  ];
  return {
    id: `e2e-${slug}-review`,
    place_slug: slug,
    content: lines.join('\n'),
    content_blocks: null,
    persona_label: null,
    is_public: true,
    is_editorial: false,
    images: [],
    created_at: '2026-11-01T00:00:00Z',
    rating: 5,
    user_id: `e2e-${slug}-user`,
    user: { id: `e2e-${slug}-user`, display_name: 'GATEO', avatar_url: null },
    likes: [],
  };
}

function fulfillTour(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/tourapi_attraction')) return route.continue();
  const raw = url.searchParams.get('content_id') || '';
  const id = raw.replace(/^eq\./, '');
  const row = TOUR_ROWS[id];
  const accept = route.request().headers().accept || '';
  const respond = () => {
    if (!row) {
      const empty = accept.includes('object+json') ? 'null' : '[]';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: empty,
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(accept.includes('object+json') ? row : [row]),
    });
  };
  return new Promise((resolve) => {
    setTimeout(() => resolve(respond()), row ? 1800 : 0);
  });
}

function fulfillReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slug = (url.searchParams.get('place_slug') || '').replace(/^eq\./, '');
  const row = slug ? reviewRow(slug) : null;
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(row ? [row] : []),
  });
}

async function installMocks(page) {
  await installReadOnlyGuard(page);
  await page.route('**/rest/v1/tourapi_attraction**', (route) => fulfillTour(route));
  await page.route('**/rest/v1/place_reviews**', (route) => fulfillReviews(route));
  await page.addInitScript(() => {
    window.localStorage.setItem('gateo.locale', 'ko');
  });
}

async function openReviews(page, slug, search = '') {
  await page.goto(`/place/${slug}/reviews${search}`, { waitUntil: 'domcontentloaded' });
  const card = page.locator('[data-place-reviews-scroll-root] [data-review-id]').first();
  await expect(card).toBeVisible();
  await page.waitForTimeout(12_000);
  expect(new URL(page.url()).pathname.endsWith('/reviews')).toBe(true);
  await expect(card).toBeVisible();
  await expect(card).toContainText('LASTLINE-E2E');
  return card;
}

async function shot(page, filename) {
  if (!existsSync(ARTIFACTS_DIR)) return;
  const viewport = page.viewportSize();
  await page.screenshot({
    path: join(ARTIFACTS_DIR, filename),
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
}

test.describe('place reviews deep link and chip clearance', () => {
  test.beforeEach(async ({ page }) => {
    await installMocks(page);
  });

  test('direct /reviews stays after tour hydration', async ({ page }) => {
    const slug = 'tour-588175';
    await openReviews(page, slug);
    const width = page.viewportSize().width;
    if (width <= 400) {
      const root = page.locator('[data-place-reviews-scroll-root]');
      const scrollPad = await root.evaluate((el) => parseFloat(getComputedStyle(el).scrollPaddingBottom) || 0);
      expect(scrollPad).toBeGreaterThanOrEqual(152);
      const expand = root.getByRole('button', { name: /더보기|펼치기|expand/i });
      if (await expand.count()) await expand.first().click();
      const body = root.locator('[data-review-body]').first();
      await body.evaluate((el) => el.scrollIntoView({ block: 'end', inline: 'nearest' }));
      const metrics = await page.evaluate(() => {
        const text = document.querySelector('[data-place-reviews-scroll-root] [data-review-body]');
        const bar = document.querySelector('div.fixed.bottom-0');
        const textRect = text.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();
        return {
          textBottom: textRect.bottom,
          barTop: barRect.top,
          barHeight: barRect.height,
        };
      });
      expect(metrics.barHeight).toBeGreaterThan(40);
      expect(metrics.textBottom).toBeLessThanOrEqual(metrics.barTop + 0.5);
      await shot(page, 'after-tour-588175-reviews-390.png');
    } else {
      await shot(page, 'after-tour-588175-reviews-1280.png');
    }
  });

  for (const slug of ['tour-127937', 'osaka', 'khao-lak']) {
    test(`direct /reviews stays for ${slug}`, async ({ page }) => {
      await openReviews(page, slug);
    });
  }

  test('planner and tour deeplink stay on their route', async ({ page }) => {
    await page.goto('/place/tour-588175/planner', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12_000);
    expect(new URL(page.url()).pathname.endsWith('/planner')).toBe(true);

    await page.goto('/place/tour-588175/reviews?open=tour', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12_000);
    expect(new URL(page.url()).pathname.endsWith('/reviews')).toBe(true);
  });
});

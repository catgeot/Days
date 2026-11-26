import { devices } from '@playwright/test';
import { test, expect } from './fixtures.js';

const EDITORIAL_SLUG = 'e2e-busan-december-lights';
const EDITORIAL_TITLE = '부산·울산에 12월 불빛이 켜져요';

const LONG_MAPS =
  'https://www.google.com/maps/search/?api=1&query=Busan%20Cinema%20Center%20Christmas%20village%20Haeundae%20light%20festival%20Gwangalli';

const EDITORIAL_REPORT = {
  id: 'e2e-editorial-busan-lights',
  title: EDITORIAL_TITLE,
  dek: '11월 26~28일 차례로 문을 여는 크리스마스 빌리지·울산 마켓·해운대 빛축제',
  content: `부산과 울산에서 12월을 밝히는 불빛 행사가 이번 주부터 차례로 시작해요. 공식 안내로 기간과 장소를 확인한 세 곳을 모았어요. 하루에 한 곳씩 이어서 열리니 이번 주말에 한 번에 둘러볼 코스도 그려 볼 수 있어요.

[사진 1]

## 11월 26일 · 크리스마스 빌리지 부산

영화의전당에 크리스마스 마을이 들어서요. 기간은 2026년 11월 26일부터 12월 25일까지예요. 주최 측 안내에 따르면 산타와 우편배달부, 산장 주인이 마을 사람으로 등장하고, 눈 내리는 광장과 퍼레이드, 성가대 공연이 열려요.

## 11월 28일 · 해운대 빛축제

제13회 해운대 빛축제는 해운대스퀘어(구남로)와 해운대해수욕장 일원에서 열려요. 구남로에는 출항을 알리는 크루즈 게이트와 30m 길이의 빛 터널, 크리스마스 트리 숲이 있고, 백사장에는 배 조형물과 고래·잠수함·바다거북 조형물이 이어져요. 점등 시간은 매일 18:00부터 23:00까지예요.

**여행 팁 · 부산·울산 12월 불빛**
- [크리스마스 빌리지 부산](https://www.gateo.kr/korea?festival=e2e-busan-village) — 영화의전당, 11/26–12/25
- [해운대 빛축제](https://www.gateo.kr/korea?festival=e2e-haeundae-lights) — 구남로·해운대해수욕장, 무료
- 지도: [영화의전당](${LONG_MAPS}) · [울산대공원 풍차](https://www.google.com/maps/search/?api=1&query=Ulsan%20Grand%20Park%20windmill%20Christmas%20market%20night)

현지 정보 확인일: 2026-11-26 · 일정은 현지 사정에 따라 바뀔 수 있어요
`,
  date: '2026-11-26',
  location: '부산',
  images: [
    {
      url: 'https://example.test/blog/busan-december-lights.jpg',
      credit:
        'Photo by Song Si-bong · 한국관광공사 포토코리아 사진 페이지 · 포토코리아 · 공공누리 제1유형(2023년 12월 해운대 빛축제 모습)',
    },
  ],
  is_public: true,
  is_deleted: false,
  is_editorial: true,
  slug: EDITORIAL_SLUG,
  status: 'published',
  published_at: '2026-11-26T01:00:00.000Z',
  disclosure_badge: 'GATEO 에디터 · AI 보조 · 실제 방문기 아님',
  view_count: 4,
  like_count: 0,
  comment_count: 0,
  user_id: null,
};

const PLAIN_REPORT = {
  id: 'e2e-plain-older-log',
  title: '오래 전 방콕 아침',
  content:
    '방콕 강변을 오래 걸었어요. 배 시간은 부두 게시판이 맞고, 골목 안 가게는 오전에만 열어요.\n\n강 건너 사원까지는 걸어서 이어서 갈 수 있어요.',
  date: '2025-04-02',
  location: '방콕',
  images: [],
  is_public: true,
  is_deleted: false,
  is_editorial: false,
  status: 'published',
  view_count: 2,
  like_count: 0,
  comment_count: 0,
  user_id: null,
};

function installRoutes(page, report) {
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
      const id = url.searchParams.get('id');
      if (slug === `eq.${report.slug}` || id === `eq.${report.id}`) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(report),
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

async function bodyGaps(page) {
  return page.evaluate(() => {
    const node = document.querySelector('.logbook-body');
    const paragraph = node?.querySelector('p');
    const doc = document.scrollingElement;
    const vw = window.innerWidth;
    const box = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: vw - rect.right,
      };
    };
    return {
      body: box(node),
      paragraph: box(paragraph),
      overflow: doc.scrollWidth - doc.clientWidth,
    };
  });
}

function expectCentered(gaps) {
  expect(gaps.body).toBeTruthy();
  expect(gaps.paragraph).toBeTruthy();
  expect(Math.abs(gaps.body.left - gaps.body.right)).toBeLessThanOrEqual(2);
  expect(Math.abs(gaps.paragraph.left - gaps.paragraph.right)).toBeLessThanOrEqual(2);
  expect(gaps.overflow).toBe(0);
}

const iphone = devices['iPhone 13'];
test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  userAgent: iphone.userAgent,
  locale: 'ko-KR',
});

test.describe('logbook article body stays centered at 390', () => {
  test('editorial post like the December lights article has equal side gaps', async ({ page }) => {
    await installRoutes(page, EDITORIAL_REPORT);
    await page.goto(`/blog/e/${EDITORIAL_SLUG}?lang=ko`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: EDITORIAL_TITLE })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('.logbook-body p').first()).toBeVisible();
    expectCentered(await bodyGaps(page));

    await page.locator('[data-logbook-article-end]').scrollIntoViewIfNeeded();
    expectCentered(await bodyGaps(page));
  });

  test('a plain public post has equal side gaps', async ({ page }) => {
    await installRoutes(page, PLAIN_REPORT);
    await page.goto(`/p/${PLAIN_REPORT.id}?lang=ko`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: PLAIN_REPORT.title })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('.logbook-body p').first()).toBeVisible();
    expectCentered(await bodyGaps(page));
  });
});

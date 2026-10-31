import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { dismissMooniHintIfPresent } from './helpers.js';

const ART_DIR = '/opt/cursor/artifacts/screenshots/mooni-paris-gangwon-fix';

/** Gemini route-mock — scoped festival merge는 festivalWindow SSOT + 짧은 mock 본문 */
const GANGWON_GEMINI_MOCK_REPLY =
  '강원특별자치도에서 열리는 축제를 이번 주 기준으로 정리했어요. (E2E mock)';

const GANGWON_WEEK_ITEMS = [
  {
    contentId: '900001',
    title: '나오라쇼 2026',
    addr1: '강원특별자치도 원주시',
    eventStartDate: '20261028',
    eventEndDate: '20261031',
    mapx: '127.920000',
    mapy: '37.342000',
  },
  {
    contentId: '900002',
    title: '춘천 마임축제',
    addr1: '강원특별자치도 춘천시',
    eventStartDate: '20261029',
    eventEndDate: '20261102',
    mapx: '127.734000',
    mapy: '37.881000',
  },
];

async function mockFestivalWindow(page) {
  await page.route(/\/functions\/v1\/festivalWindow/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        items: GANGWON_WEEK_ITEMS,
        fromCache: true,
      }),
    });
  });
}

async function installGangwonGeminiMock(context) {
  const { buildGeminiProxyMockBody } = await import('./gemini-proxy-mock-response.js');
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(GANGWON_GEMINI_MOCK_REPLY, {
          modelUsed: 'mock-e2e-gangwon-scoped-festival',
        }),
      ),
    });
  });
}

async function openHomeMooni(page) {
  await page.goto('/?lang=ko');
  await dismissMooniHintIfPresent(page);
  const fab = page.getByTestId('mooni-fab-open');
  await expect(fab).toBeVisible({ timeout: 60_000 });
  await fab.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function openParisPlannerMooni(page) {
  await page.goto('/place/paris/planner?lang=ko');
  await dismissMooniHintIfPresent(page);
  const mooniBtn = page.locator('.place-header-mooni-btn').first();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function clipShot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${ART_DIR}/${name}`,
    clip: { x: 0, y: 0, width, height: Math.min(height, 844) },
  });
}

async function expectNewChatVisible(page) {
  await expect(page.getByTestId('mooni-chat-new').first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('MOONi Paris bound — 강원 축제 회귀 @390 @1280', () => {
  test.beforeAll(() => {
    mkdirSync(ART_DIR, { recursive: true });
  });

  test('홈·장소 새 대화 + 파리 PLANNER 강원 축제 (Gemini mock)', async ({ page, context }) => {
    await mockFestivalWindow(page);
    await installGangwonGeminiMock(context);

    await openHomeMooni(page);
    await expectNewChatVisible(page);
    await clipShot(page, 'mooni-home-new-chat-390.png', 390);
    await clipShot(page, 'mooni-home-new-chat-1280.png', 1280);

    await page.getByLabel(/채팅 닫기|Close chat/i).click();
    await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeHidden({ timeout: 15_000 });

    await openParisPlannerMooni(page);
    await expectNewChatVisible(page);
    await clipShot(page, 'mooni-paris-place-new-chat-390.png', 390);
    await clipShot(page, 'mooni-paris-place-new-chat-1280.png', 1280);

    const input = page.getByRole('textbox', {
      name: /메시지 입력|직접 입력|Type a message|Type directly/i,
    });
    await input.fill('이번주 강원 축제');
    await input.press('Enter');

    await expect(page.getByText(/나오라쇼|춘천 마임축제|gateo\.kr\/korea\/\?festival=/i)).toBeVisible({
      timeout: 45_000,
    });
    await clipShot(page, 'mooni-paris-gangwon-festival-reply-390.png', 390);
    await clipShot(page, 'mooni-paris-gangwon-festival-reply-1280.png', 1280);
  });
});

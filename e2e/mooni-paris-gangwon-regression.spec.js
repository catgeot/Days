import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { dismissMooniHintIfPresent } from './helpers.js';

/** Cloud: `/opt/cursor/artifacts/...` · 로컬: `artifacts/screenshots/...` */
const ART_DIR =
  process.env.MOONI_PARIS_GANGWON_SCREENSHOT_DIR ||
  process.env.MOONI_SCREENSHOT_DIR ||
  join(process.cwd(), 'artifacts/screenshots/mooni-paris-gangwon-fix');

export const GANGWON_FESTIVAL_MOCK_MARKER = 'GATEO_E2E_GANGWON_MOCK_7c2a';

/** Gemini route-mock — scoped festival merge는 festivalWindow SSOT + 짧은 mock 본문 */
const GANGWON_GEMINI_MOCK_REPLY =
  `강원특별자치도에서 열리는 축제를 이번 주 기준으로 정리했어요. ${GANGWON_FESTIVAL_MOCK_MARKER} (E2E mock)`;

/**
 * Live PROD `festivalWindow`: 이번 주 강원 SSOT는 보통 «나오라쇼» 1건뿐이다.
 * 아래 `GANGWON_WEEK_ITEMS` 두 번째(춘천 마임축제 + mock marker)는 E2E route mock 전용.
 */
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
    title: `춘천 마임축제 ${GANGWON_FESTIVAL_MOCK_MARKER}`,
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

async function mooniChatHeader(page) {
  return page
    .locator('[class*="backdrop-blur-md"]')
    .filter({ has: page.getByLabel(/채팅 닫기|Close chat/i) })
    .first();
}

async function clipHeaderAt(page, name, width) {
  await page.setViewportSize({ width, height: 844 });
  await page.waitForTimeout(300);
  const header = await mooniChatHeader(page);
  await expect(header).toBeVisible({ timeout: 10_000 });
  await header.screenshot({ path: `${ART_DIR}/${name}` });
}

/** 헤더 우측 버튼 right edge ≤ viewportWidth − 12px (main 12px inset) */
async function assertHeaderRightInset(page, viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 844 });
  await page.waitForTimeout(200);
  const header = await mooniChatHeader(page);
  await expect(header).toBeVisible({ timeout: 10_000 });
  const maxAllowed = viewportWidth - 12;
  const rightEdge = await header.evaluate((el) => {
    let max = 0;
    el.querySelectorAll('button').forEach((btn) => {
      const r = btn.getBoundingClientRect();
      if (r.right > max) max = r.right;
    });
    return max;
  });
  expect(
    rightEdge,
    `viewport ${viewportWidth}px — max right ${maxAllowed}px, got ${rightEdge}`,
  ).toBeLessThanOrEqual(maxAllowed + 0.5);
}

async function sendMooniMessage(page, text) {
  const input = page.getByRole('textbox', {
    name: /메시지 입력|직접 입력|Type a message|Type directly/i,
  });
  await input.fill(text);
  await input.press('Enter');
}

async function clickNewChat(page) {
  const btn = page.locator('[data-testid="mooni-chat-new"]:visible').first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
}

test.describe('MOONi Paris bound — 강원 축제 회귀 @390 @1280', () => {
  test.beforeAll(() => {
    mkdirSync(ART_DIR, { recursive: true });
  });

  test('홈·장소 새 대화 클리어 + PLANNER 강원 축제 (Gemini mock)', async ({ page, context }) => {
    await mockFestivalWindow(page);
    await installGangwonGeminiMock(context);

    await openParisPlannerMooni(page);

    for (const w of [360, 390, 1280]) {
      await assertHeaderRightInset(page, w);
    }
    await clipHeaderAt(page, 'mooni-paris-header-360.png', 360);
    await clipHeaderAt(page, 'mooni-paris-header-390.png', 390);

    await sendMooniMessage(page, '이번주 강원 축제');

    const replyMarker = page.getByText(GANGWON_FESTIVAL_MOCK_MARKER);
    await expect(replyMarker).toBeVisible({ timeout: 45_000 });

    await clipShot(page, 'mooni-paris-before-new-chat-390.png', 390);
    await clipShot(page, 'mooni-paris-before-new-chat-1280.png', 1280);

    await clickNewChat(page);
    await expect(replyMarker).toBeHidden({ timeout: 10_000 });

    await clipShot(page, 'mooni-paris-after-new-chat-390.png', 390);
    await clipShot(page, 'mooni-paris-after-new-chat-1280.png', 1280);

    await page.getByLabel(/채팅 닫기|Close chat/i).click();

    await openHomeMooni(page);
    await sendMooniMessage(page, '안녕 MOONi E2E');
    const homeUserLine = page.getByText('안녕 MOONi E2E');
    await expect(homeUserLine).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/E2E mock/i)).toBeVisible({ timeout: 45_000 });

    await clipShot(page, 'mooni-home-before-new-chat-390.png', 390);
    await clipShot(page, 'mooni-home-before-new-chat-1280.png', 1280);

    await clickNewChat(page);
    await expect(homeUserLine).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(/E2E mock/i)).toBeHidden({ timeout: 10_000 });

    await clipShot(page, 'mooni-home-after-new-chat-390.png', 390);
    await clipShot(page, 'mooni-home-after-new-chat-1280.png', 1280);
  });
});

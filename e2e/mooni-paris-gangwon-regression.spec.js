import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { dismissMooniHintIfPresent } from './helpers.js';
import { installFestivalChipGeminiMock } from './mooni-festival-chip-mock.js';

const ART_DIR = '/opt/cursor/artifacts/screenshots/mooni-paris-gangwon-fix';

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

async function openParisMooni(page) {
  await page.goto('/place/paris?lang=ko');
  await dismissMooniHintIfPresent(page);
  const mooniFab = page.getByRole('button', {
    name: /MOONi와 대화하기|Chat with MOONi/i,
  }).or(page.getByLabel(/MOONi와 대화하기|Chat with MOONi/i));
  await expect(mooniFab).toBeVisible({ timeout: 60_000 });
  await mooniFab.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function clipShot(page, name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${ART_DIR}/${name}`,
    clip: { x: 0, y: 0, width, height: width === 390 ? 844 : Math.min(900, 844) },
  });
}

test.describe('MOONi Paris bound — 강원 축제 회귀 @390 @1280', () => {
  test.beforeAll(() => {
    mkdirSync(ART_DIR, { recursive: true });
  });

  test('sidebar 새 대화 + 강원 축제 GATEO 링크', async ({ page, context }) => {
    await mockFestivalWindow(page);
    await installFestivalChipGeminiMock(context, {
      delayMs: 0,
    });
    await openParisMooni(page);

    await expect(page.getByRole('button', { name: '새 대화' })).toBeVisible({
      timeout: 10_000,
    });
    await clipShot(page, 'mooni-paris-sidebar-new-chat-390.webp', 390);
    await clipShot(page, 'mooni-paris-sidebar-new-chat-1280.webp', 1280);

    const input = page.getByRole('textbox', {
      name: /메시지 입력|직접 입력|Type a message|Type directly/i,
    });
    await input.fill('이번주 강원 축제');
    await input.press('Enter');

    await expect(page.getByText(/나오라쇼|춘천 마임축제|gateo\.kr\/korea\/\?festival=/i)).toBeVisible({
      timeout: 45_000,
    });
    await clipShot(page, 'mooni-paris-gangwon-festival-reply-390.webp', 390);
    await clipShot(page, 'mooni-paris-gangwon-festival-reply-1280.webp', 1280);
  });
});

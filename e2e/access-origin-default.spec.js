import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const ARTIFACTS = '/opt/cursor/artifacts';

async function stubNetwork(context) {
  await context.route(/\.supabase\.co\//i, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === 'POST' && /gemini-proxy/i.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          text: 'E2E-MOCK',
          modelUsed: 'mock-e2e',
          finishReason: 'STOP',
          truncated: false,
        }),
      });
      return;
    }
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'e2e read-only' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
  await context.route(/google-analytics\.com/i, (route) => route.abort());
}

async function openAccessDock(page, context, { path, coords, storage }) {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: coords.lat, longitude: coords.lng });
  if (storage) {
    await page.addInitScript((payload) => {
      if (payload.success) {
        localStorage.setItem('korea-festival-loc-success', JSON.stringify(payload.success));
      }
      if (payload.cityId) {
        localStorage.setItem('gateo.domesticOriginCityId', payload.cityId);
      }
    }, storage);
  }
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
  if (await hint.isVisible({ timeout: 3000 }).catch(() => false)) await hint.click();
  const mooniBtn = page.locator('.place-header-mooni-btn').first();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
  const topics = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
  await expect(topics).toBeVisible({ timeout: 60_000 });
  await topics.getByRole('button', { name: /✈️\s*(가는 방법|Getting there)/ }).click({ force: true });
  const dock = page.getByTestId('mooni-access-origin-dock');
  await expect(dock).toBeVisible({ timeout: 30_000 });
  return dock;
}

async function saveSectionShot(page, dock, filename) {
  if (process.env.CI) return;
  const viewport = page.viewportSize();
  const width = viewport?.width ?? 390;
  const height = viewport?.height ?? 844;
  const box = await dock.boundingBox();
  if (!box) return;
  const y = Math.max(0, box.y - 8);
  const clipHeight = Math.min(Math.ceil(box.height + 16), height - y);
  mkdirSync(ARTIFACTS, { recursive: true });
  await page.screenshot({
    path: `${ARTIFACTS}/${filename}`,
    clip: { x: 0, y, width, height: clipHeight },
  });
}

test.beforeEach(async ({ context }) => {
  await stubNetwork(context);
});

test('Khao Lak location on Khao Lak shows Phuket, not Seoul ICN', async ({ page, context }, testInfo) => {
  const dock = await openAccessDock(page, context, {
    path: '/place/khao-lak?lang=ko',
    coords: { lat: 8.6475, lng: 98.2483 },
  });
  await expect(dock).toContainText('가는 방법');
  const chip = dock.getByRole('button', { name: /출발지 검색 펼치기/ });
  await expect(chip).toContainText('푸켓 (HKT)');
  await expect(chip).not.toContainText('서울 (ICN)');
  await expect(dock.getByRole('button', { name: '물어보기' })).toBeVisible();
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveSectionShot(page, dock, `access-origin-khao-lak-after-${width}.png`);
});

test('Bangkok location on Tokyo shows Bangkok, not Seoul ICN', async ({ page, context }) => {
  const dock = await openAccessDock(page, context, {
    path: '/place/tokyo?lang=ko',
    coords: { lat: 13.7563, lng: 100.5018 },
    storage: {
      success: { at: Date.now(), lat: 13.76, lng: 100.5 },
    },
  });
  await expect(dock).toContainText('가는 방법');
  const chip = dock.getByRole('button', { name: /출발지 검색 펼치기/ });
  await expect(chip).toContainText('방콕 (BKK)');
  await expect(chip).not.toContainText('서울 (ICN)');
});

test('Busan location on Jeju shows Busan, not Seoul ICN', async ({ page, context }) => {
  const dock = await openAccessDock(page, context, {
    path: '/place/jeju?lang=ko',
    coords: { lat: 35.1796, lng: 129.0756 },
    storage: { cityId: 'busan' },
  });
  await expect(dock).toContainText('가는 방법');
  const chip = dock.getByRole('button', { name: /출발지 검색 펼치기/ });
  await expect(chip).toContainText('부산 (PUS)');
  await expect(chip).not.toContainText('서울 (ICN)');
  await expect(chip).not.toContainText('김포 (GMP)');
});

test('Jeju location on Jeju shows Jeju and keeps the section', async ({ page, context }) => {
  const dock = await openAccessDock(page, context, {
    path: '/place/jeju?lang=ko',
    coords: { lat: 33.4996, lng: 126.5312 },
    storage: {
      success: { at: Date.now(), lat: 33.5, lng: 126.53 },
    },
  });
  await expect(dock).toContainText('가는 방법');
  const chip = dock.getByRole('button', { name: /출발지 검색 펼치기/ });
  await expect(chip).toContainText('제주 (CJU)');
  await expect(chip).not.toContainText('서울 (ICN)');
  await expect(dock.getByRole('button', { name: '물어보기' })).toBeVisible();
});

test('English Khao Lak access chip uses the Phuket label', async ({ page, context }) => {
  const dock = await openAccessDock(page, context, {
    path: '/place/khao-lak?lang=en',
    coords: { lat: 8.6475, lng: 98.2483 },
    storage: {
      success: { at: Date.now(), lat: 8.65, lng: 98.25 },
    },
  });
  await expect(dock).toContainText('Getting there');
  const chip = dock.getByRole('button', { name: /Expand departure search/ });
  await expect(chip).toContainText('Phuket (HKT)');
  await expect(chip).not.toContainText('Seoul (ICN)');
  await expect(chip).not.toContainText('푸켓');
});

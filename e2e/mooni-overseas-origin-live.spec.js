import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import { enableMooniE2eLoggedIn } from './mooni-festival-chip-helpers.js';

const OUT_DIR = '/opt/cursor/artifacts/overseas-origin';

function shotBox(width) {
  return { x: 0, y: 0, width, height: width === 1280 ? 900 : 844 };
}

async function installGemini(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
        },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(buildGeminiProxyMockBody('E2E-MOCK-9f3a 가는 법', { modelUsed: 'mock-origin' })),
    });
  });
}

async function openAccess(page, context, { festivalId, latitude, longitude }) {
  await installGemini(context);
  await enableMooniE2eLoggedIn(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude, longitude });
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('gateo.domesticOriginCityId');
    } catch {
      /* ignore */
    }
  });
  await page.goto(`/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.waitFor({ state: 'attached', timeout: 90_000 });
  await mooniBtn.click({ force: true, timeout: 15_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 120_000 });
  await page.getByRole('button', { name: /가는 법/ }).first().click({ force: true });
  await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('mooni-origin-locate').click();
}

async function submitOrigin(page) {
  const input = page.getByTestId('mooni-origin-input');
  await input.evaluate((el) => {
    const propsKey = Object.keys(el).find((key) => key.startsWith('__reactProps$'));
    const onKeyDown = propsKey ? el[propsKey]?.onKeyDown : null;
    const event = {
      key: 'Enter',
      preventDefault() {},
      nativeEvent: { isComposing: false },
    };
    if (typeof onKeyDown === 'function') {
      onKeyDown(event);
      return;
    }
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
}

test.describe('live overseas origin captures', () => {
  test.skip(process.env.OVERSEAS_ORIGIN_LIVE !== '1', 'real Mapbox and Supabase captures');

  test('Haeundae light festival from Khao Lak', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.includes('webkit'), '390 and 1280 chromium');
    await openAccess(page, context, { festivalId: '2048902', latitude: 8.64, longitude: 98.25 });
    await expect(page.getByText('해운대 빛축제').first()).toBeVisible({ timeout: 30_000 });
    const input = page.getByTestId('mooni-origin-input');
    await expect(input).toHaveValue(/ · 태국 \(내 위치\)$/);
    await expect(input).not.toHaveValue(/서귀포|제주/);
    await submitOrigin(page);
    const userBubble = page.getByText(/에서 .*HKT/).first();
    await expect(userBubble).toBeVisible({ timeout: 30_000 });
    expect((await userBubble.innerText()).match(/알려줘/g)).toHaveLength(1);
    await expect(userBubble).toContainText('PUS');
    await expect(userBubble).not.toContainText('대중교통과 차로');
    const chip = page.getByTestId('mooni-destination-resolution');
    await expect(chip).toContainText(/HKT → PUS/);
    await expect(chip).not.toContainText('알려줘');
    const width = testInfo.project.name.includes('1280') ? 1280 : 390;
    mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: join(OUT_DIR, `live-haeundae-khao-lak-${width}.png`),
      clip: shotBox(width),
    });
  });

  test('Chuncheon festival from Bangkok', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.includes('webkit'), '390 and 1280 chromium');
    await openAccess(page, context, { festivalId: '2989642', latitude: 13.7563, longitude: 100.5018 });
    const input = page.getByTestId('mooni-origin-input');
    await expect(input).toHaveValue(/ · 태국 \(내 위치\)$/, { timeout: 30_000 });
    await expect(input).not.toHaveValue(/서귀포/);
    await expect(page.getByTestId('mooni-festival-access-dock')).toHaveAttribute('data-origin-kind', 'overseas');
    await submitOrigin(page);
    const userBubble = page.getByText(/BKK/).first();
    await expect(userBubble).toBeVisible({ timeout: 30_000 });
    expect((await userBubble.innerText()).match(/알려줘/g)).toHaveLength(1);
    await expect(userBubble).toContainText('ICN');
    await expect(userBubble).not.toContainText('DMK');
    const chip = page.getByTestId('mooni-destination-resolution');
    await expect(chip).toContainText('BKK → ICN');
    await expect(chip).not.toContainText('알려줘');
    const width = testInfo.project.name.includes('1280') ? 1280 : 390;
    mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: join(OUT_DIR, `live-chuncheon-bangkok-${width}.png`),
      clip: shotBox(width),
    });
  });

  test('Chuncheon festival from Seoul', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.includes('webkit'), '390 and 1280 chromium');
    await openAccess(page, context, { festivalId: '2989642', latitude: 37.5665, longitude: 126.978 });
    const input = page.getByTestId('mooni-origin-input');
    await expect(input).toHaveValue('서울 · 특별시 (내 위치)');
    await submitOrigin(page);
    const userBubble = page.getByText('서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘').first();
    await expect(userBubble).toBeVisible({ timeout: 30_000 });
    expect((await userBubble.innerText()).match(/알려줘/g)).toHaveLength(1);
    const chip = page.getByTestId('mooni-destination-resolution');
    await expect(chip).toContainText('서울');
    await expect(chip).not.toContainText('대중교통');
    const width = testInfo.project.name.includes('1280') ? 1280 : 390;
    mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: join(OUT_DIR, `live-chuncheon-seoul-${width}.png`),
      clip: shotBox(width),
    });
  });
});

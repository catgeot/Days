import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';
import { enableMooniE2eLoggedIn, openFestivalMooni } from './mooni-festival-chip-helpers.js';

const OUT_DIR = '/opt/cursor/artifacts/mooni-origin-input';
const FESTIVAL_ID = '2989642';

function shotBox(width) {
  return { x: 0, y: 0, width, height: width === 1280 ? 900 : 844 };
}

async function saveShot(page, name, width) {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, name);
  await page.screenshot({ path, clip: shotBox(width) });
  return path;
}

async function installGemini(context, calls, { status = 200 } = {}) {
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
    if (request.method() !== 'POST') {
      await route.fallback();
      return;
    }
    let task = '';
    try {
      task = String(request.postDataJSON()?.task || '');
    } catch {
      task = '';
    }
    calls.push(task);
    if (status !== 200) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({}),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(buildGeminiProxyMockBody('E2E-MOCK-9f3a 춘천에서 축제장까지', { modelUsed: 'mock-origin' })),
    });
  });
}

async function openOriginDock(page, context, { lang = 'ko', calls = null, geminiStatus = 200 } = {}) {
  if (calls) await installGemini(context, calls, { status: geminiStatus });
  await enableMooniE2eLoggedIn(page);
  await page.addInitScript((language) => {
    try {
      localStorage.removeItem('gateo.domesticOriginCityId');
      if (language === 'en') localStorage.setItem('gateo.locale', 'en');
    } catch {
      /* ignore */
    }
  }, lang);
  if (lang === 'en') {
    await page.goto(`/korea/?festival=${FESTIVAL_ID}&lang=en`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
    await mooniBtn.waitFor({ state: 'attached', timeout: 90_000 });
    await mooniBtn.click({ force: true, timeout: 15_000 });
    await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 120_000 });
  } else {
    await openFestivalMooni(page, FESTIVAL_ID);
  }
  const access = lang === 'en' ? /Getting there/i : /가는 법/;
  await page.getByRole('button', { name: access }).first().click({ force: true });
  await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible({ timeout: 20_000 });
}

async function chipRowCount(page) {
  return page.getByTestId('mooni-origin-chips').locator('button').evaluateAll((els) => {
    const tops = els.map((el) => Math.round(el.getBoundingClientRect().top));
    return new Set(tops).size;
  });
}

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

test.beforeEach(async ({ context }) => {
  process.env.MOONI_TOURAPI_STUB_ONLY = '1';
  await installFestivalTourApiFixtures(context, { festivalId: FESTIVAL_ID });
});

test('390 default chips stay on one row and expand without moving the thread', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('1280'), 'wide project only checks the default dock');
  const calls = [];
  await openOriginDock(page, context, { calls });
  await expect(page.locator('[data-festival-origin="seoul"]')).toBeVisible();
  await expect(page.locator('[data-festival-origin="daegu"]')).toBeVisible();
  await expect(page.locator('[data-festival-origin="incheon"]')).toBeVisible();
  await expect(page.locator('[data-festival-origin]')).toHaveCount(6);
  expect(await chipRowCount(page)).toBe(1);
  const chips = page.getByTestId('mooni-origin-chips');
  const fit = await chips.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(fit).toBe(true);
  const width = testInfo.project.name.includes('webkit') ? 390 : 390;
  if (testInfo.project.name.includes('chromium')) {
    await saveShot(page, 'default-390-chromium.png', width);
  }
  const scroller = page.getByTestId('mooni-message-scroll');
  await scroller.evaluate((el) => {
    const pad = document.createElement('div');
    pad.setAttribute('data-e2e-pad', '1');
    pad.style.height = '1800px';
    el.appendChild(pad);
    el.scrollTop = 220;
  });
  await page.getByTestId('mooni-origin-more').click();
  await expect(page.locator('[data-festival-origin]')).toHaveCount(17);
  expect(await chipRowCount(page)).toBeLessThanOrEqual(3);
  const expandedFit = await chips.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(expandedFit).toBe(true);
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(220);
  if (testInfo.project.name.includes('chromium')) {
    await saveShot(page, 'expanded-390-chromium.png', 390);
  }
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual([]);
});

test('typing 춘천 asks once, only after the candidate tap', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('390'), 'behavior is covered on the 390 projects');
  const calls = [];
  await openOriginDock(page, context, { calls });
  const input = page.getByTestId('mooni-origin-input');
  await input.fill('춘천');
  await expect(page.getByTestId('mooni-origin-option').first()).toContainText('춘천');
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual([]);
  if (testInfo.project.name.includes('chromium')) {
    await saveShot(page, 'chuncheon-390-chromium.png', 390);
  }
  await page.getByTestId('mooni-origin-option').first().click();
  await expect(page.getByText(/E2E-MOCK-9f3a/).first()).toBeVisible({ timeout: 30_000 });
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
});

test('광주 and ㅊㅊ show candidates without sending', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('chromium-390'), 'screenshots are captured once');
  const calls = [];
  await openOriginDock(page, context, { calls });
  const input = page.getByTestId('mooni-origin-input');
  await input.fill('광주');
  await expect(page.getByTestId('mooni-origin-option')).toHaveCount(2);
  await saveShot(page, 'gwangju-390-chromium.png', 390);
  await input.fill('ㅊㅊ');
  await expect(page.getByTestId('mooni-origin-option').first()).toContainText('춘천');
  await saveShot(page, 'choseong-390-chromium.png', 390);
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual([]);
});

test('english dock uses the departure placeholder', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('chromium-390'), 'english screenshot is captured once');
  await openOriginDock(page, context, { lang: 'en', calls: [] });
  await expect(page.getByTestId('mooni-origin-input')).toHaveAttribute('placeholder', /Departure city/);
  await saveShot(page, 'en-390-chromium.png', 390);
});

test('denied location fills nothing and asks nothing', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('390'), 'behavior is covered on the 390 projects');
  await page.addInitScript(() => {
    if (!navigator.permissions) return;
    const original = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (desc) => {
      if (desc && desc.name === 'geolocation') {
        return Promise.resolve({ state: 'denied' });
      }
      return original(desc);
    };
  });
  const calls = [];
  await openOriginDock(page, context, { calls });
  await page.getByTestId('mooni-origin-locate').click();
  await expect(page.getByTestId('mooni-origin-locate-error')).toContainText('위치를 쓸 수 없어요');
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual([]);
});

test('a code-less 429 shows the busy line and does not send again', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('chromium-390'), '429 is asserted once');
  const calls = [];
  await openOriginDock(page, context, { calls, geminiStatus: 429 });
  await page.getByTestId('mooni-origin-input').fill('춘천');
  await page.getByTestId('mooni-origin-option').first().click();
  await expect(page.getByText('질문이 잠시 몰렸어요').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(600);
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  await expect(page.getByTestId('mooni-origin-input')).toHaveValue(/춘천/);
});

test('1280 default dock', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('1280'), 'desktop screenshot only');
  await openOriginDock(page, context, { calls: [] });
  await expect(page.locator('[data-festival-origin="seoul"]')).toBeVisible();
  await saveShot(page, 'default-1280-chromium.png', 1280);
});

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

async function installGemini(context, calls, { status = 200, mockText = 'E2E-MOCK-9f3a 춘천에서 축제장까지' } = {}) {
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
      body: JSON.stringify(buildGeminiProxyMockBody(mockText, { modelUsed: 'mock-origin' })),
    });
  });
}

async function openOriginDock(page, context, {
  lang = 'ko',
  calls = null,
  geminiStatus = 200,
  festivalId = FESTIVAL_ID,
  mockText,
} = {}) {
  if (calls) await installGemini(context, calls, { status: geminiStatus, mockText });
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
    await page.goto(`/korea/?festival=${festivalId}&lang=en`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
    await mooniBtn.waitFor({ state: 'attached', timeout: 90_000 });
    await mooniBtn.click({ force: true, timeout: 15_000 });
    await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 120_000 });
  } else {
    await openFestivalMooni(page, festivalId);
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

function shotBrowser(testInfo) {
  return testInfo.project.name.includes('webkit') ? 'webkit' : 'chromium';
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
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  await page.waitForTimeout(200);
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  if (testInfo.project.name.includes('390')) {
    await saveShot(page, `closed-390-${shotBrowser(testInfo)}.png`, 390);
  }
  await input.click();
  await expect(page.getByTestId('mooni-origin-options')).toBeVisible();
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
});

test('광주 and ㅊㅊ show candidates without sending', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('390'), 'labels are checked on the 390 projects');
  const calls = [];
  await openOriginDock(page, context, { calls });
  const input = page.getByTestId('mooni-origin-input');
  await input.fill('광주');
  await expect(page.getByTestId('mooni-origin-option')).toHaveCount(2);
  await expect(page.getByTestId('mooni-origin-option').nth(0)).toHaveText('광주 · 광역시');
  await expect(page.getByTestId('mooni-origin-option').nth(1)).toHaveText('광주 · 경기');
  await saveShot(page, `gwangju-390-${shotBrowser(testInfo)}.png`, 390);
  await input.fill('ㅊㅊ');
  await expect(page.getByTestId('mooni-origin-option').first()).toContainText('춘천');
  if (testInfo.project.name.includes('chromium')) {
    await saveShot(page, 'choseong-390-chromium.png', 390);
  }
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual([]);
});

test('english dock uses the departure placeholder', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('390'), 'english layout is checked on the 390 projects');
  await openOriginDock(page, context, { lang: 'en', calls: [] });
  await expect(page.getByTestId('mooni-origin-input')).toHaveAttribute('placeholder', /Departure city/);
  await expect(page.locator('[data-festival-origin]')).toHaveCount(6);
  expect(await chipRowCount(page)).toBe(1);
  const chips = page.getByTestId('mooni-origin-chips');
  const box = await chips.boundingBox();
  expect(box?.width ?? 999).toBeLessThanOrEqual(390);
  const metrics = await chips.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  expect(metrics.scroll, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.client + 1);
  await expect(page.getByTestId('mooni-origin-more')).toBeVisible();
  await saveShot(page, `en-chips-390-${shotBrowser(testInfo)}.png`, 390);
  const input = page.getByTestId('mooni-origin-input');
  await input.fill('Gwangju');
  await expect(page.getByTestId('mooni-origin-option').nth(0)).toHaveText('Gwangju · Metropolitan City');
  await expect(page.getByTestId('mooni-origin-option').nth(1)).toHaveText('Gwangju · Gyeonggi');
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

test('enter, an unknown place, and a chip close the list without a second send', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('390'), 'behavior is covered on the 390 projects');
  const calls = [];
  await openOriginDock(page, context, { calls });
  const input = page.getByTestId('mooni-origin-input');
  const sent = () => calls.filter((task) => task === 'mooni_chat');
  await input.fill('춘천시');
  await expect(page.getByTestId('mooni-origin-option')).toHaveCount(1);
  await input.press('Enter');
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  await expect(page.getByText(/춘천에서 이 축제장까지/).first()).toBeVisible({ timeout: 30_000 });
  expect(sent()).toEqual(['mooni_chat']);
  await input.press('Enter');
  await page.waitForTimeout(200);
  expect(sent()).toEqual(['mooni_chat']);

  await input.click();
  await input.fill('화성시청');
  await expect(page.getByTestId('mooni-origin-ask')).toContainText('화성시청');
  await page.getByTestId('mooni-origin-ask').click();
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  await expect(page.getByText(/화성시청에서 이 축제장까지/).first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => sent().length).toBe(2);
  await page.waitForTimeout(200);
  expect(sent()).toEqual(['mooni_chat', 'mooni_chat']);

  await input.click();
  await input.fill('춘천');
  await expect(page.getByTestId('mooni-origin-option').first()).toBeVisible();
  await page.locator('[data-festival-origin="seoul"]').evaluate((el) => el.click());
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  await expect(page.getByText(/서울에서 이 축제장까지/).first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => sent().length).toBe(3);
});

test('a code-less 429 shows the busy line and does not send again', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('390'), '429 is asserted on the 390 projects');
  const calls = [];
  await openOriginDock(page, context, { calls, geminiStatus: 429 });
  const input = page.getByTestId('mooni-origin-input');
  await input.fill('화성시청');
  await expect(page.getByTestId('mooni-origin-ask')).toBeVisible();
  await page.getByTestId('mooni-origin-ask').click();
  await expect(page.getByText('질문이 잠시 몰렸어요').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  await page.waitForTimeout(600);
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  await expect(page.getByTestId('mooni-origin-options')).toHaveCount(0);
  await expect(input).toHaveValue('화성시청');
  await input.press('Enter');
  await page.waitForTimeout(200);
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
});

test('1280 default dock', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('1280'), 'desktop screenshot only');
  await openOriginDock(page, context, { calls: [] });
  await expect(page.locator('[data-festival-origin="seoul"]')).toBeVisible();
  await saveShot(page, 'default-1280-chromium.png', 1280);
});

const OVERSEAS_SHOTS = '/opt/cursor/artifacts/overseas-origin';

async function mockReverseGeocode(context) {
  await context.route(/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\//i, async (route) => {
    const url = new URL(route.request().url());
    const lang = url.searchParams.get('language') || 'ko';
    const ko = lang.startsWith('ko');
    const bangkok = url.pathname.includes('100.5018');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        features: [{
          id: bangkok ? 'place.bangkok' : 'place.khaolak',
          text: bangkok ? (ko ? '방콕' : 'Bangkok') : (ko ? '카오락' : 'Khao Lak'),
          place_type: ['place'],
          center: bangkok ? [100.5018, 13.7563] : [98.2475, 8.6374],
          context: [{ id: 'country.th', text: ko ? '태국' : 'Thailand' }],
        }],
      }),
    });
  });
}

async function saveOverseasShot(page, name, width) {
  mkdirSync(OVERSEAS_SHOTS, { recursive: true });
  await page.screenshot({
    path: join(OVERSEAS_SHOTS, name),
    clip: shotBox(width),
  });
}

async function openLocatedOrigin(page, context, { latitude, longitude, lang = 'ko', festivalId } = {}) {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude, longitude });
  await mockReverseGeocode(context);
  const calls = [];
  await openOriginDock(page, context, { calls, lang, festivalId });
  await page.getByTestId('mooni-origin-locate').click();
  return calls;
}

test('Khao Lak my-location stays in Thailand and flies HKT, not Seogwipo', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const calls = await openLocatedOrigin(page, context, { latitude: 8.6374, longitude: 98.2475 });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('카오락 · 태국 (내 위치)');
  await expect(page.getByTestId('mooni-festival-access-dock')).toHaveAttribute('data-origin-kind', 'overseas');
  await expect(input).not.toHaveValue(/서귀포|제주/);
  await input.press('Enter');
  const bubble = page.getByText(/카오락 · 태국에서/).first();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toContainText('HKT');
  await expect(bubble).toContainText('ICN');
  await expect(bubble).not.toContainText('서귀포');
  expect((await bubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('카오락 · 태국 (HKT → ICN)');
  await expect(chip).not.toContainText('알려줘');
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `khao-lak-${width}.png`, width);
});

test('Bangkok my-location uses Suvarnabhumi, not Don Mueang or a Korean city', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  await openLocatedOrigin(page, context, { latitude: 13.7563, longitude: 100.5018 });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('방콕 · 태국 (내 위치)');
  await expect(input).not.toHaveValue(/서귀포/);
  await input.press('Enter');
  const bubble = page.getByText(/방콕 · 태국에서/).first();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toContainText('BKK');
  await expect(bubble).not.toContainText('DMK');
  await expect(bubble).not.toContainText('서귀포');
  expect((await bubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('방콕 · 태국 (BKK → ICN)');
  await expect(chip).not.toContainText('알려줘');
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `bangkok-${width}.png`, width);
});

test('domestic Seoul my-location still names Seoul and stays on the ground ask', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('chromium-390'), 'one domestic geolocation check');
  const calls = await openLocatedOrigin(page, context, { latitude: 37.5665, longitude: 126.978 });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('서울 · 특별시 (내 위치)');
  await expect(page.getByTestId('mooni-festival-access-dock')).toHaveAttribute('data-origin-kind', 'domestic');
  await input.press('Enter');
  const seoulBubble = page.getByText(/서울에서 이 축제장까지 대중교통과 차로/).first();
  await expect(seoulBubble).toBeVisible({ timeout: 30_000 });
  await expect(seoulBubble).toHaveText('서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘');
  expect((await seoulBubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const seoulChip = page.getByTestId('mooni-destination-resolution');
  await expect(seoulChip).toContainText('서울');
  await expect(seoulChip).not.toContainText('대중교통');
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  await saveOverseasShot(page, 'seoul-390.png', 390);
});

test('Haeundae light festival from Khao Lak flies HKT to PUS', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const calls = [];
  await installGemini(context, calls, { mockText: 'E2E-MOCK-9f3a 해운대에서 축제장까지' });
  await enableMooniE2eLoggedIn(page);
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('gateo.domesticOriginCityId');
    } catch {
      /* ignore */
    }
  });
  await openFestivalMooni(page, '2048902');
  await expect(page.getByText('해운대 빛축제').first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /가는 법/ }).first().click({ force: true });
  await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible({ timeout: 20_000 });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 8.6374, longitude: 98.2475 });
  await mockReverseGeocode(context);
  await page.getByTestId('mooni-origin-locate').click();
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('카오락 · 태국 (내 위치)');
  await input.press('Enter');
  const bubble = page.getByText(/카오락 · 태국에서/).first();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toContainText('HKT');
  await expect(bubble).toContainText('PUS');
  await expect(bubble).not.toContainText('서귀포');
  expect((await bubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('카오락 · 태국 (HKT → PUS)');
  await expect(chip).not.toContainText('알려줘');
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `haeundae-khao-lak-${width}.png`, width);
});

test('English Khao Lak ask is not wrapped twice and the chip stays short', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  await openLocatedOrigin(page, context, { latitude: 8.6374, longitude: 98.2475, lang: 'en' });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('Khao Lak · Thailand (my location)');
  await input.press('Enter');
  const bubble = page.getByText(/How do I get from Khao Lak, Thailand/).first();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  expect((await bubble.innerText()).match(/How do I get from/g)).toHaveLength(1);
  await expect(bubble).not.toContainText('public transit');
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('Khao Lak · Thailand (HKT → ICN)');
  await expect(chip).not.toContainText('How do I get from');
});

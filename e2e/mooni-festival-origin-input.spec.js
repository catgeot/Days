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

const MY_LOCATION_BUBBLE_KO = '내 위치에서 이 축제장까지 가는 법을 알려줘';
const MY_LOCATION_BUBBLE_EN = 'How do I get from my location to this festival?';

function contrastRatio(fg, bg) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(fg);
  const l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseRgb(color) {
  const match = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  const alpha = match[4] == null ? 1 : Number(match[4]);
  const rgb = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (alpha >= 0.99) return rgb;
  return rgb.map((channel) => Math.round(channel * alpha + 255 * (1 - alpha)));
}

async function readPaint(locator, pseudo = null) {
  return locator.evaluate((el, which) => {
    const paint = which ? getComputedStyle(el, which) : getComputedStyle(el);
    let node = el;
    let bg = getComputedStyle(el).backgroundColor;
    while (node && (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
      node = node.parentElement;
      if (!node) break;
      bg = getComputedStyle(node).backgroundColor;
    }
    return { fg: which ? paint.color : getComputedStyle(el).color, bg };
  }, pseudo);
}

async function expectContrast(locator, min, label) {
  const paint = await readPaint(locator);
  const fg = parseRgb(paint.fg);
  const bg = parseRgb(paint.bg);
  expect(fg, `${label} fg ${paint.fg}`).toBeTruthy();
  expect(bg, `${label} bg ${paint.bg}`).toBeTruthy();
  const ratio = contrastRatio(fg, bg);
  expect(ratio, `${label} ${paint.fg} on ${paint.bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  return ratio;
}

async function installGemini(context, calls, { status = 200, mockText = 'E2E-MOCK-9f3a 춘천에서 축제장까지', payloads = null } = {}) {
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
    let json = null;
    try {
      json = request.postDataJSON();
      task = String(json?.task || '');
    } catch {
      task = '';
    }
    calls.push(task);
    if (payloads && task === 'mooni_chat' && json) payloads.push(json);
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
  payloads = null,
} = {}) {
  if (calls) await installGemini(context, calls, { status: geminiStatus, mockText, payloads });
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

const CITY_REVERSE_PLACES = [
  ['100.5018', '방콕', 'Bangkok', '태국', 'Thailand'],
  ['98.9853', '치앙마이', 'Chiang Mai', '태국', 'Thailand'],
  ['98.9063', '크라비', 'Krabi', '태국', 'Thailand'],
  ['103.8198', '싱가포르', 'Singapore', '싱가포르', 'Singapore'],
  ['98.2475', '카오락', 'Khao Lak', '태국', 'Thailand'],
];

const DISTRICT_REVERSE_PLACES = [
  ['100.5018', '프라나콘', 'Phra Nakhon', '태국', 'Thailand'],
  ['98.9853', '므앙치앙마이군', 'Mueang Chiang Mai', '태국', 'Thailand'],
  ['98.9063', '므앙끄라비군', 'Mueang Krabi', '태국', 'Thailand'],
  ['103.8198', 'Central Water Catchment', 'Central Water Catchment', '싱가포르', 'Singapore'],
  ['98.3648', '따꾸아빠군', 'Takua Pa', '태국', 'Thailand'],
];

async function mockReverseGeocode(context, places = CITY_REVERSE_PLACES) {
  await context.route(/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\//i, async (route) => {
    const url = new URL(route.request().url());
    const lang = url.searchParams.get('language') || 'ko';
    const ko = lang.startsWith('ko');
    const hit = places.find(([lng]) => url.pathname.includes(lng)) || places[4];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        features: [{
          id: `place.${hit[1]}`,
          text: ko ? hit[1] : hit[2],
          place_type: ['place'],
          center: [Number(hit[0]), 0],
          context: [{ id: 'country.x', text: ko ? hit[3] : hit[4] }],
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

async function openLocatedOrigin(page, context, {
  latitude,
  longitude,
  lang = 'ko',
  festivalId,
  payloads = null,
  places = null,
  mockText,
} = {}) {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude, longitude });
  await mockReverseGeocode(context, places || undefined);
  const calls = [];
  await openOriginDock(page, context, { calls, lang, festivalId, payloads, mockText });
  await page.getByTestId('mooni-origin-locate').click();
  return calls;
}

test('Khao Lak my-location stays in Thailand and flies HKT, not Seogwipo', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const payloads = [];
  const calls = await openLocatedOrigin(page, context, { latitude: 8.6374, longitude: 98.2475, payloads });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('카오락 · 태국 (내 위치)');
  await expect(page.getByTestId('mooni-festival-access-dock')).toHaveAttribute('data-origin-kind', 'overseas');
  await expect(input).not.toHaveValue(/서귀포|제주/);
  await input.press('Enter');
  const bubble = page.getByTestId('mooni-user-bubble').last();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toHaveText(MY_LOCATION_BUBBLE_KO);
  await expect(bubble).not.toContainText('HKT');
  await expect(bubble).not.toContainText('ICN');
  await expect(bubble).not.toContainText('서귀포');
  expect((await bubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const sent = payloads.at(-1);
  expect(sent?.params?.userText || '').toContain('HKT');
  expect(sent?.params?.userText || '').toContain('ICN');
  expect(sent?.params?.userText || '').toContain('카오락');
  expect(sent?.params?.tripSession?.departureIata).toBe('HKT');
  expect(sent?.params?.tripSession?.arrivalIata).toBe('ICN');
  expect(sent?.params?.koreaFestivalHint || '').toContain('HKT');
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('카오락 · 태국 (HKT → ICN)');
  await expect(chip).not.toContainText('알려줘');
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `khao-lak-${width}.png`, width);
});

test('Bangkok my-location uses Suvarnabhumi, not Don Mueang or a Korean city', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const payloads = [];
  await openLocatedOrigin(page, context, { latitude: 13.7563, longitude: 100.5018, payloads });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('방콕 · 태국 (내 위치)');
  await expect(input).not.toHaveValue(/서귀포/);
  await input.press('Enter');
  const bubble = page.getByTestId('mooni-user-bubble').last();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toHaveText(MY_LOCATION_BUBBLE_KO);
  await expect(bubble).not.toContainText('BKK');
  await expect(bubble).not.toContainText('DMK');
  await expect(bubble).not.toContainText('서귀포');
  expect((await bubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const sent = payloads.at(-1);
  expect(sent?.params?.userText || '').toContain('BKK');
  expect(sent?.params?.userText || '').toContain('방콕');
  expect(sent?.params?.tripSession?.departureIata).toBe('BKK');
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('방콕 · 태국 (BKK → ICN)');
  await expect(chip).not.toContainText('알려줘');
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `bangkok-${width}.png`, width);
});

test('domestic Seoul my-location still names Seoul and stays on the ground ask', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.includes('chromium-390'), 'one domestic geolocation check');
  const payloads = [];
  const calls = await openLocatedOrigin(page, context, { latitude: 37.5665, longitude: 126.978, payloads });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('서울 · 특별시 (내 위치)');
  await expect(page.getByTestId('mooni-festival-access-dock')).toHaveAttribute('data-origin-kind', 'domestic');
  await input.press('Enter');
  const seoulBubble = page.getByTestId('mooni-user-bubble').last();
  await expect(seoulBubble).toBeVisible({ timeout: 30_000 });
  await expect(seoulBubble).toHaveText(MY_LOCATION_BUBBLE_KO);
  await expect(seoulBubble).not.toContainText('ICN');
  const sent = payloads.at(-1);
  expect(sent?.params?.userText || '').toContain('서울에서 이 축제장까지 대중교통과 차로');
  expect(sent?.params?.tripSession?.departureIata).toBe('ICN');
  const seoulChip = page.getByTestId('mooni-destination-resolution');
  await expect(seoulChip).toContainText('서울 (ICN)');
  await expect(seoulChip).not.toContainText('대중교통');
  expect(calls.filter((task) => task === 'mooni_chat')).toEqual(['mooni_chat']);
  await saveOverseasShot(page, 'seoul-390.png', 390);
});

test('Haeundae light festival from Khao Lak flies HKT to PUS', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const calls = [];
  const payloads = [];
  await installGemini(context, calls, { mockText: 'E2E-MOCK-9f3a 해운대에서 축제장까지', payloads });
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
  const bubble = page.getByTestId('mooni-user-bubble').last();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toHaveText(MY_LOCATION_BUBBLE_KO);
  await expect(bubble).not.toContainText('HKT');
  await expect(bubble).not.toContainText('PUS');
  await expect(bubble).not.toContainText('서귀포');
  expect((await bubble.innerText()).match(/알려줘/g)).toHaveLength(1);
  const sent = payloads.at(-1);
  expect(sent?.params?.userText || '').toContain('HKT');
  expect(sent?.params?.userText || '').toContain('PUS');
  expect(sent?.params?.userText || '').toContain('카오락');
  expect(sent?.params?.tripSession?.departureIata).toBe('HKT');
  expect(sent?.params?.tripSession?.arrivalIata).toBe('PUS');
  expect(sent?.params?.koreaFestivalHint || '').toContain('HKT');
  if (testInfo.project.name.includes('chromium-390')) {
    await expectContrast(bubble, 4.5, 'user bubble');
    await expectContrast(page.getByTestId('mooni-origin-locate'), 3, 'festival locate');
    await expectContrast(page.locator('[data-festival-origin="seoul"]'), 4.5, 'festival chip');
    await expectContrast(page.getByTestId('mooni-destination-resolution'), 4.5, 'origin chip');
    await expectContrast(page.getByText('Me', { exact: true }).last(), 4.5, 'me label');
    await expectContrast(page.getByRole('link', { name: '코레일' }), 4.5, 'reply link');
    await expectContrast(page.getByText('MOONi', { exact: true }).first(), 4.5, 'mooni label');
    const placeholder = await readPaint(page.getByTestId('mooni-origin-input'), '::placeholder');
    const placeholderRatio = contrastRatio(parseRgb(placeholder.fg), parseRgb(placeholder.bg));
    expect(placeholderRatio, `festival placeholder ${placeholderRatio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
  }
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('카오락 · 태국 (HKT → PUS)');
  await expect(chip).not.toContainText('알려줘');
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `haeundae-khao-lak-${width}.png`, width);
});

test('English Khao Lak ask is not wrapped twice and the chip stays short', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const payloads = [];
  await openLocatedOrigin(page, context, { latitude: 8.6374, longitude: 98.2475, lang: 'en', payloads });
  const input = page.getByTestId('mooni-origin-input');
  await expect(input).toHaveValue('Khao Lak · Thailand (my location)');
  await input.press('Enter');
  const bubble = page.getByTestId('mooni-user-bubble').last();
  await expect(bubble).toBeVisible({ timeout: 30_000 });
  await expect(bubble).toHaveText(MY_LOCATION_BUBBLE_EN);
  expect((await bubble.innerText()).match(/How do I get from/g)).toHaveLength(1);
  await expect(bubble).not.toContainText('public transit');
  const chip = page.getByTestId('mooni-destination-resolution');
  await expect(chip).toContainText('Khao Lak · Thailand (HKT → ICN)');
  await expect(chip).not.toContainText('How do I get from');
  const sent = payloads.at(-1);
  expect(sent?.params?.userText || '').toContain('Khao Lak');
  expect(sent?.params?.userText || '').toContain('HKT');
  expect(sent?.params?.userText || '').toContain('ICN');
  expect(sent?.params?.tripSession?.departureIata).toBe('HKT');
});

test('Khao Lak place origin locate icon meets contrast', async ({ page, context }, testInfo) => {
  await installGemini(context, []);
  await page.goto('/place/khao-lak/gallery?lang=ko', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
  if (await hint.isVisible({ timeout: 3000 }).catch(() => false)) await hint.click();
  const mooniBtn = page.locator('.place-header-mooni-btn').first();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
  const dock = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
  await expect(dock).toBeVisible({ timeout: 60_000 });
  await expectContrast(dock.getByRole('button').first(), 4.5, 'topic chip');
  await dock.getByRole('button', { name: /✈️\s*가는 방법/ }).click({ force: true });
  const expand = page.getByRole('button', { name: /출발지 검색 펼치기|Expand departure search/i });
  if (await expand.isVisible({ timeout: 8_000 }).catch(() => false)) await expand.click();
  const input = page.locator('input[aria-autocomplete="list"]').first();
  await expect(input).toBeVisible({ timeout: 30_000 });
  await expectContrast(page.getByTestId('flight-origin-locate'), 3, 'place locate');
  await expectContrast(input.locator('xpath=preceding-sibling::*[name()="svg"]').first(), 3, 'place search icon');
  await expectContrast(input, 4.5, 'place origin input');
  const placeholder = await readPaint(input, '::placeholder');
  const placeholderRatio = contrastRatio(parseRgb(placeholder.fg), parseRgb(placeholder.bg));
  expect(placeholderRatio, `place placeholder ${placeholderRatio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
  const collapse = page.getByRole('button', { name: /출발지 검색 접기/ });
  if (await collapse.isVisible().catch(() => false)) {
    await expectContrast(collapse, 4.5, 'collapse search');
  }
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  await saveOverseasShot(page, `khao-lak-place-origin-${width}.png`, width);
});

const SHARED_ORIGINS = [
  { latitude: 13.7563, longitude: 100.5018, city: '방콕', iata: 'BKK' },
  { latitude: 18.7883, longitude: 98.9853, city: '치앙마이', iata: 'CNX' },
  { latitude: 8.0863, longitude: 98.9063, city: '크라비', iata: 'KBV' },
  { latitude: 1.3521, longitude: 103.8198, city: '싱가포르', iata: 'SIN' },
  { latitude: 37.8813, longitude: 127.7298, city: '춘천', iata: 'ICN', domestic: true },
];

test('festival my-location uses the same airports on every origin', async ({ page, context }) => {
  await mockReverseGeocode(context);
  for (const origin of SHARED_ORIGINS) {
    const payloads = [];
    await openLocatedOrigin(page, context, { ...origin, payloads });
    const input = page.getByTestId('mooni-origin-input');
    await expect(input).toHaveValue(new RegExp(origin.city));
    await input.press('Enter');
    const bubble = page.getByTestId('mooni-user-bubble').last();
    await expect(bubble).toBeVisible({ timeout: 30_000 });
    await expect(bubble).toHaveText(MY_LOCATION_BUBBLE_KO);
    await expect(bubble).not.toContainText(origin.iata);
    await expect.poll(() => {
      const row = [...payloads].reverse().find((item) => {
        const text = String(item?.params?.userText || '');
        if (!text.includes(`${origin.city}에서`) && !text.includes(`${origin.city} ·`)) return false;
        return origin.domestic || text.includes(origin.iata);
      });
      return row?.params?.tripSession?.departureIata || '';
    }, { timeout: 30_000 }).toBe(origin.iata);
    const sent = [...payloads].reverse().find((item) => {
      const text = String(item?.params?.userText || '');
      if (!text.includes(`${origin.city}에서`) && !text.includes(`${origin.city} ·`)) return false;
      return origin.domestic || text.includes(origin.iata);
    });
    const chip = page.getByTestId('mooni-destination-resolution').last();
    await expect(chip).toContainText(origin.city);
    await expect(chip).toContainText(origin.iata);
    if (!origin.domestic) {
      expect(sent?.params?.userText || '').toContain(origin.iata);
      await expect(chip).toContainText(`${origin.iata} →`);
    }
  }
});

test('place-card my-location flight button uses the real origin airport', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['geolocation']);
  await mockReverseGeocode(context);
  const payloads = [];
  await installGemini(context, [], { payloads });
  for (const origin of SHARED_ORIGINS) {
    payloads.length = 0;
    await context.setGeolocation({ latitude: origin.latitude, longitude: origin.longitude });
    await page.goto('/place/khao-lak/gallery?lang=ko', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
    if (await hint.isVisible({ timeout: 3000 }).catch(() => false)) await hint.click();
    const mooniBtn = page.locator('.place-header-mooni-btn').first();
    await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
    await mooniBtn.click();
    await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
    const dock = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
    await expect(dock).toBeVisible({ timeout: 60_000 });
    await dock.getByRole('button', { name: /✈️\s*가는 방법/ }).click({ force: true });
    const expand = page.getByRole('button', { name: /출발지 검색 펼치기|Expand departure search/i });
    if (await expand.isVisible({ timeout: 8_000 }).catch(() => false)) await expand.click();
    await page.getByTestId('flight-origin-locate').click();
    const bubble = page.getByTestId('mooni-user-bubble').last();
    await expect(bubble).toBeVisible({ timeout: 30_000 });
    await expect(bubble).toHaveText('내 위치에서 이 여행지까지 가는 법을 알려줘');
    await expect(bubble).not.toContainText(origin.iata);
    await expect.poll(() => {
      const row = [...payloads].reverse().find((item) => {
        const text = String(item?.params?.userText || '');
        if (!text.includes(origin.city) || !text.includes('에서')) return false;
        return origin.domestic || text.includes(origin.iata);
      });
      return row?.params?.tripSession?.departureIata || '';
    }, { timeout: 30_000 }).toBe(origin.iata);
    const sent = [...payloads].reverse().find((item) => {
      const text = String(item?.params?.userText || '');
      if (!text.includes(origin.city) || !text.includes('에서')) return false;
      return origin.domestic || text.includes(origin.iata);
    });
    expect(sent?.params?.userText || '', origin.city).toContain(origin.iata);
    const chip = page.getByTestId('mooni-destination-resolution').last();
    await expect(chip).toContainText(origin.city);
    await expect(chip).toContainText(`${origin.iata} → HKT`);
    const flight = page.getByRole('button', { name: new RegExp(`${origin.iata}.*HKT`) });
    await expect(flight).toBeVisible({ timeout: 30_000 });
    if (origin.iata !== 'ICN') await expect(flight).not.toContainText('ICN');
    if (origin.iata === 'BKK') {
      const width = testInfo.project.name.includes('1280') ? 1280 : 390;
      await saveOverseasShot(page, `khao-lak-place-flight-${width}.png`, width);
    }
  }
});

test('district reverse geocode shows the city and keeps the airport code', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  const origins = [
    [13.7563, 100.5018, '방콕', 'BKK', '프라나콘', 'bangkok'],
    [8.8295, 98.3648, '카오락', 'HKT', '따꾸아빠군', 'khao-lak'],
    [18.7883, 98.9853, '치앙마이', 'CNX', '므앙치앙마이군', 'chiang-mai'],
    [8.0863, 98.9063, '크라비', 'KBV', '므앙끄라비군', 'krabi'],
    [1.3521, 103.8198, '싱가포르', 'SIN', 'Central Water Catchment', 'singapore'],
  ];
  for (const [latitude, longitude, city, iata, district, slug] of origins) {
    const payloads = [];
    await openLocatedOrigin(page, context, {
      latitude,
      longitude,
      payloads,
      places: DISTRICT_REVERSE_PLACES,
    });
    const input = page.getByTestId('mooni-origin-input');
    await expect(input).toHaveValue(`${city} · ${city === '싱가포르' ? '싱가포르' : '태국'} (내 위치)`);
    await expect(input).not.toHaveValue(new RegExp(district));
    await input.press('Enter');
    const sent = payloads.at(-1);
    expect(sent?.params?.userText || '', city).toContain(city);
    expect(sent?.params?.userText || '', iata).toContain(iata);
    expect(sent?.params?.userText || '', district).not.toContain(district);
    expect(sent?.params?.tripSession?.departureIata).toBe(iata);
    const chip = page.getByTestId('mooni-destination-resolution').last();
    await expect(chip).toContainText(city);
    await expect(chip).toContainText(iata);
    await expect(chip).not.toContainText(district);
    if (slug === 'bangkok' || slug === 'khao-lak') {
      await saveOverseasShot(page, `district-city-${slug}-${width}.png`, width);
    }
  }
});

test('korean transit links stay for a domestic leg and drop for an overseas hop', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes('webkit'), 'captures are chromium 390 and 1280');
  const width = testInfo.project.name.includes('1280') ? 1280 : 390;
  const reply = '공항에서 행사장까지 이어서 안내해요.';
  await openOriginDock(page, context, { calls: [], mockText: reply });
  const input = page.getByTestId('mooni-origin-input');
  await input.fill('춘천시');
  await expect(page.getByTestId('mooni-origin-option')).toHaveCount(1);
  await input.press('Enter');
  const homeReply = page.getByTestId('mooni-model-reply').last();
  await expect(homeReply).toContainText('열차·버스 시각은', { timeout: 30_000 });
  await saveShot(page, `transit-footer-chuncheon-${width}.png`, width);

  const payloads = [];
  await openLocatedOrigin(page, context, {
    latitude: 8.8295,
    longitude: 98.3648,
    payloads,
    places: DISTRICT_REVERSE_PLACES,
    mockText: reply,
  });
  await expect(page.getByTestId('mooni-origin-input')).toHaveValue('카오락 · 태국 (내 위치)');
  await page.getByTestId('mooni-origin-input').press('Enter');
  const landed = page.getByTestId('mooni-model-reply').last();
  await expect(landed).toContainText('열차·버스 시각은', { timeout: 30_000 });
  expect(payloads.at(-1)?.params?.tripSession?.departureIata).toBe('HKT');
  expect(payloads.at(-1)?.params?.tripSession?.arrivalIata).toBe('ICN');
  await saveShot(page, `transit-footer-khao-lak-${width}.png`, width);
});

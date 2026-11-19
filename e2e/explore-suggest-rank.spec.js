import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = '/opt/cursor/artifacts/explore-suggest-rank';
const LATE_MS = 800;

const FESTIVALS = [
  {
    contentId: '91001',
    title: '제주 반려동물 문화산업 한마당',
    titleEn: 'Jeju Pet Festival',
    eventStartDate: '20200101',
    eventEndDate: '20200108',
    addr1: '제주특별자치도 제주시',
  },
  {
    contentId: '91011',
    title: '제주 겨울빛 축제',
    titleEn: 'Jeju Winter Lights',
    eventStartDate: '20991201',
    eventEndDate: '20991231',
    addr1: '제주특별자치도 제주시',
  },
  {
    contentId: '91021',
    title: '서울 왕궁수문장 교대의식',
    titleEn: 'Seoul Royal Guard Ceremony',
    eventStartDate: '20990101',
    eventEndDate: '20991231',
    addr1: '서울특별시 종로구',
  },
  {
    contentId: '91022',
    title: '2026 서울거리공연 구석구석라이브',
    titleEn: 'Seoul Street Live',
    eventStartDate: '20990501',
    eventEndDate: '20991231',
    addr1: '서울특별시',
  },
  {
    contentId: '91023',
    title: '2026 쉬엄쉬엄모닝',
    titleEn: 'Seoul Slow Morning',
    eventStartDate: '20991018',
    eventEndDate: '20991122',
    addr1: '서울특별시 강동구',
  },
  {
    contentId: '91024',
    title: '서울빛초롱축제',
    titleEn: 'Seoul Lantern Festival',
    eventStartDate: '20991211',
    eventEndDate: '20991231',
    addr1: '서울특별시 중구',
  },
  {
    contentId: '91031',
    title: '2026 금남로 차 없는 거리',
    titleEn: 'Geumnam-ro Car Free Street',
    eventStartDate: '20200404',
    eventEndDate: '20201107',
    addr1: '광주광역시 동구',
  },
  {
    contentId: '91041',
    title: '부산국제매직페스티벌',
    titleEn: 'Busan Magic Festival',
    eventStartDate: '20990628',
    eventEndDate: '20991226',
    addr1: '부산광역시 해운대구',
  },
  {
    contentId: '91042',
    title: '부산브릿지마켓',
    titleEn: 'Busan Bridge Market',
    eventStartDate: '20991206',
    eventEndDate: '20991206',
    addr1: '부산광역시',
  },
  {
    contentId: '91043',
    title: '부산종합민속예술제',
    titleEn: 'Busan Folk Arts',
    eventStartDate: '20991115',
    eventEndDate: '20991115',
    addr1: '부산광역시 부산진구',
  },
  {
    contentId: '91044',
    title: '부산일러스트레이션페어',
    titleEn: 'Busan Illustration Fair',
    eventStartDate: '20201106',
    eventEndDate: '20201108',
    addr1: '부산광역시 해운대구',
  },
  {
    contentId: '507599',
    title: '얼음나라화천 산천어축제',
    titleEn: 'Hwacheon Sancheoneo Ice Festival',
    eventStartDate: '20270109',
    eventEndDate: '20270131',
    addr1: '강원특별자치도 화천군',
  },
];

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer, accept-profile, content-profile',
};

function jsonFulfill(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: CORS,
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

async function installLateSearchMocks(context) {
  const geminiCalls = [];
  await context.route(/gemini-proxy/i, async (route) => {
    geminiCalls.push(route.request().url());
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    await jsonFulfill(route, { ok: false, error: 'e2e-mock' });
  });
  await context.route(/\/functions\/v1\/tourapi-proxy/i, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    const post = route.request().postData() || '';
    await delay(LATE_MS);
    const items = /festivalWindow/.test(post) ? FESTIVALS : [];
    await jsonFulfill(route, { ok: true, items });
  });
  await context.route(/api\.mapbox\.com/i, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    await delay(LATE_MS);
    await jsonFulfill(route, '{"suggestions":[],"features":[]}');
  });
  await context.route(/\/rest\/v1\//i, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    await delay(LATE_MS);
    await jsonFulfill(route, '[]');
  });
  return geminiCalls;
}

async function openExplore(page, lang) {
  await page.goto(lang === 'en' ? '/explore?lang=en' : '/explore');
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

function loadingLocator(page, lang) {
  return page.getByText(lang === 'en' ? 'Loading' : '불러오는 중', { exact: true });
}

async function waitUntilLoaded(page, lang, since) {
  const loading = loadingLocator(page, lang);
  await expect(loading).toBeVisible({ timeout: 8_000 }).catch(() => {});
  await expect(loading).toHaveCount(0, { timeout: 20_000 });
  const remain = 2100 - (Date.now() - since);
  if (remain > 0) await page.waitForTimeout(remain);
  await expect(loading).toHaveCount(0);
}

async function suggestionTexts(page, lang) {
  const badge = lang === 'en' ? /City|Destination|Festival/ : /여행지|도시|축제/;
  const list = page.locator('ul').filter({ has: page.locator('button', { hasText: badge }) }).last();
  await expect(list.locator('button').first()).toBeVisible({ timeout: 20_000 });
  const texts = await list.locator('button').allTextContents();
  return texts.map((text) => text.replace(/\s+/g, ' ').trim()).filter((text) => text && !text.includes('MOONi'));
}

async function saveLoadedList(page, name) {
  mkdirSync(OUT_DIR, { recursive: true });
  const vp = page.viewportSize() || { width: 390, height: 844 };
  const mobile = vp.width <= 400;
  const panelWidth = 800;
  const clip = mobile
    ? { x: 0, y: 0, width: 390, height: Math.min(844, vp.height) }
    : {
        x: Math.max(0, vp.width - panelWidth),
        y: 0,
        width: Math.min(panelWidth, vp.width),
        height: Math.min(800, vp.height),
      };
  await page.screenshot({ path: join(OUT_DIR, name), clip });
}

test('ㅈㅈ and 제주 keep Jeju first after late festivals', async ({ page, context }, testInfo) => {
  const geminiCalls = await installLateSearchMocks(context);
  const project = testInfo.project.name;
  const input = await openExplore(page, 'ko');

  let since = Date.now();
  await input.fill('ㅈㅈ');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  let rows = await suggestionTexts(page, 'ko');
  const jejuChoseong = rows.findIndex((row) => row.includes('제주') && row.includes('여행지') && !row.includes('제주시'));
  const endedChoseong = rows.findIndex((row) => row.includes('반려동물'));
  const activeChoseong = rows.findIndex((row) => row.includes('겨울빛'));
  expect(jejuChoseong, rows.slice(0, 6).join(' | ')).toBe(0);
  expect(endedChoseong).toBeGreaterThan(jejuChoseong);
  expect(activeChoseong).toBeGreaterThan(jejuChoseong);
  expect(endedChoseong).toBeGreaterThan(activeChoseong);
  await saveLoadedList(page, `${project}-jj.png`);

  since = Date.now();
  await input.fill('제주');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  rows = await suggestionTexts(page, 'ko');
  const jeju = rows.findIndex((row) => row.includes('제주') && row.includes('여행지') && !row.includes('제주시'));
  const ended = rows.findIndex((row) => row.includes('반려동물'));
  const active = rows.findIndex((row) => row.includes('겨울빛'));
  expect(jeju, rows.slice(0, 6).join(' | ')).toBe(0);
  expect(ended).toBeGreaterThan(jeju);
  expect(active).toBeGreaterThan(jeju);
  expect(ended).toBeGreaterThan(active);
  await saveLoadedList(page, `${project}-jeju.png`);
  expect(geminiCalls).toEqual([]);
});

test('ㅅㅇ pause and retype, ㄱㄴ, and ㅂㅅ keep the city above festivals', async ({ page, context }, testInfo) => {
  const geminiCalls = await installLateSearchMocks(context);
  const project = testInfo.project.name;
  const input = await openExplore(page, 'ko');

  await input.fill('ㅅ');
  await page.waitForTimeout(1500);
  let since = Date.now();
  await input.fill('ㅅㅇ');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  let rows = await suggestionTexts(page, 'ko');
  expect(rows[0], rows.slice(0, 6).join(' | ')).toMatch(/서울/);
  expect(rows[0]).toMatch(/여행지/);
  expect(rows.findIndex((row) => row.includes('왕궁수문장'))).toBeGreaterThan(0);
  await saveLoadedList(page, `${project}-seoul-pause.png`);

  since = Date.now();
  await input.fill('제주');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  since = Date.now();
  await input.fill('ㅅㅇ');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  rows = await suggestionTexts(page, 'ko');
  expect(rows[0], rows.slice(0, 6).join(' | ')).toMatch(/서울/);
  expect(rows[0]).toMatch(/여행지/);
  expect(rows.findIndex((row) => row.includes('빛초롱'))).toBeGreaterThan(0);
  await saveLoadedList(page, `${project}-seoul-retype.png`);

  since = Date.now();
  await input.fill('ㄱㄴ');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  rows = await suggestionTexts(page, 'ko');
  const gangnam = rows.findIndex((row) => row.includes('강남') && !row.includes('금남'));
  const geumnam = rows.findIndex((row) => row.includes('금남로'));
  expect(gangnam, rows.slice(0, 8).join(' | ')).toBeGreaterThanOrEqual(0);
  expect(geumnam).toBeGreaterThan(gangnam);
  await saveLoadedList(page, `${project}-gn.png`);

  since = Date.now();
  await input.fill('ㅂㅅ');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  rows = await suggestionTexts(page, 'ko');
  expect(rows[0], rows.slice(0, 8).join(' | ')).toMatch(/부산/);
  expect(rows[0]).not.toMatch(/축제/);
  expect(rows.findIndex((row) => row.includes('매직'))).toBeGreaterThan(0);
  await saveLoadedList(page, `${project}-bs.png`);
  expect(geminiCalls).toEqual([]);
});

test('산천어 puts the festival title match under 화천 before the place block', async ({ page, context }, testInfo) => {
  await installLateSearchMocks(context);
  const project = testInfo.project.name;
  const input = await openExplore(page, 'ko');
  let since = Date.now();
  await input.fill('산천어');
  since = Date.now();
  await waitUntilLoaded(page, 'ko', since);
  let rows = await suggestionTexts(page, 'ko');
  const cityAt = rows.findIndex((row) => row.includes('화천') && row.includes('도시'));
  const festAt = rows.findIndex((row) => row.includes('산천어축제'));
  const placeAt = rows.findIndex((row) => row.includes('파로호'));
  expect(cityAt, rows.slice(0, 12).join(' | ')).toBe(0);
  expect(festAt).toBe(cityAt + 1);
  expect(placeAt).toBeGreaterThan(festAt);
  expect(festAt).toBeLessThan(12);

  await input.press('Enter');
  const panel = page
    .locator('div.animate-fade-in')
    .filter({ has: page.getByRole('heading', { name: /도시·명소·여행지/ }) })
    .last();
  await expect(panel).toBeVisible({ timeout: 20_000 });
  const entered = (await panel.locator('button').allTextContents())
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text && !text.includes('MOONi') && text !== '닫기');
  const enteredCity = entered.findIndex((row) => row.includes('화천') && row.includes('도시'));
  const enteredFest = entered.findIndex((row) => row.includes('산천어축제'));
  const enteredPlace = entered.findIndex((row) => row.includes('파로호'));
  expect(enteredCity, entered.slice(0, 12).join(' | ')).toBe(0);
  expect(enteredFest).toBe(enteredCity + 1);
  expect(enteredPlace).toBeGreaterThan(enteredFest);
  await saveLoadedList(page, `${project}-sancheoneo.png`);
});

test('English Seoul keeps the city and the same attractions', async ({ page, context }, testInfo) => {
  const geminiCalls = await installLateSearchMocks(context);
  const project = testInfo.project.name;
  const input = await openExplore(page, 'en');
  const since = Date.now();
  await input.fill('Seoul');
  await waitUntilLoaded(page, 'en', since);
  const rows = await suggestionTexts(page, 'en');
  expect(rows[0], rows.slice(0, 6).join(' | ')).toMatch(/Seoul/);
  expect(rows[0]).toMatch(/City/);
  expect(rows[0]).not.toMatch(/Festival/);
  const names = ['Gyeongbokgung', 'N Seoul Tower', 'Bukchon', 'Insadong'];
  let prev = 0;
  for (const name of names) {
    const at = rows.findIndex((row) => row.includes(name));
    expect(at, name).toBeGreaterThan(prev);
    prev = at;
  }
  await saveLoadedList(page, `${project}-seoul-en.png`);
  expect(geminiCalls).toEqual([]);
});

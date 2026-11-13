// VITE_GATEO_PLACE_INTRO_OVER_SSOT=1 — mock DB intro only (no gemini place_intro)
import { test, expect } from './fixtures.js';

const PROD_SUPABASE_HOST = 'phdjnbfitvmrguqzverm';
const MOCK_INTRO =
  '야프 섬은 전통 돌화폐와 해양 문화로 알려진 미크로네시아 서부의 조용한 여행지입니다. 맑은 바다와 산책로를 즐길 수 있습니다.';
const YAP_STATIC_MARKER = '전통 댄스로 유명합니다';
const KHAO_STATIC_SNIPPET = '시미란';

const INTRO_STORAGE_KEYS = ['미크로네시아 연방 야프', '야프'];

let geminiIntroCalls = 0;

function storageKey(destinationKey) {
  return `days_place_chat_intro:${encodeURIComponent(destinationKey)}`;
}

async function seedIntroLocalStorage(page) {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        configurable: true,
      });
    } catch {
      // ignore
    }
  });
  await page.addInitScript(
    ({ intro, keys }) => {
      const payload = JSON.stringify({ summary: intro, savedAt: Date.now() });
      for (const key of keys) {
        localStorage.setItem(
          `days_place_chat_intro:${encodeURIComponent(key)}`,
          payload,
        );
      }
    },
    { intro: MOCK_INTRO, keys: INTRO_STORAGE_KEYS },
  );
}

async function installIntroMocks(page) {
  geminiIntroCalls = 0;
  await page.route(new RegExp(PROD_SUPABASE_HOST, 'i'), (route) => route.abort());
  await page.route(/\/rest\/v1\/place_chat_intro/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    const hit = INTRO_STORAGE_KEYS.find((key) => url.includes(encodeURIComponent(key)) || url.includes(key));
    const body = hit
      ? JSON.stringify({ destination_key: hit, summary: MOCK_INTRO })
      : 'null';
    const accept = route.request().headers().accept || '';
    if (accept.includes('application/vnd.pgrst.object+json')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: hit ? JSON.stringify([{ destination_key: hit, summary: MOCK_INTRO }]) : '[]',
    });
  });
  await page.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    const post = route.request().postData() || '';
    if (/place_intro/i.test(post)) {
      geminiIntroCalls += 1;
      return route.fulfill({ status: 500, body: 'place_intro blocked in QA' });
    }
    return route.continue();
  });
}

async function openPlaceSummary(page, slug, viewport) {
  await page.setViewportSize(viewport);
  await seedIntroLocalStorage(page);
  await installIntroMocks(page);
  await page.goto(`/place/${slug}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByText(/야프|카오락|비래바위|Yap|Khao/i).first()).toBeVisible({ timeout: 60_000 });
}

async function pageBodyText(page) {
  return page.evaluate(() => document.body.innerText.slice(0, 6000));
}

test.describe('place intro over SSOT (flag-on build)', () => {
  test('390 — yap first visit shows mock MOONi intro without gemini', async ({ page }) => {
    await openPlaceSummary(page, 'yap', { width: 390, height: 844 });
    await expect.poll(async () => pageBodyText(page), { timeout: 45_000 }).toContain('조용한 여행지');
    const text = await pageBodyText(page);
    expect(text).not.toContain(YAP_STATIC_MARKER);
    expect(geminiIntroCalls).toBe(0);
  });

  test('390 — yap re-entry keeps mock intro', async ({ page }) => {
    await openPlaceSummary(page, 'yap', { width: 390, height: 844 });
    await expect.poll(async () => pageBodyText(page), { timeout: 45_000 }).toContain('해양 문화');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await openPlaceSummary(page, 'yap', { width: 390, height: 844 });
    const text = await pageBodyText(page);
    expect(text).toContain('조용한 여행지');
    expect(text).not.toContain(YAP_STATIC_MARKER);
  });

  test('390 — khao-lak keeps SSOT copy (locked)', async ({ page }) => {
    await openPlaceSummary(page, 'khao-lak', { width: 390, height: 844 });
    const text = await pageBodyText(page);
    expect(text).toContain(KHAO_STATIC_SNIPPET);
    expect(text).not.toContain('조용한 여행지');
  });

  test('1280 — yap mock intro on desktop summary', async ({ page }) => {
    await openPlaceSummary(page, 'yap', { width: 1280, height: 720 });
    await expect.poll(async () => pageBodyText(page), { timeout: 45_000 }).toContain('미크로네시아 서부');
    expect(geminiIntroCalls).toBe(0);
  });

  test('1280 — birae palgyeong hub keeps synthetic hub desc without mock', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedIntroLocalStorage(page);
    await installIntroMocks(page);
    await page.goto('/place/birae-rock?lang=ko', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByText(/비래바위|Birae/i).first()).toBeVisible({ timeout: 60_000 });
    const text = await pageBodyText(page);
    expect(text).not.toContain('조용한 여행지');
    expect(text).toMatch(/비래바위|화천/);
  });
});

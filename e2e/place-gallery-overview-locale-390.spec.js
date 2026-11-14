/**
 * Mobile gallery overview — locale notices + KO→EN hydrate (390px, local preview).
 */
import { test, expect } from '@playwright/test';

const MOCK_EN_YAP = 'Yap is known for stone money and traditional Pacific Island culture.';
const YAP_KEYS = ['Yap', '야프', '미크로네시아 연방 야프'];
const YAP_SSOT_SNIPPET = '전통 댄스로 유명합니다';

const STALE_KO_MARKER = '무니한글스테일검사전용문구';

async function blockLiveSupabase(page) {
  await page.route(/phdjnbfitvmrguqzverm/i, (route) => route.abort());
}

async function blockTourOverviewHydrate(page) {
  await page.route(/\/functions\/v1\/tourapi-proxy/i, async (route) => {
    const body = JSON.stringify({ response: { body: { items: { item: [] } } } });
    return route.fulfill({ status: 200, contentType: 'application/json', body });
  });
}

async function revealMobileGalleryOverview(page) {
  const mobileOverview = page.locator('[data-place-gallery-mobile-overview]');
  const galleryTab = page.getByRole('button', { name: /^(갤러리|Gallery)$/i });
  if ((await galleryTab.count()) > 0) {
    await galleryTab.first().click();
  }
  await mobileOverview.scrollIntoViewIfNeeded({ timeout: 90_000 }).catch(async () => {
    await page.evaluate(() => window.scrollBy(0, Math.max(400, window.innerHeight * 0.8)));
  });
  return mobileOverview;
}

async function clickLocaleToggle(page) {
  const toggle = page.getByTestId('place-header-locale-toggle').locator('button').first();
  await expect(toggle).toBeVisible({ timeout: 60_000 });
  await toggle.click();
}

async function pageBodyText(page) {
  return page.evaluate(() => document.body.innerText.slice(0, 8000));
}

async function seedYapEnIntro(page) {
  await page.addInitScript(
    ({ enIntro, keys }) => {
      const stamp = { savedAt: Date.now() };
      for (const key of keys) {
        localStorage.setItem(
          `days_place_chat_intro:${encodeURIComponent(`${key}@en`)}`,
          JSON.stringify({ summary: enIntro, ...stamp }),
        );
      }
    },
    { enIntro: MOCK_EN_YAP, keys: YAP_KEYS },
  );
  await page.route(/\/rest\/v1\/place_chat_intro/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    const isEn = /@en/.test(url) || /destination_key=eq\.[^&]*@en/i.test(url);
    const body = isEn
      ? JSON.stringify([{ destination_key: 'Yap@en', summary: MOCK_EN_YAP }])
      : '[]';
    return route.fulfill({ status: 200, contentType: 'application/json', body });
  });
}

test.describe('place gallery overview locale @390', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await blockLiveSupabase(page);
    await blockTourOverviewHydrate(page);
  });

  test('donggureung EN — koreanGuide in mobile card with empty overview body', async ({ page }) => {
    await page.route(/\/rest\/v1\/place_chat_intro/i, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/place/donggureung-royal-tombs?lang=en', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByRole('button', { name: /Donggureung|동구릉/i }).first()).toBeVisible({
      timeout: 60_000,
    });
    const mobileOverview = await revealMobileGalleryOverview(page);
    await expect(mobileOverview).toBeVisible({ timeout: 90_000 });
    await expect(
      mobileOverview.getByRole('status', { name: /Detailed guide is currently provided in Korean/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('chuuk-like — EN omits Korean-only hydrate until delayed English intro', async ({ page }) => {
    const KO_ONLY_EN_CACHE = `${STALE_KO_MARKER} 추크 라군 수중 박물관입니다.`;
    await page.addInitScript(
      ({ koIntro, keys }) => {
        const stamp = { savedAt: Date.now() };
        for (const key of keys) {
          localStorage.setItem(
            `days_place_chat_intro:${encodeURIComponent(`${key}@en`)}`,
            JSON.stringify({ summary: koIntro, ...stamp }),
          );
        }
      },
      { koIntro: KO_ONLY_EN_CACHE, keys: YAP_KEYS },
    );
    let enIntroRequests = 0;
    await page.route(/\/rest\/v1\/place_chat_intro/i, async (route) => {
      const url = decodeURIComponent(route.request().url());
      const isEn = /@en/.test(url) || /destination_key=eq\.[^&]*@en/i.test(url);
      if (!isEn) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      enIntroRequests += 1;
      await new Promise((r) => setTimeout(r, 1_200));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ destination_key: 'Yap@en', summary: MOCK_EN_YAP }]),
      });
    });
    await page.goto('/place/yap?lang=ko', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect.poll(async () => pageBodyText(page), { timeout: 90_000 }).toContain(YAP_SSOT_SNIPPET);

    const mobileOverview = await revealMobileGalleryOverview(page);
    await clickLocaleToggle(page);
    await expect(page).toHaveURL(/\?lang=en/, { timeout: 15_000 });

    await expect
      .poll(
        async () => {
          const text = await mobileOverview.innerText().catch(() => '');
          return text.includes(STALE_KO_MARKER);
        },
        { timeout: 3_000, intervals: [50, 100, 200] },
      )
      .toBe(false);

    await expect.poll(() => mobileOverview.innerText(), { timeout: 90_000 }).toMatch(/stone money|Pacific/i);
    expect(enIntroRequests).toBeGreaterThan(0);
    await expect(mobileOverview).not.toContainText(STALE_KO_MARKER);
  });

  test('yap KO→EN→KO — mobile round trip', async ({ page }) => {
    await seedYapEnIntro(page);
    await page.goto('/place/yap?lang=ko', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect.poll(async () => pageBodyText(page), { timeout: 90_000 }).toContain(YAP_SSOT_SNIPPET);

    await clickLocaleToggle(page);
    await expect(page).toHaveURL(/\?lang=en/, { timeout: 15_000 });
    await expect.poll(async () => pageBodyText(page), { timeout: 120_000 }).toMatch(/stone money|Pacific/i);

    await clickLocaleToggle(page);
    await expect(page).not.toHaveURL(/\?lang=en/, { timeout: 15_000 });
    await expect.poll(async () => pageBodyText(page), { timeout: 90_000 }).toContain(YAP_SSOT_SNIPPET);
  });
});
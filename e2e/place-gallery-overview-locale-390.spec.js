/**
 * Mobile gallery overview — KO→EN locale switch (390px).
 * EN intro via localStorage; KO baseline uses live SSOT copy in the gallery column.
 */
import { test, expect } from '@playwright/test';

const MOCK_EN_INTRO = 'Yap is known for stone money and traditional Pacific Island culture.';
const INTRO_KEYS = ['Yap', '야프', '미크로네시아 연방 야프'];

const YAP_SSOT_SNIPPET = '전통 댄스로 유명합니다';

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
    { enIntro: MOCK_EN_INTRO, keys: INTRO_KEYS },
  );
  await page.route(/\/rest\/v1\/place_chat_intro/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    const isEn = /@en/.test(url) || /destination_key=eq\.[^&]*@en/i.test(url);
  const body = isEn
      ? JSON.stringify([{ destination_key: 'Yap@en', summary: MOCK_EN_INTRO }])
      : '[]';
    return route.fulfill({ status: 200, contentType: 'application/json', body });
  });
  await page.route(/phdjnbfitvmrguqzverm/i, (route) => route.abort());
}

async function clickLocaleToggle(page) {
  const toggle = page.getByTestId('place-header-locale-toggle').locator('button').first();
  await expect(toggle).toBeVisible({ timeout: 60_000 });
  await toggle.click();
}

async function pageBodyText(page) {
  return page.evaluate(() => document.body.innerText.slice(0, 8000));
}

test.describe('place gallery overview locale @390', () => {
  test('KO→EN — hydrates English overview on mobile gallery column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedYapEnIntro(page);
    await page.goto('/place/yap?lang=ko', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByRole('button', { name: /야프|Yap/i }).first()).toBeVisible({
      timeout: 60_000,
    });
    await expect.poll(async () => pageBodyText(page), { timeout: 90_000 }).toContain(YAP_SSOT_SNIPPET);

    await clickLocaleToggle(page);
    await expect(page).toHaveURL(/\?lang=en/, { timeout: 15_000 });
    await expect.poll(async () => pageBodyText(page), { timeout: 120_000 }).toMatch(/stone money|Pacific/i);
    const afterEn = await pageBodyText(page);
    expect(afterEn).not.toContain(YAP_SSOT_SNIPPET);
  });

});
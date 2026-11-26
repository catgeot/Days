import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';
import { installExploreMapboxGosansaMock } from './explore-mapbox-gosansa-mock.js';

const JUNK = 'zzqxnone999xyz';
const CHOSEONG = 'ㅅㅇ';

const Y_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [5.2, 46.2] },
  properties: {
    mapbox_id: 'e2e-y',
    feature_type: 'place',
    name: 'Y',
    name_preferred: 'Y',
    place_formatted: 'France',
    context: { country: { name: 'France', country_code: 'fr' } },
  },
};

const SAXONNE_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [6.1, 46.1] },
  properties: {
    mapbox_id: 'e2e-saxonne',
    feature_type: 'place',
    name: 'Saxonne',
    name_preferred: 'Saxonne',
    place_formatted: 'Switzerland',
    context: { country: { name: 'Switzerland', country_code: 'ch' } },
  },
};

async function installJunkMapbox(page) {
  await page.route(/api\.mapbox\.com\/search\/searchbox\/v1\/forward/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (!url.includes(JUNK)) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [Y_FEATURE, SAXONNE_FEATURE],
      }),
    });
  });
}

async function boot(page) {
  const ctx = page.context();
  await installExploreGeminiMock(ctx);
  await installExploreTourapiMock(ctx);
  await installExploreMapboxGosansaMock(ctx);
  await installJunkMapbox(page);
}

test.describe('Patrol explore empty and photo-less cards', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page);
  });

  for (const viewport of [
    { width: 390, height: 844, label: '390' },
    { width: 1280, height: 800, label: '1280' },
  ]) {
    test(`no-match query @${viewport.label} shows an empty state`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/explore?lang=ko');
      const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
      await expect(input).toBeVisible({ timeout: 60_000 });
      await input.fill(JUNK);
      await input.press('Enter');
      const empty = page.locator('[data-explore-no-results]');
      await expect(empty).toBeVisible({ timeout: 30_000 });
      await expect(empty).toContainText('결과 없음');
      await expect(empty).toContainText(JUNK);
      await expect(page.getByRole('button', { name: /^Y$/ })).toHaveCount(0);
      await expect(page.getByText('Saxonne')).toHaveCount(0);
      await page.screenshot({
        path: `/opt/cursor/artifacts/explore-empty-after-${viewport.label}.png`,
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      });
    });

    test(`no-match query @${viewport.label} English copy`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/explore?lang=en');
      const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
      await expect(input).toBeVisible({ timeout: 60_000 });
      await input.fill(JUNK);
      await input.press('Enter');
      const empty = page.locator('[data-explore-no-results]');
      await expect(empty).toBeVisible({ timeout: 30_000 });
      await expect(empty).toContainText('No results');
      await expect(empty).toContainText('Browse recommended places');
      await empty.locator('[data-explore-no-results-browse]').click();
      await expect(empty).toHaveCount(0);
    });

    test(`choseong 서울 result card shows a photo when hub scenic exists @${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/explore?lang=ko');
      const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
      await expect(input).toBeVisible({ timeout: 60_000 });
      await input.fill(CHOSEONG);
      await input.press('Enter');
      const seoulCard = page
        .locator('[data-search-result-card][data-search-result-name="서울"]')
        .first();
      await expect(seoulCard).toBeVisible({ timeout: 30_000 });
      await expect(seoulCard.locator('img[src]').first()).toBeVisible({ timeout: 15_000 });
      await page.screenshot({
        path: `/opt/cursor/artifacts/explore-choseong-results-${viewport.label}.png`,
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      });
    });
  }
});

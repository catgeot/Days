/**
 * 11/4 홍보 장소 검색 — Preview 캡처 (390·1280)
 * PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test e2e/explore-promo-search-1104.spec.js --project=chromium
 */
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';
import { installExplorePyongyangGeocodeMock } from './explore-mapbox-pyongyang-geocode-mock.js';
import fs from 'node:fs';
import path from 'node:path';

test.use({ ignoreHTTPSErrors: true });

const ARTIFACTS = '/opt/cursor/artifacts';
const QUERIES = ['한라산 백록담', '개심사', '평양시'];

function slugQuery(q) {
  return q.replace(/\s+/g, '-');
}

async function openExploreSearch(page) {
  await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

async function waitSearchSettled(page) {
  await expect(page.getByText(/목적지를 찾고 있습니다|Finding this place/i)).toHaveCount(0, {
    timeout: 90_000,
  });
  const choice = page.getByRole('button').filter({ hasText: /.+/ }).first();
  const noResult = page.getByText(/맞는 장소를 찾지 못했습니다|could not find/i);
  await expect(choice.or(noResult)).toBeVisible({ timeout: 90_000 });
}

async function shot(page, filename, width) {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  await page.screenshot({
    path: path.join(ARTIFACTS, filename),
    clip: { x: 0, y: 0, width, height: 844 },
  });
}

test.beforeEach(async ({ page, context }) => {
  await installExploreGeminiMock(context);
  await installExploreTourapiMock(context);
  await installExplorePyongyangGeocodeMock(context);
});

for (const query of QUERIES) {
  for (const viewport of [
    { width: 390, label: '390' },
    { width: 1280, label: '1280' },
  ]) {
    test(`${query} @${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: 844 });
      const input = await openExploreSearch(page);
      await input.fill(query);
      await input.press('Enter');
      await waitSearchSettled(page);
      await shot(page, `promo-search-${slugQuery(query)}-${viewport.label}.png`, viewport.width);

      if (query === '한라산 백록담') {
        const card = page.getByRole('button', { name: /한라산|백록담|127635|국립공원/i }).first();
        await expect(card).toBeVisible();
        await card.click();
        await page.waitForURL(/\/place\/tour-127635/, { timeout: 60_000 });
      }
      if (query === '개심사') {
        const first = page.getByRole('button', { name: /개심사/ }).first();
        await expect(first).toBeVisible();
        await expect(first).toContainText(/서산/);
        await first.click();
        await page.waitForURL(/\/place\/gaesimsa/, { timeout: 60_000 });
      }
      if (query === '평양시') {
        const card = page.getByRole('button').filter({ hasText: /Pyongyang|평양/i }).first();
        await expect(card).toBeVisible();
        await card.click();
        await page.waitForURL(/\/place\/pyongyang/, { timeout: 60_000 });
      }
    });
  }
}

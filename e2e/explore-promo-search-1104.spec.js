/**
 * 11/4 홍보 장소 검색 — Preview 캡처 (390·1280)
 * PLAYWRIGHT_BASE_URL=https://127.0.0.1:4173 npx playwright test e2e/explore-promo-search-1104.spec.js --project=chromium
 */
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';
import { installExplorePyongyangGeocodeMock } from './explore-mapbox-pyongyang-geocode-mock.js';
import fs from 'node:fs';
import path from 'node:path';

test.use({ ignoreHTTPSErrors: true });

const ARTIFACTS = '/opt/cursor/artifacts';
const HALLASAN_ALIAS_QUERIES = ['한라산 백록담', '백록담', '화구벽'];
const QUERIES = [...HALLASAN_ALIAS_QUERIES, '개심사', '평양시'];

function slugQuery(q) {
  return q.replace(/\s+/g, '-');
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
}

function searchResultButton(page, pattern) {
  return page
    .getByRole('button')
    .filter({ hasNotText: /MOONi|전송|일반 탐색|닫기|홈으로|메뉴|로그인|English|플래너/i })
    .filter({ hasText: pattern })
    .first();
}

async function shot(page, filename, width) {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  await page.screenshot({
    path: path.join(ARTIFACTS, filename),
    clip: { x: 0, y: 0, width, height: 844 },
  });
}

async function expectHallasanTourDetail(page) {
  await expect(page).toHaveURL(/\/place\/tour-127635(?:\/|$|\?)/, { timeout: 90_000 });
  await expect(
    page.getByRole('button', { name: /플래너|갤러리|Planner|Gallery/i }).first(),
  ).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(/백록담|한라산|Baeknokdam|Hallasan/i).first()).toBeVisible({
    timeout: 90_000,
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

      if (HALLASAN_ALIAS_QUERIES.includes(query)) {
        const onDetail = await page
          .waitForURL(/\/place\/tour-127635/, { timeout: 12_000 })
          .then(() => true)
          .catch(() => false);
        if (!onDetail) {
          const tourCard = page
            .locator('[data-search-popover] button, button')
            .filter({ hasText: /백록담|화구벽|Baeknokdam/i })
            .first();
          await expect(tourCard).toBeVisible({ timeout: 60_000 });
          await tourCard.click();
        }
        await expectHallasanTourDetail(page);
      }

      if (query === '개심사') {
        const onGaesimsa = await page
          .waitForURL(/\/place\/gaesimsa/, { timeout: 15_000 })
          .then(() => true)
          .catch(() => false);
        if (!onGaesimsa) {
          const first = page
            .getByRole('button')
            .filter({ hasText: /개심사/ })
            .filter({ hasText: /서산/ })
            .first();
          await expect(first).toBeVisible({ timeout: 60_000 });
          await first.click();
        }
        await expect(page).toHaveURL(/\/place\/gaesimsa/, { timeout: 60_000 });
      }

      if (query === '평양시') {
        const onPyongyang = await page
          .waitForURL(/\/place\/pyongyang/, { timeout: 15_000 })
          .then(() => true)
          .catch(() => false);
        if (!onPyongyang) {
          const card = page
            .getByRole('button')
            .filter({ hasText: /평양/ })
            .filter({ hasText: /Pyongyang|북한/ })
            .first();
          await expect(card).toBeVisible({ timeout: 60_000 });
          await card.click();
        }
        await expect(page).toHaveURL(/\/place\/pyongyang/, { timeout: 60_000 });
      }

      await shot(page, `promo-search-${slugQuery(query)}-${viewport.label}.png`, viewport.width);
    });
  }
}

async function expectPyongyangPlaceDetail(page) {
  await expect(page).toHaveURL(/\/place\/pyongyang(?:\/|$|\?)/, { timeout: 90_000 });
  await expect(page.getByText(/평양|Pyongyang/).first()).toBeVisible({ timeout: 90_000 });
  await expect(
    page.getByRole('button', { name: /플래너|갤러리|Planner|Gallery/i }).first(),
  ).toBeVisible({ timeout: 90_000 });
}

for (const viewport of [
  { width: 390, label: '390' },
  { width: 1280, label: '1280' },
]) {
  test(`/place/pyongyang 직접 열기·새로고침 @${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: 844 });
    await page.goto('/place/pyongyang?lang=ko', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expectPyongyangPlaceDetail(page);
    await shot(page, `pyongyang-direct-${viewport.label}-open.png`, viewport.width);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPyongyangPlaceDetail(page);
    await shot(page, `pyongyang-direct-${viewport.label}-reload.png`, viewport.width);
  });
}

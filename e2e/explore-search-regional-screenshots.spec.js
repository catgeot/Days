/**
 * Explore regional search regression — 390·1280 captures to /opt/cursor/artifacts
 * Run: PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx vite preview --host 127.0.0.1 --port 4173
 *      PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test e2e/explore-search-regional-screenshots.spec.js --project=chromium
 */
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import fs from 'node:fs';
import path from 'node:path';

test.use({ ignoreHTTPSErrors: true });

const ARTIFACTS = '/opt/cursor/artifacts';
const QUERIES = ['제주 우도', '닭머르해안', '홍성 고산사', '추자도'];

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

for (const query of QUERIES) {
  test(`390 — explore search «${query}»`, async ({ page, context }) => {
    await installExploreGeminiMock(context);
    await page.setViewportSize({ width: 390, height: 844 });
    const input = await openExploreSearch(page);
    await input.fill(query);
    await input.press('Enter');
    await waitSearchSettled(page);
    await shot(page, `explore-search-${slugQuery(query)}-390.png`, 390);

    if (query === '제주 우도') {
      await expect(page.getByText(/Udomlya|Capital District|Zou/i)).toHaveCount(0);
      await expect(page.getByRole('button', { name: /우도/ }).first()).toBeVisible();
    }
    if (query === '추자도') {
      await expect(page.getByRole('button', { name: /추자도/ }).first()).toBeVisible();
    }
  });

  test(`1280 — explore search «${query}»`, async ({ page, context }) => {
    await installExploreGeminiMock(context);
    await page.setViewportSize({ width: 1280, height: 844 });
    const input = await openExploreSearch(page);
    await input.fill(query);
    await input.press('Enter');
    await waitSearchSettled(page);
    await shot(page, `explore-search-${slugQuery(query)}-1280.png`, 1280);
  });
}

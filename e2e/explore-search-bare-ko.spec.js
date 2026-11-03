// Explore Enter — 단독 한글 검색어 (PR #650 회귀: 지역 접두 없이 우do·닭머르·고산사)
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import {
  installExploreTourapiMock,
  EXPLORE_GOSANSA_HONGSEONG_ROW,
  EXPLORE_GOSANSA_JANGHEUNG_ROW,
} from './explore-tourapi-mock.js';
import { installExploreMapboxGosansaMock } from './explore-mapbox-gosansa-mock.js';

const UDO = '\uC6B0\uB3C4';
const GAUDO = '\uAC00\uC6B0\uB3C4';
const DAKMEORU = '\uB2ED\uBA38\uB974';
const JEJU = '\uC81C\uC8FC';
const GOSANSA = '\uACE0\uC0B0\uC0AC';
const JANGHEUNG = '\uC7A5\uD765';
const HONGSEONG_GOSANSA = '\uACE0\uC0B0\uC0AC(\uD64D\uC131)';
const HONGSEONG_TOUR_PATH = `/place/tour-${EXPLORE_GOSANSA_HONGSEONG_ROW.content_id}`;
const JANGHEUNG_TOUR_PATH = `/place/tour-${EXPLORE_GOSANSA_JANGHEUNG_ROW.content_id}`;

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.use({ ignoreHTTPSErrors: true });

async function openExploreSearch(page) {
  await page.goto('/explore');
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

async function submitExploreQuery(page, query) {
  const searchInput = await openExploreSearch(page);
  await searchInput.fill(query);
  await searchInput.press('Enter');
  return searchInput;
}

async function installExploreMocks(page) {
  const ctx = page.context();
  await installExploreGeminiMock(ctx);
  await installExploreTourapiMock(ctx);
  await installExploreMapboxGosansaMock(ctx);
}

test.describe('Explore bare Korean place queries', () => {
  test.beforeEach(async ({ page }) => {
    await installExploreMocks(page);
  });

  test('우do — 맨 위 결과 행에 제주, 가우do 없음', async ({ page }) => {
    await submitExploreQuery(page, UDO);
    const first = page.getByRole('button', { name: new RegExp(UDO) }).first();
    await expect(first).toBeVisible({ timeout: 120_000 });
    await expect(first).toContainText(JEJU);
    await expect(page.getByRole('button', { name: new RegExp(GAUDO) })).toHaveCount(0);
  });

  test('닭머르 — 제주 해안 choice visible', async ({ page }) => {
    await submitExploreQuery(page, DAKMEORU);
    const first = page.getByRole('button', { name: new RegExp(DAKMEORU) }).first();
    await expect(first).toBeVisible({ timeout: 120_000 });
    await expect(first).toContainText(JEJU);
    await expect(page.getByText(/맞는 장소를 찾지 못했습니다/)).toHaveCount(0);
  });
});

test.describe('Explore bare KO — 고산사 (390·1280)', () => {
  test.beforeEach(async ({ page }) => {
    await installExploreMocks(page);
  });

  for (const viewport of [
    { width: 390, height: 844, label: '390' },
    { width: 1280, height: 800, label: '1280' },
  ]) {
    test(`고산사 @${viewport.label} — 홍성 Tour /place/tour-* · 새로고침`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await submitExploreQuery(page, GOSANSA);
      const card = page.getByRole('button', { name: new RegExp(escapeRegExp(HONGSEONG_GOSANSA)) }).first();
      await expect(card).toBeVisible({ timeout: 120_000 });
      await card.click();
      await page.waitForURL(new RegExp(HONGSEONG_TOUR_PATH.replace(/\//g, '\\/')), {
        timeout: 60_000,
      });
      expect(new URL(page.url()).pathname).toBe(HONGSEONG_TOUR_PATH);
      await page.reload();
      await expect(page).toHaveURL(new RegExp(HONGSEONG_TOUR_PATH.replace(/\//g, '\\/')));
      await expect(page.getByText(new RegExp(escapeRegExp(HONGSEONG_GOSANSA))).first()).toBeVisible({
        timeout: 60_000,
      });
    });

    test(`고산사 @${viewport.label} — 장흥 Mapbox /place/tour-* · 장흥 라벨 · 홈 금지`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await submitExploreQuery(page, GOSANSA);
      const mapboxCard = page
        .getByRole('button', { name: new RegExp(GOSANSA) })
        .filter({ hasText: new RegExp(JANGHEUNG) })
        .first();
      await expect(mapboxCard).toBeVisible({ timeout: 120_000 });
      await expect(mapboxCard).not.toContainText(/Jangheung/i);
      await mapboxCard.click();
      await page.waitForURL(new RegExp(JANGHEUNG_TOUR_PATH.replace(/\//g, '\\/')), {
        timeout: 60_000,
      });
      const path = new URL(page.url()).pathname;
      expect(path).toBe(JANGHEUNG_TOUR_PATH);
      expect(path).not.toBe('/');
      await page.reload();
      await expect(page).toHaveURL(new RegExp(JANGHEUNG_TOUR_PATH.replace(/\//g, '\\/')));
    });
  }
});

test.describe('Explore bare KO — Mapbox-only parity', () => {
  test.beforeEach(async ({ page }) => {
    const ctx = page.context();
    await installExploreGeminiMock(ctx);
    await installExploreMapboxGosansaMock(ctx);
  });

  test('고산사 Enter — Mapbox 한글 POI 상세', async ({ page }) => {
    await submitExploreQuery(page, GOSANSA);
    const mapboxCard = page.getByRole('button', { name: new RegExp(GOSANSA) }).first();
    await expect(mapboxCard).toBeVisible({ timeout: 120_000 });
    await mapboxCard.click();
    await page.waitForURL(/\/place\//, { timeout: 60_000 });
    expect(new URL(page.url()).pathname).not.toBe('/');
  });
});

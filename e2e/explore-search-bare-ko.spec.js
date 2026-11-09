// Explore Enter — 단독 한글 검색어 (PR #650 회귀: 지역 접두 없이 우do·닭머르·고산사)
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import {
  installExploreTourapiMock,
  EXPLORE_GOSANSA_HONGSEONG_ROW,
  EXPLORE_GOSANSA_JANGHEUNG_ROW,
} from './explore-tourapi-mock.js';
import { installExploreMapboxGosansaMock } from './explore-mapbox-gosansa-mock.js';
import { installExploreJejuGeocodeMock } from './explore-mapbox-jeju-geocode-mock.js';
import {
  installExplorePlaceStatsVisitedMock,
  LIVE_PLACE_STATS_JEJU_DO,
} from './explore-place-stats-visited-mock.js';
import { installExplorePyongyangGeocodeMock } from './explore-mapbox-pyongyang-geocode-mock.js';

const UDO = '\uC6B0\uB3C4';
const GAUDO = '\uAC00\uC6B0\uB3C4';
const DAKMEORU = '\uB2ED\uBA38\uB974';
const JEJU = '\uC81C\uC8FC';
const GOSANSA = '\uACE0\uC0B0\uC0AC';
const JANGHEUNG = '\uC7A5\uD765';
const HONGSEONG_GOSANSA = '\uACE0\uC0B0\uC0AC(\uD64D\uC131)';
const HONGSEONG_SPACED = '\uD64D\uC131 \uACE0\uC0B0\uC0AC';
const HONGSEONG_TOUR_PATH = `/place/tour-${EXPLORE_GOSANSA_HONGSEONG_ROW.content_id}`;
const JANGHEUNG_TOUR_PATH = `/place/tour-${EXPLORE_GOSANSA_JANGHEUNG_ROW.content_id}`;
const PYONGYANG = '\uD3C9\uC591';
const SOUTH_PACIFIC = '\uB0A8\uD0DC\uD3C9\uC591';
const ATLANTIC = '\uB300\uC11C\uC591';
const NORTH_ATLANTIC = '\uBD81\uB300\uC11C\uC591';
const MACARONESIA = '\uB9C8\uCE74\uB85C\uB124\uC2DC\uC544';

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

  test('고산사(홍성) Enter — tour-125901 · 코스 2677792 미노출', async ({ page }) => {
    await installExploreTourapiMock(page.context());
    await submitExploreQuery(page, HONGSEONG_GOSANSA);
    const card = page
      .getByRole('button', { name: new RegExp(escapeRegExp(HONGSEONG_GOSANSA)) })
      .first();
    await expect(card).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('button', { name: /2677792|대웅전 여행/i })).toHaveCount(0);
    await card.click();
    await page.waitForURL(new RegExp(HONGSEONG_TOUR_PATH.replace(/\//g, '\\/')), {
      timeout: 60_000,
    });
    expect(new URL(page.url()).pathname).toBe(HONGSEONG_TOUR_PATH);
  });

  test('홍성 고산사 Enter — tour-125901', async ({ page }) => {
    await installExploreTourapiMock(page.context());
    await submitExploreQuery(page, HONGSEONG_SPACED);
    const card = page
      .getByRole('button', { name: new RegExp(escapeRegExp(HONGSEONG_GOSANSA)) })
      .first();
    await expect(card).toBeVisible({ timeout: 120_000 });
    await card.click();
    await page.waitForURL(new RegExp(HONGSEONG_TOUR_PATH.replace(/\//g, '\\/')), {
      timeout: 60_000,
    });
    expect(new URL(page.url()).pathname).toBe(HONGSEONG_TOUR_PATH);
  });

  test('제주특별자치도 suggestion tap — /place/jeju (live geocode pin)', async ({ page }) => {
    await installExploreJejuGeocodeMock(page.context());
    await page.goto('/explore');
    const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await expect(input).toBeVisible({ timeout: 60_000 });
    await input.fill('제주특별자치도');
    const row = page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' })
      .filter({ has: page.getByText('제주특별자치도', { exact: true }) })
      .first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(page).toHaveURL(/\/place\/jeju(?:\/|$|\?)/, { timeout: 60_000 });
  });

  test('제주특별자치도 Enter — 장소 카드(visited-jeju-do) → /place/jeju', async ({ page }) => {
    await installExplorePlaceStatsVisitedMock(page.context());
    await submitExploreQuery(page, LIVE_PLACE_STATS_JEJU_DO.name_ko);
    const card = page
      .getByRole('button')
      .filter({ hasText: LIVE_PLACE_STATS_JEJU_DO.name_ko })
      .filter({ hasText: LIVE_PLACE_STATS_JEJU_DO.name_en })
      .first();
    await expect(card).toBeVisible({ timeout: 120_000 });
    await card.click();
    await expect(page).toHaveURL(/\/place\/jeju(?:\/|$|\?)/, { timeout: 60_000 });
  });

  test('대서양 Enter — north-atlantic(북대서양) 큐레이션 · 마카로네시아 아님', async ({ page }) => {
    await submitExploreQuery(page, ATLANTIC);
    await expect(
      page.getByRole('heading', { name: new RegExp(`'${NORTH_ATLANTIC}' 해역`) }),
    ).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('heading', { name: new RegExp(MACARONESIA) })).toHaveCount(0);
  });

  test('평양 Enter — 남태평양 해역 큐레이션 없음 · Pyongyang 탭 /place', async ({ page }) => {
    await installExplorePyongyangGeocodeMock(page.context());
    await submitExploreQuery(page, PYONGYANG);
    const card = page.getByRole('button').filter({ hasText: 'Pyongyang' }).first();
    await expect(card).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('button').filter({ hasText: SOUTH_PACIFIC })).toHaveCount(0);
    await card.click();
    await page.waitForURL(/\/place\/pyongyang/, { timeout: 60_000 });
    expect(new URL(page.url()).pathname).toBe('/place/pyongyang');
  });

  test('갯벌 suggestion tap — UNESCO 카드만 /place (홈 튕김 없음)', async ({ page }) => {
    await page.goto('/explore');
    const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await expect(input).toBeVisible({ timeout: 60_000 });
    await input.fill('갯벌');
    await expect(
      page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' }),
    ).toHaveCount(3, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: /유부도와 서천갯벌/ })).toHaveCount(0);

    const cases = [
      { label: /고창\s*갯벌/, path: '/place/tour-2615234' },
      { label: /신안갯벌.*증도|증도/, path: /\/place\/tour-575607/ },
      { label: /순천만습지.*보성/, path: '/place/tour-126730' },
    ];

    for (const { label, path } of cases) {
      await input.fill('');
      await input.fill('갯벌');
      const card = page
        .locator('[data-search-popover] button')
        .filter({ hasNotText: 'MOONi' })
        .filter({ hasText: label })
        .first();
      await expect(card).toBeVisible({ timeout: 30_000 });
      await card.click();
      await page.waitForURL(path, { timeout: 60_000 });
      expect(new URL(page.url()).pathname).not.toBe('/');
      expect(new URL(page.url()).pathname).not.toBe('/explore');
      await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    }
  });
});

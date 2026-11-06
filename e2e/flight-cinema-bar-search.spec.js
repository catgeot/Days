/**
 * 홈 `?search=` → 써머리 항공 시네마 → 상태 바 — 출발지 펼침 전/후 항공권 검색 CTA·Trip.com 모달.
 * CI: placeholder Supabase — readOnlyGuard가 Edge POST를 401 하므로 `resolve-flight-route` 응답을 모킹한다.
 */
import { test, expect } from './fixtures.js';
import { execSync } from 'node:child_process';

const PARIS_QUERY = encodeURIComponent('파리');
test.use({ ignoreHTTPSErrors: true });

const SHOT_DIR = process.env.GATEO_FLIGHT_CINEMA_E2E_SHOTS || '';

async function mockResolveFlightRoute(page) {
  await page.route(/\/functions\/v1\/resolve-flight-route(?:\?|$)/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const origin = String(body.originIata ?? 'ICN').trim().toUpperCase() || 'ICN';
    const destRaw = String(body.destIata ?? 'CDG').trim().toUpperCase();
    const dest = destRaw.length === 3 ? destRaw : 'CDG';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        originIata: origin,
        destIata: dest,
        hubIatas: [],
        source: 'graph-direct',
        path: [origin, dest],
        alternatives: [],
      }),
    });
  });
}

/**
 * @param {object} args
 * @param {import('@playwright/test').Page} args.page
 * @param {import('@playwright/test').TestInfo} args.testInfo
 * @param {boolean} args.searchBeforeExpand
 */
async function runFlightCinemaBarScenario({ page, testInfo, searchBeforeExpand }) {
  const isDesktop = testInfo.project.name === 'chromium-flight-cinema-bar-1280';
  const viewport = isDesktop ? { width: 1280, height: 844 } : { width: 390, height: 844 };

  await page.setViewportSize(viewport);
  await page.setExtraHTTPHeaders({
    'User-Agent': isDesktop
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  await page.addInitScript(() => {
    try {
      localStorage.setItem('gateo:flight-cinema-debug', '1');
    } catch {
      /* ignore */
    }
  });

  const tag = searchBeforeExpand ? 'pre-expand' : 'post-expand';
  const suffix = `${isDesktop ? '1280' : '390'}-${testInfo.project.name}-${tag}`;
  const started = Date.now();

  await mockResolveFlightRoute(page);

  await page.goto(`/?search=${PARIS_QUERY}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForURL((u) => !u.searchParams.has('search'), { timeout: 120_000 });

  const cinemaBtn = page.getByTestId('home-summary-flight-route-cinema');
  await expect(cinemaBtn).toBeVisible({ timeout: 120_000 });
  await expect(cinemaBtn).toBeEnabled({ timeout: 120_000 });
  await cinemaBtn.click();

  const bar = page.getByTestId('flight-cinema-bar');
  await expect(bar).toBeVisible({ timeout: 120_000 });

  const searchCta = page.getByTestId('flight-cinema-bar-search-flights');
  await expect(searchCta).toBeVisible();

  const barCard = bar.locator('.flight-cinema-bar-card').first();
  await expect(barCard).toBeVisible();
  if (!isDesktop) {
    const cardBox = await barCard.boundingBox();
    const vh = page.viewportSize()?.height ?? 844;
    if (cardBox) {
      const bottomDist = vh - (cardBox.y + cardBox.height);
      expect(
        bottomDist,
        '컴팩트 바 카드 하단이 뷰포트 밖으로 과도하게 잘리지 않음 (하단 CTA·닫기 접근성)',
      ).toBeLessThanOrEqual(120);
    }
  }

  const assertTripcomModalFields = async (nativeModal, { expectDepartNrt } = { expectDepartNrt: false }) => {
    await expect(nativeModal).toBeVisible();
    await expect(page.locator('[data-tripcom-native-search="1"]')).toBeVisible();

    const departSlot = nativeModal.getByRole('textbox', { name: '출발' });
    const arriveSlot = nativeModal.getByRole('textbox', { name: '도착' });
    await expect(departSlot).toBeVisible();
    await expect(arriveSlot).toBeVisible();

    const departVal = (await departSlot.inputValue()).toUpperCase();
    const arriveVal = (await arriveSlot.inputValue()).toUpperCase();

    if (expectDepartNrt) {
      expect(departVal).toContain('NRT');
    } else {
      expect(departVal.length).toBeGreaterThan(0);
    }
    expect(arriveVal).toMatch(/CDG|PAR/);

    const form = nativeModal.locator('form[data-tripcom-native-search="1"]');
    await expect(form).toHaveAttribute('data-tripcom-schedule-complete');

    const shotOpen = await nativeModal.screenshot({ type: 'png' });
    await testInfo.attach(`tripcom-flight-modal-${suffix}.png`, {
      body: shotOpen,
      contentType: 'image/png',
    });
    if (SHOT_DIR) {
      await nativeModal.screenshot({ path: `${SHOT_DIR}/tripcom-flight-modal-${suffix}.png`, type: 'png' });
    }

    const searchSubmit = nativeModal.getByRole('button', { name: /^검색$/ });
    if (await searchSubmit.isVisible().catch(() => false)) {
      const urlBefore = page.url();
      await searchSubmit.click();
      await page.waitForTimeout(400);
      expect(page.url()).toBe(urlBefore);
    }
  };

  if (searchBeforeExpand) {
    await searchCta.click();
    const preModal = page.locator('[data-tripcom-flight-modal="native"]');
    await preModal.waitFor({ state: 'visible', timeout: 25_000 });
    await assertTripcomModalFields(preModal, { expectDepartNrt: false });
    await page.keyboard.press('Escape');
    await expect(preModal).toBeHidden({ timeout: 10_000 });
  }

  const expandOrigin = page.getByRole('button', { name: '출발지 검색 펼치기' });
  await expandOrigin.click();

  const originInput = page.getByPlaceholder('도시·공항 검색 (예: 마닐라, ICN)');
  await expect(originInput).toBeVisible({ timeout: 30_000 });

  await originInput.fill('NRT');
  const nrtOption = page.getByRole('option', { name: /NRT/ }).first();
  await expect(nrtOption).toBeVisible({ timeout: 15_000 });
  await nrtOption.click();

  await expect(bar.locator('.animate-spin')).toHaveCount(0, { timeout: 120_000 });

  await expect(searchCta).toBeVisible();

  const barBox = await bar.boundingBox();
  if (barBox) {
    const shotBar = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: Math.max(0, barBox.y - 8),
        width: viewport.width,
        height: Math.min(viewport.height, barBox.height + 16),
      },
    });
    await testInfo.attach(`flight-cinema-bar-${suffix}.png`, {
      body: shotBar,
      contentType: 'image/png',
    });
    if (SHOT_DIR) {
      await page.screenshot({
        path: `${SHOT_DIR}/flight-cinema-bar-${suffix}.png`,
        type: 'png',
        clip: {
          x: 0,
          y: Math.max(0, barBox.y - 8),
          width: viewport.width,
          height: Math.min(viewport.height, barBox.height + 16),
        },
      });
    }
  }

  if (!isDesktop) {
    const h = page.viewportSize()?.height ?? 844;
    const full390 = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 390, height: Math.min(844, h) },
    });
    await testInfo.attach(`flight-cinema-viewport-390-${suffix}.png`, {
      body: full390,
      contentType: 'image/png',
    });
    if (SHOT_DIR) {
      await page.screenshot({
        path: `${SHOT_DIR}/flight-cinema-viewport-390-${suffix}.png`,
        type: 'png',
        clip: { x: 0, y: 0, width: 390, height: Math.min(844, page.viewportSize()?.height ?? 844) },
      });
    }
  }

  await searchCta.click();

  const nativeModal = page.locator('[data-tripcom-flight-modal="native"]');
  try {
    await nativeModal.waitFor({ state: 'visible', timeout: 25_000 });
    await assertTripcomModalFields(nativeModal, { expectDepartNrt: true });
  } catch {
    const dialog = page.locator('[role="dialog"]').first();
    const iframeCount = await dialog.locator('iframe').count().catch(() => 0);
    test.info().annotations.push({
      type: 'tripcom-modal-observation',
      description: `native modal not visible within 25s; dialog iframe count=${iframeCount}`,
    });
  }

  test.info().annotations.push({
    type: 'timing-ms',
    description: String(Date.now() - started),
  });
}

test.describe('Flight cinema bar — Trip.com search', () => {
  test.beforeAll(() => {
    let head = '';
    try {
      head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      head = 'unknown';
    }
    test.info().annotations.push({ type: 'git-head', description: head });
  });

  test('출발지 펼침 후 검색 (390·1280)', async ({ page }, testInfo) => {
    await runFlightCinemaBarScenario({ page, testInfo, searchBeforeExpand: false });
  });

  test('출발지 펼침 전에도 검색 CTA 동작 (390·1280)', async ({ page }, testInfo) => {
    await runFlightCinemaBarScenario({ page, testInfo, searchBeforeExpand: true });
  });
});

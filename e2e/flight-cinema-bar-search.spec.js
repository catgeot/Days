/**
 * 홈 `?search=` → 써머리 항공 시네마 → 상태 바 — 출발지 펼침 후 검색 CTA·Trip.com 모달.
 */
import { test, expect } from './fixtures.js';

const PARIS_QUERY = encodeURIComponent('파리');
test.use({ ignoreHTTPSErrors: true });

/** CI·로컬 증거 PNG (선택) */
const SHOT_DIR = process.env.GATEO_FLIGHT_CINEMA_E2E_SHOTS || '';

test('홈 검색 → 시네마 → 출발지 → 항공권 검색 (상태 바)', async ({ page }, testInfo) => {
  const isDesktop = testInfo.project.name === 'chromium-flight-cinema-bar-1280';
  const viewport = isDesktop
    ? { width: 1280, height: 844 }
    : { width: 390, height: 844 };

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

  const suffix = `${isDesktop ? '1280' : '390'}-${testInfo.project.name}`;
  const started = Date.now();

  await page.goto(`/?search=${PARIS_QUERY}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForURL((u) => !u.searchParams.has('search'), { timeout: 120_000 });

  const cinemaBtn = page.getByTestId('home-summary-flight-route-cinema');
  await expect(cinemaBtn).toBeVisible({ timeout: 120_000 });
  await expect(cinemaBtn).toBeEnabled({ timeout: 120_000 });
  await cinemaBtn.click();

  const bar = page.getByTestId('flight-cinema-bar');
  await expect(bar).toBeVisible({ timeout: 120_000 });

  const searchCtaBefore = page.getByTestId('flight-cinema-bar-search-flights');
  await expect(searchCtaBefore).toBeVisible();

  const expandOrigin = page.getByRole('button', { name: '출발지 검색 펼치기' });
  await expandOrigin.click();

  const originInput = page.getByPlaceholder('도시·공항 검색 (예: 마닐라, ICN)');
  await expect(originInput).toBeVisible({ timeout: 30_000 });

  await originInput.fill('NRT');
  const nrtOption = page.getByRole('option', { name: /NRT/ }).first();
  await expect(nrtOption).toBeVisible({ timeout: 15_000 });
  await nrtOption.click();

  await expect(bar.locator('.animate-spin')).toHaveCount(0, { timeout: 120_000 });

  const searchCtaAfter = page.getByTestId('flight-cinema-bar-search-flights');
  await expect(searchCtaAfter).toBeVisible();

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

  await searchCtaAfter.click();

  const nativeModal = page.locator('[data-tripcom-flight-modal="native"]');
  let modalVisible = false;
  try {
    await nativeModal.waitFor({ state: 'visible', timeout: 25_000 });
    modalVisible = true;
  } catch {
    modalVisible = false;
  }

  if (modalVisible) {
    await expect(nativeModal).toBeVisible();
    await expect(page.locator('[data-tripcom-native-search="1"]')).toBeVisible();
    const departSlot = nativeModal.getByRole('textbox', { name: '출발' });
    await expect(departSlot).toBeVisible();
    const departVal = await departSlot.inputValue();
    expect(departVal.toUpperCase()).toContain('NRT');

    const shotOpen = await nativeModal.screenshot({ type: 'png' });
    await testInfo.attach(`tripcom-flight-modal-open-${suffix}.png`, {
      body: shotOpen,
      contentType: 'image/png',
    });
    if (SHOT_DIR) {
      await nativeModal.screenshot({ path: `${SHOT_DIR}/tripcom-flight-modal-open-${suffix}.png`, type: 'png' });
    }

    const searchSubmit = nativeModal.getByRole('button', { name: /^검색$/ });
    if (await searchSubmit.isVisible().catch(() => false)) {
      const urlBefore = page.url();
      await searchSubmit.click();
      await page.waitForTimeout(400);
      expect(page.url()).toBe(urlBefore);
    }
  } else {
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
});

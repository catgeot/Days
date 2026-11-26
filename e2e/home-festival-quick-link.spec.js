import { test, expect } from './fixtures.js';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';

function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

async function waitGlobe(page) {
  await expect(page.locator('.mapboxgl-canvas, canvas').first()).toBeVisible({ timeout: 120_000 });
}

async function openFestivalFromHome(page) {
  const expand = page.getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i });
  await expect(expand).toBeVisible({ timeout: 60_000 });
  await expand.click();
  const festival = page.getByRole('link', { name: /한국의 축제로 이동|Go to Korea festivals/i });
  await expect(festival).toBeVisible({ timeout: 30_000 });
  await festival.click();
  await expect(page).toHaveURL(/\/korea/, { timeout: 30_000 });
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 60_000 });
}

function visibleQuickLinks(page) {
  return page.getByTestId('home-quick-links').locator('visible=true');
}

async function holdQuickLinkNavigation(page) {
  await page.evaluate(() => {
    document.addEventListener('click', (event) => {
      const node = event.target instanceof Element ? event.target : null;
      const link = node?.closest('a');
      if (link?.closest('[data-testid="home-quick-links"]')) event.preventDefault();
    }, true);
  });
}

async function quicklinkPayloads(page) {
  return page.evaluate(() => {
    const fromBuffer = (window.__GATEO_GA_EVENTS__ || [])
      .filter((event) => event.name === 'quicklink_click')
      .map((event) => event.params);
    const fromDataLayer = [];
    for (const entry of window.dataLayer || []) {
      if (entry && entry[0] === 'event' && entry[1] === 'quicklink_click') {
        fromDataLayer.push({ ...entry[2] });
      }
    }
    return { fromBuffer, fromDataLayer };
  });
}

function quicklinkEvent(item) {
  return {
    item,
    surface: 'home_menu',
    expanded: true,
    traffic_type: 'internal',
  };
}

test.describe('Home quick link — 축제', () => {
  test('fresh home → 축제 hub, 0 removeChild pageerrors', async ({ page }, testInfo) => {
    const errors = trackPageErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);
    await openFestivalFromHome(page);
    await page.screenshot({
      path: `/opt/cursor/artifacts/home-festival-${testInfo.project.name}-fresh.png`,
      clip: { x: 0, y: 0, width: testInfo.project.use.viewport?.width ?? 390, height: 480 },
    });
    const removeChild = errors.filter((e) => /removeChild/i.test(e));
    expect(removeChild, removeChild.join('\n')).toHaveLength(0);
  });

  test('flag off keeps four items and AI curation on /blog/curation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);
    const collapsed = visibleQuickLinks(page);
    await expect(collapsed).toBeVisible({ timeout: 60_000 });
    await expect(collapsed).toHaveText(/축제\s*·\s*행사\s*·\s*명승\s*·\s*추천/);
    await expect(collapsed).toContainText('추천');
    await expect(collapsed).not.toContainText('리뷰');
    await page.getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i }).click();
    const menu = visibleQuickLinks(page);
    const links = menu.getByRole('link');
    await expect(links).toHaveCount(4);
    const curation = menu.getByRole('link', { name: /AI 큐레이션로 이동|Go to AI curation/i });
    await expect(curation).toBeVisible();
    await expect(curation).toHaveAttribute('href', '/blog/curation');
    await expect(menu.getByRole('link', { name: /리뷰 창고로 이동|Go to Review hub/i })).toHaveCount(0);
    await expect(menu.getByText('교체')).toHaveCount(0);
  });

  test('query flag on swaps the fourth item to the review hub', async ({ page }) => {
    await page.goto('/?quicklink_review_tab=1', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);
    const collapsed = visibleQuickLinks(page);
    await expect(collapsed).toBeVisible({ timeout: 60_000 });
    await expect(collapsed).toHaveText(/축제\s*·\s*행사\s*·\s*명승\s*·\s*리뷰/);
    await expect(collapsed).toContainText('리뷰');
    await expect(collapsed).not.toContainText('추천');
    await expect(collapsed).toHaveAttribute(
      'aria-label',
      /바로가기 메뉴 펼치기 — 한국의 축제, 세계의 행사, 한국의 명승, 리뷰 창고|Expand quick links — Korea festivals, World events, Korea scenic spots, Review hub/,
    );
    await collapsed.click();
    const menu = visibleQuickLinks(page);
    const links = menu.getByRole('link');
    await expect(links).toHaveCount(4);
    await expect(menu.getByRole('link', { name: /한국의 축제로 이동|Go to Korea festivals/i })).toHaveAttribute(
      'href',
      '/korea',
    );
    await expect(menu.getByRole('link', { name: /세계의 행사로 이동|Go to World events/i })).toHaveAttribute(
      'href',
      '/world-events',
    );
    await expect(menu.getByRole('link', { name: /한국의 명승로 이동|Go to Korea scenic spots/i })).toHaveAttribute(
      'href',
      '/korea/theme/scenic',
    );
    const reviewHub = menu.getByRole('link', { name: /리뷰 창고로 이동|Go to Review hub/i });
    await expect(reviewHub).toBeVisible();
    await expect(reviewHub).toHaveAttribute('href', '/blog#review-hub');
    await expect(menu.getByRole('link', { name: /AI 큐레이션로 이동|Go to AI curation/i })).toHaveCount(0);
    await expect(menu.getByText('교체')).toHaveCount(0);
  });

  test('flag off sends quicklink_click for all four tiles, including AI curation, marked internal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);
    await holdQuickLinkNavigation(page);
    for (const name of [
      /한국의 축제로 이동|Go to Korea festivals/i,
      /세계의 행사로 이동|Go to World events/i,
      /한국의 명승로 이동|Go to Korea scenic spots/i,
      /AI 큐레이션로 이동|Go to AI curation/i,
    ]) {
      const toggle = page.getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i });
      if (await toggle.isVisible()) await toggle.click();
      await visibleQuickLinks(page).getByRole('link', { name }).click();
      await expect(page).toHaveURL(/\/(\?.*)?$/);
    }
    const payloads = await quicklinkPayloads(page);
    const expected = ['festival', 'world_events', 'scenic', 'curation'].map(quicklinkEvent);
    expect(payloads.fromBuffer).toEqual(expected);
    expect(payloads.fromDataLayer).toEqual(expected);
  });

  test('flag on sends review_hub instead of curation and still marks webdriver traffic internal', async ({ page }) => {
    await page.goto('/?quicklink_review_tab=1', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);
    await holdQuickLinkNavigation(page);
    for (const name of [
      /한국의 축제로 이동|Go to Korea festivals/i,
      /세계의 행사로 이동|Go to World events/i,
      /한국의 명승로 이동|Go to Korea scenic spots/i,
      /리뷰 창고로 이동|Go to Review hub/i,
    ]) {
      const toggle = page.getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i });
      if (await toggle.isVisible()) await toggle.click();
      await visibleQuickLinks(page).getByRole('link', { name }).click();
      await expect(page).toHaveURL(/\?quicklink_review_tab=1$/);
    }
    const payloads = await quicklinkPayloads(page);
    const expected = ['festival', 'world_events', 'scenic', 'review_hub'].map(quicklinkEvent);
    expect(payloads.fromBuffer).toEqual(expected);
    expect(payloads.fromDataLayer).toEqual(expected);
  });

  test('crawler=1 quicklink_click includes traffic_type internal', async ({ page }) => {
    await page.goto('/?crawler=1', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);
    await page.getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i }).click();
    await holdQuickLinkNavigation(page);
    await visibleQuickLinks(page).getByRole('link', { name: /AI 큐레이션로 이동|Go to AI curation/i }).click();
    await expect(page).toHaveURL(/\?crawler=1$/);
    const payloads = await quicklinkPayloads(page);
    expect(payloads.fromBuffer).toEqual([quicklinkEvent('curation')]);
    expect(payloads.fromDataLayer).toEqual([quicklinkEvent('curation')]);
  });

  test('flag on companion link sends mooni_curation_link_click; flag off has no link', async ({ page, context }) => {
    await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildGeminiProxyMockBody('혼자, 연인, 가족, 친구와 가기 좋은 곳을 나눠 볼게요.', {
            modelUsed: 'mock-companion',
          }),
        ),
      });
    });

    await page.goto('/place/paris', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.getByRole('button', { name: /MOONi에게 물어보기/ }).first().click();
    await page.getByRole('button', { name: /즐길거리/ }).first().click();
    await page.getByRole('button', { name: /동행별 추천/ }).first().click();
    await expect(page.getByText('혼자, 연인, 가족, 친구와 가기 좋은 곳을 나눠 볼게요.')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId('mooni-companion-curation-link')).toHaveCount(0);
    const offEvents = await page.evaluate(() =>
      (window.__GATEO_GA_EVENTS__ || []).filter((event) => event.name === 'mooni_curation_link_click'),
    );
    expect(offEvents).toEqual([]);

    await page.goto('/place/paris?quicklink_review_tab=1', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.getByRole('button', { name: /MOONi에게 물어보기/ }).first().click();
    await page.getByRole('button', { name: /즐길거리/ }).first().click();
    await page.getByRole('button', { name: /동행별 추천/ }).first().click();
    const link = page.getByTestId('mooni-companion-curation-link').locator('visible=true').first();
    await expect(link).toBeVisible({ timeout: 60_000 });
    await expect(link).toHaveText('취향에 맞는 여행지 더 찾기 → AI 큐레이션');
    await page.evaluate(() => {
      document.addEventListener('click', (event) => {
        const node = event.target instanceof Element ? event.target : null;
        if (node?.closest('[data-testid="mooni-companion-curation-link"]')) event.preventDefault();
      }, true);
    });
    await link.click();
    const payloads = await page.evaluate(() => {
      const fromBuffer = (window.__GATEO_GA_EVENTS__ || [])
        .filter((event) => event.name === 'mooni_curation_link_click')
        .map((event) => event.params);
      const fromDataLayer = [];
      for (const entry of window.dataLayer || []) {
        if (entry && entry[0] === 'event' && entry[1] === 'mooni_curation_link_click') {
          fromDataLayer.push({ ...entry[2] });
        }
      }
      return { fromBuffer, fromDataLayer };
    });
    const expected = [{ from_chip: 'companion', traffic_type: 'internal' }];
    expect(payloads.fromBuffer).toEqual(expected);
    expect(payloads.fromDataLayer).toEqual(expected);
  });
});
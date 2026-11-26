import { test, expect } from './fixtures.js';

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
});
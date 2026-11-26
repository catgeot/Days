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
});
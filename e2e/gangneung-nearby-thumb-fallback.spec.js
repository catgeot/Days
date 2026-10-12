import { test, expect } from './fixtures.js';

const FESTIVAL_ID = '2930716';
const SCREENSHOT_DIR = '/opt/cursor/artifacts/screenshots';

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

test.describe('Gangneung nearby thumbs — WebKit iPhone 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('blocked VisitKorea photos show landmark placeholders, not broken glyphs', async ({
    page,
  }) => {
    await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
    await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());

    await page.goto('/korea/');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 90_000 });
    await dismissLocHint(page);

    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 90_000 });

    const near = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(near).toBeVisible({ timeout: 120_000 });
    await expect(near.locator('[data-nearby-thumb="empty"]').first()).toBeVisible({
      timeout: 120_000,
    });

    const brokenImgs = near.locator('img[data-festival-photo]');
    const count = await brokenImgs.count();
    for (let i = 0; i < count; i++) {
      const img = brokenImgs.nth(i);
      const visible = await img.isVisible().catch(() => false);
      if (!visible) continue;
      const nw = await img.evaluate((el) => el.naturalWidth);
      expect(nw, `visible nearby img naturalWidth ${nw}`).toBeGreaterThan(0);
    }

    await near.screenshot({
      path: `${SCREENSHOT_DIR}/gangneung-nearby-webkit-390-thumb-fallback.png`,
    });
  });
});

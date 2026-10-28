// /place desktop left info (VITE_GATEO_PLACE_DESKTOP_LEFT_INFO=1) — layout + id uniqueness
import { test, expect } from './fixtures.js';

test.use({ ignoreHTTPSErrors: true });

async function expectPlaceTitle(page, label) {
  await page.goto('/place/cairo?lang=ko');
  await expect(page.getByText(label).first()).toBeVisible({ timeout: 60_000 });
}

test.describe('place desktop left info (flag-on build)', () => {
  test('1440 — #facts in left overview, single id, no page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectPlaceTitle(page, '카이로');

    const layout = await page.evaluate(() => {
      const facts = document.querySelector('#facts');
      const galleryScroll = document.querySelector('[data-place-gallery-scroll]');
      const overviewScroll = document.querySelector('[data-place-overview-scroll]');
      const ids = document.querySelectorAll('#facts').length;
      const inGallery =
        facts && galleryScroll ? galleryScroll.contains(facts) : false;
      const inOverview =
        facts && overviewScroll ? overviewScroll.contains(facts) : false;
      return {
        ids,
        inGallery,
        inOverview,
        pageScroll:
          document.documentElement.scrollHeight === window.innerHeight,
      };
    });

    expect(layout.ids).toBe(1);
    expect(layout.inGallery).toBe(false);
    expect(layout.inOverview).toBe(true);
    expect(layout.pageScroll).toBe(true);
  });

  test('390 after starting at 1440 — single #facts/#stories in gallery', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectPlaceTitle(page, '카이로');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () => !window.matchMedia('(min-width: 1024px)').matches,
    );
    await expect(page.locator('#facts')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /다녀온 이야기/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /뒤로|Back/i })).toBeVisible();
    const inGallery = await page.evaluate(() => {
      const facts = document.querySelector('#facts');
      const galleryScroll = document.querySelector('[data-place-gallery-scroll]');
      return Boolean(facts && galleryScroll && galleryScroll.contains(facts));
    });
    expect(inGallery).toBe(true);
  });

  test('390 — #facts above first gallery image (mobile regression)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expectPlaceTitle(page, '카이로');
    await expect(page.locator('#facts')).toHaveCount(1);
    await page.waitForSelector('[data-place-gallery-scroll] img[alt^="place-img"]', { timeout: 30_000 });

    const order = await page.evaluate(() => {
      const facts = document.querySelector('#facts');
      const firstImg = document.querySelector('[data-place-gallery-scroll] img[alt^="place-img"]');
      if (!facts || !firstImg) {
        return { ok: false, ids: document.querySelectorAll('#facts').length };
      }
      return {
        ok: facts.getBoundingClientRect().top < firstImg.getBoundingClientRect().top,
        ids: document.querySelectorAll('#facts').length,
      };
    });

    expect(order.ids).toBe(1);
    expect(order.ok).toBe(true);
  });

  test('jeonju 1440 — no facts/stories blocks or empty wrapper', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/place/jeonju?lang=ko');
    await expect(page.getByText(/Jeonju|전주/i).first()).toBeVisible({ timeout: 60_000 });

    const state = await page.evaluate(() => ({
      facts: document.querySelectorAll('#facts').length,
      stories: document.querySelectorAll('#stories').length,
      emptyLocalInfoShell: document.querySelectorAll('[data-place-local-info-shell]').length,
    }));

    expect(state.facts).toBe(0);
    expect(state.stories).toBe(0);
    expect(state.emptyLocalInfoShell).toBe(0);
  });

  test('hash #facts scrolls inside left overview at 1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/place/cairo?lang=ko#facts');
    await expect(page.getByText('카이로').first()).toBeVisible({ timeout: 60_000 });

    await page.waitForFunction(() => {
      const scroller = document.querySelector('[data-place-overview-scroll]');
      const facts = document.querySelector('#facts');
      if (!scroller || !facts) return false;
      const fr = facts.getBoundingClientRect();
      const sr = scroller.getBoundingClientRect();
      return fr.top >= sr.top - 4 && fr.bottom <= sr.bottom + 4;
    }, { timeout: 15_000 });

    const pageScroll = await page.evaluate(
      () => document.documentElement.scrollHeight === window.innerHeight,
    );
    expect(pageScroll).toBe(true);
  });
});

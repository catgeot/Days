/**
 * 11/19 site patrol regressions — mocks, supabase POST blocked (readOnlyGuard).
 *
 * npx playwright test -c playwright.config.site-patrol-1119.js
 */
import { test, expect } from '@playwright/test';
import { installReadOnlyGuard } from './readOnlyGuard.js';

const GYG_STUB = `(() => {
  const mount = () => {
    document.querySelectorAll('[data-gyg-widget="activities"]').forEach((el) => {
      const q = el.getAttribute('data-gyg-q') || '';
      let frame = el.querySelector('iframe');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.title = 'GetYourGuide activities';
        el.appendChild(frame);
      }
      frame.setAttribute('data-mock-gyg-q', q);
    });
  };
  const obs = new MutationObserver(mount);
  obs.observe(document.documentElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['data-gyg-q'] });
  mount();
})();`;

const ROUND = Number(process.env.SITE_PATROL_ROUNDS || '3');

async function installGygMock(page) {
  await page.route('**/*getyourguide.com/**', (route) => route.abort());
  await page.route('**/pa.umd.production.min.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: GYG_STUB,
    }),
  );
}

async function captureViewport(page, filename, width, height) {
  await page.screenshot({
    path: `/opt/cursor/artifacts/${filename}`,
    clip: { x: 0, y: 0, width, height },
  });
}

async function expectTourModal(page, viewport) {
  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '투어 목록' })).toBeVisible({ timeout: 60_000 });
  }
}

async function expectStayModal(page, viewport) {
  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({ timeout: 60_000 });
  }
}

test.beforeEach(async ({ page, context }) => {
  await installReadOnlyGuard(context);
  await installGygMock(page);
});

test.describe('site patrol 11/19 fixes', () => {
  test(`deeplink service switch stay→tour reopens modal (${ROUND} rounds)`, async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    for (let i = 0; i < ROUND; i += 1) {
      await page.goto('/place/khao-lak?open=stay&from=review&lang=ko', {
        waitUntil: 'domcontentloaded',
      });
      await expectStayModal(page, viewport);
      await page.goto('/place/khao-lak?open=tour&from=review&lang=ko', {
        waitUntil: 'domcontentloaded',
      });
      await expectTourModal(page, viewport);
    }
  });

  test(`stay deeplink back then tour deeplink (${ROUND} rounds)`, async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    for (let i = 0; i < ROUND; i += 1) {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await page.goto('/place/khao-lak?open=stay&from=review&lang=ko', {
        waitUntil: 'domcontentloaded',
      });
      await expectStayModal(page, viewport);
      await page.goBack();
      await page.goto('/place/khao-lak?open=tour&from=review&lang=ko', {
        waitUntil: 'domcontentloaded',
      });
      await expectTourModal(page, viewport);
    }
  });

  test(`open=tour flight CTA not stuck on 갱신 중 (${ROUND} rounds)`, async ({ page }) => {
    for (const slug of ['khao-lak', 'jeju']) {
      for (let i = 0; i < ROUND; i += 1) {
        await page.goto(`/place/${slug}?open=tour&lang=ko`, { waitUntil: 'domcontentloaded' });
        const flightBtn = page.getByRole('button', { name: /ICN|항공|비행|갱신|준비|경로/ }).first();
        await expect(flightBtn).toBeVisible({ timeout: 60_000 });
        await expect
          .poll(
            async () => (await flightBtn.innerText()).trim().includes('갱신 중'),
            { timeout: 26_000, intervals: [400, 800, 1200] },
          )
          .toBe(false);
      }
    }
  });

  test(`deeplink place document title (${ROUND} rounds)`, async ({ page }) => {
    for (let i = 0; i < ROUND; i += 1) {
      await page.goto('/place/khao-lak?open=tour&lang=ko', { waitUntil: 'domcontentloaded' });
      await expect
        .poll(async () => page.evaluate(() => document.title), { timeout: 30_000 })
        .toMatch(/GATEO/);
      await expect
        .poll(async () => page.evaluate(() => document.title), { timeout: 30_000 })
        .not.toBe('');
    }
  });

  test(`festival detail document title (${ROUND} rounds)`, async ({ page }) => {
    const festivalId = '637693';
    for (let i = 0; i < ROUND; i += 1) {
      await page.goto(`/korea?festival=${festivalId}&lang=ko`, { waitUntil: 'domcontentloaded' });
      await expect
        .poll(async () => page.evaluate(() => document.title), { timeout: 60_000 })
        .not.toBe('한국의 축제 | GATEO');
      await page.keyboard.press('Escape');
      await expect
        .poll(async () => page.evaluate(() => document.title), { timeout: 30_000 })
        .toBe('한국의 축제 | GATEO');
    }
  });

  test('stay modal sheet opaque @390', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, '390 only');
    await page.goto('/place/khao-lak?open=stay&lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
    const alpha = await page.evaluate(() => {
      const panel = document.getElementById('globe-stay-strip-panel');
      if (!panel) return null;
      const bg = getComputedStyle(panel).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return m[4] == null ? 1 : Number(m[4]);
    });
    expect(alpha).toBeGreaterThanOrEqual(0.99);
    await captureViewport(page, 'site-patrol-1119-stay-modal-390-after.png', 390, 844);
  });

  test('place gallery scroll bottom inset for related city chips @390', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, '390 only');
    await page.goto('/place/paris?lang=ko', { waitUntil: 'domcontentloaded' });
    const scroll = page.locator('[data-place-gallery-scroll=""]').first();
    await expect(scroll).toBeVisible({ timeout: 60_000 });
    const paddingBottomPx = await scroll.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(paddingBottomPx).toBeGreaterThanOrEqual(120);
    await captureViewport(page, 'site-patrol-1119-paris-gallery-scroll-390-after.png', 390, 844);
  });

  test('deeplink tour modal screenshot @1280', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    test.skip(viewport.width < 1024, '1280 only');
    await page.goto('/place/khao-lak?open=tour&from=review&lang=ko', {
      waitUntil: 'domcontentloaded',
    });
    await expectTourModal(page, viewport);
    await captureViewport(page, 'site-patrol-1119-tour-deeplink-1280-after.png', 1280, 900);
  });
});
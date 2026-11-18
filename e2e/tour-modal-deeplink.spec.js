/**
 * /place/:slug?open=tour|stay → 홈 써머리에서 서비스 모달 1회 (GYG mock).
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js tour-modal-deeplink
 */
import { test, expect } from '@playwright/test';

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

async function installGtagCapture(page) {
  await page.addInitScript(() => {
    window.__gateoGaEvents = [];
    window.gtag = (cmd, name, params) => {
      if (cmd === 'event') window.__gateoGaEvents.push({ name, params });
    };
  });
}

async function captureViewport(page, filename, width, height) {
  await page.screenshot({
    path: `/opt/cursor/artifacts/${filename}`,
    clip: { x: 0, y: 0, width, height },
  });
}

async function expectTourModalOpen(page, viewport) {
  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '투어 목록' })).toBeVisible({ timeout: 60_000 });
  }
}

async function expectStayModalOpen(page, viewport) {
  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({ timeout: 60_000 });
  }
}

function expectPlacePathWithoutDeeplinkQuery(page, slug) {
  return expect
    .poll(async () => {
      const url = new URL(page.url());
      return {
        pathname: url.pathname,
        hasOpen: url.searchParams.has('open'),
        hasFrom: url.searchParams.has('from'),
      };
    })
    .toEqual({
      pathname: `/place/${slug}`,
      hasOpen: false,
      hasFrom: false,
    });
}

async function closeTourModal(page, viewport) {
  const closeTour =
    viewport.width < 1024
      ? page.getByRole('button', { name: '투어 목록 닫기' }).first()
      : page.locator('#globe-tour-strip-panel').getByRole('button', { name: '투어 목록 닫기' });
  await closeTour.click({ force: true });
}

test.beforeEach(async ({ page }) => {
  await installGtagCapture(page);
  await installGygMock(page);
});

test.describe('place tour modal deeplink', () => {
  test('open=tour keeps place URL and opens modal once', async ({ page }, testInfo) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    const shot =
      viewport.width < 1024
        ? 'tour-modal-deeplink-tour-390.png'
        : 'tour-modal-deeplink-tour-1280.png';

    await page.goto('/place/kyoto?open=tour&from=review&lang=ko', {
      waitUntil: 'domcontentloaded',
    });
    await expectPlacePathWithoutDeeplinkQuery(page, 'kyoto');
    await expectTourModalOpen(page, viewport);

    await expect
      .poll(async () => {
        const events = await page.evaluate(() => window.__gateoGaEvents || []);
        return events.find((e) => e.name === 'service_modal_open')?.params?.service;
      })
      .toBe('tour');
    const events = await page.evaluate(() => window.__gateoGaEvents || []);
    const openEv = events.find((e) => e.name === 'service_modal_open');
    expect(openEv?.params?.service).toBe('tour');
    expect(openEv?.params?.from).toBe('deeplink');
    expect(openEv?.params?.ref).toBe('review');
    expect(openEv?.params?.slug).toBe('kyoto');

    await captureViewport(page, shot, viewport.width, viewport.height);

    await page.waitForTimeout(6_000);
    await expectPlacePathWithoutDeeplinkQuery(page, 'kyoto');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/kyoto(\?|$)/);
    if (viewport.width < 1024) {
      await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toHaveCount(0);
    } else {
      await expect(page.getByRole('region', { name: '투어 목록' })).toHaveCount(0);
    }
  });

  test('after close and reload, place URL persists without modal reopen', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    await page.goto('/place/kyoto?open=tour&from=review&lang=ko', {
      waitUntil: 'domcontentloaded',
    });
    await expectTourModalOpen(page, viewport);
    await expectPlacePathWithoutDeeplinkQuery(page, 'kyoto');

    await closeTourModal(page, viewport);
    await expect
      .poll(async () => {
        if (viewport.width < 1024) {
          return page.getByRole('dialog', { name: '투어 전체 목록' }).count();
        }
        return page.getByRole('region', { name: '투어 목록' }).count();
      })
      .toBe(0);

    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/kyoto/);
    const url = new URL(page.url());
    expect(url.searchParams.has('open')).toBe(false);
    expect(url.searchParams.has('from')).toBe(false);
    if (viewport.width < 1024) {
      await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toHaveCount(0);
    } else {
      await expect(page.getByRole('region', { name: '투어 목록' })).toHaveCount(0);
    }
  });

  test('open=stay opens stay modal only', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    await page.goto('/place/khao-lak?open=stay&lang=ko', { waitUntil: 'domcontentloaded' });
    await expectPlacePathWithoutDeeplinkQuery(page, 'khao-lak');
    await expectStayModalOpen(page, viewport);
    if (viewport.width < 1024) {
      await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toHaveCount(0);
    }
  });

  test('invalid open strips query and does not open modal', async ({ page }) => {
    await page.goto('/place/kyoto?open=foo&lang=ko', { waitUntil: 'domcontentloaded' });
    await expectPlacePathWithoutDeeplinkQuery(page, 'kyoto');
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toHaveCount(0);
    const url = new URL(page.url());
    expect(url.searchParams.get('lang')).toBe('ko');
  });

  test('planner tab without open param is unchanged', async ({ page }) => {
    await page.goto('/place/kyoto/planner?lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/kyoto\/planner/, { timeout: 60_000 });
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toHaveCount(0);
  });

  test('domestic open=tour (MRT) opens tour modal', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    await page.goto('/place/jeju?open=tour&lang=ko', { waitUntil: 'domcontentloaded' });
    await expectPlacePathWithoutDeeplinkQuery(page, 'jeju');
    await expectTourModalOpen(page, viewport);
  });

  test('close modal and browser back leaves deeplink consumed', async ({ page, context }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 900 };
    await context.setExtraHTTPHeaders({});
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    await page.goto('/place/kyoto?open=tour&lang=ko', { waitUntil: 'domcontentloaded' });
    await expectTourModalOpen(page, viewport);
    await closeTourModal(page, viewport);
    await page.goBack();
    await expect(page).toHaveURL(/\/blog/, { timeout: 30_000 });
  });
});
// Globe pin / curation handoff regressions — #159, #128/#130, 75dd7bfe
import { test, expect } from '@playwright/test';
import {
  createGlobeAdapterCameraQueue,
  flushGlobeAdapterCameraQueue,
} from '../src/pages/Home/lib/globeApiRegistry.js';

test.use({ ignoreHTTPSErrors: true });

test.describe('globe adapter camera queue (unit)', () => {
  test('latest-wins, flush once, clear on unmount pattern', () => {
    const queue = createGlobeAdapterCameraQueue();
    queue.set('flyToAndPin', [1, 2, 'a', null, {}]);
    queue.set('flyToAndPin', [3, 4, 'b', null, {}]);
    expect(queue.peek()?.args[0]).toBe(3);

    const calls = [];
    const child = {
      flyToAndPin: (...args) => {
        calls.push(args);
      },
    };
    flushGlobeAdapterCameraQueue(queue, child);
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe(3);
    expect(queue.peek()).toBeNull();

    flushGlobeAdapterCameraQueue(queue, child);
    expect(calls).toHaveLength(1);

    queue.set('flyToRegion', [10, 20, 5]);
    queue.clear();
    expect(queue.peek()).toBeNull();
  });
});

function attachGlobePageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(String(err?.message || err));
  });
  return errors;
}

function isContinuePlacementError(message) {
  return /continuePlacement/i.test(message) && /(\.get\b|reading 'get')/i.test(message);
}

function isStyleNotDoneLoadingError(message) {
  return /Style is not done loading/i.test(message);
}

async function waitForGlobeMap(page) {
  const map = page.locator('.mapboxgl-map').first();
  await expect(map).toBeVisible({ timeout: 60_000 });
  return map;
}

async function readMapCenterViaGlobeApi(page) {
  return page.evaluate(() => {
    const view = window.__gateoGlobeApi?.getMapView?.();
    if (!view?.center) return null;
    return {
      center: { lng: view.center.lng, lat: view.center.lat },
      zoom: view.zoom ?? null,
    };
  });
}

async function waitForGlobeApi(page, { timeoutMs = 60_000 } = {}) {
  await page.waitForFunction(
    () => {
      const api = window.__gateoGlobeApi;
      const view = api?.getMapView?.();
      return Boolean(api && view?.center);
    },
    { timeout: timeoutMs },
  );
}

/** Session keys from curation handoff; falls back to test seed coords. */
async function resolveCurationFlyTarget(page, fallback) {
  const fromSession = await page.evaluate(() => {
    const readKey = (key) => {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const loc = parsed.location ?? parsed;
        const lat = Number(loc?.lat);
        const lng = Number(loc?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        if (lat === 0 && lng === 0) return null;
        return { lat, lng };
      } catch {
        return null;
      }
    };
    return (
      readKey('gateo_curation_pending_home') ??
      readKey('gateo_curation_data') ??
      null
    );
  });
  if (fromSession) return fromSession;
  return fallback;
}

async function expectCameraNearTarget(
  page,
  { lat, lng, toleranceDeg = 0.35, timeoutMs = 45_000 },
) {
  await page.waitForFunction(
    ({ targetLat, targetLng, tol }) => {
      const view = window.__gateoGlobeApi?.getMapView?.();
      if (!view?.center) return false;
      const dLat = Math.abs(view.center.lat - targetLat);
      const dLng = Math.abs(view.center.lng - targetLng);
      return dLat <= tol && dLng <= tol;
    },
    { targetLat: lat, targetLng: lng, tol: toleranceDeg },
    { timeout: timeoutMs },
  );
}

test.describe('Globe crash regressions', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\.supabase\.co/i, async (route) => {
      const req = route.request();
      if (req.method() !== 'GET') {
        await route.abort();
        return;
      }
      await route.continue();
    });
  });

  test('home load — no uncaught Style is not done loading', async ({ page }) => {
    const errors = attachGlobePageErrors(page);
    await page.goto('/');
    await waitForGlobeMap(page);
    await page.waitForTimeout(4_000);
    const styleErrors = errors.filter(isStyleNotDoneLoadingError);
    expect(styleErrors).toEqual([]);
  });

  test('curation — cold home via 전체 지도에서 보기 shows map and flies', async ({ page }) => {
    const errors = attachGlobePageErrors(page);
    const curationSeed = {
      location: '보라카이',
      slug: 'boracay',
      lat: 11.9674,
      lng: 121.9248,
      country: '필리핀',
      savedAt: Date.now(),
    };
    await page.addInitScript((payload) => {
      sessionStorage.setItem('gateo_curation_data', JSON.stringify(payload));
      localStorage.setItem('gateo_curation_history', JSON.stringify([payload]));
    }, curationSeed);
    await page.goto('/blog/curation', { waitUntil: 'domcontentloaded' });
    const viewOnGlobe = page.getByRole('button', { name: /전체 지도에서 보기|View on globe/i }).first();
    await expect(viewOnGlobe).toBeVisible({ timeout: 60_000 });
    await viewOnGlobe.click();
    await expect(page).toHaveURL(/\//, { timeout: 30_000 });
    await waitForGlobeMap(page);
    await waitForGlobeApi(page);
    const startView = await readMapCenterViaGlobeApi(page);
    expect(startView?.center).toBeTruthy();
    const flyTarget = await resolveCurationFlyTarget(page, {
      lat: curationSeed.lat,
      lng: curationSeed.lng,
    });
    await expectCameraNearTarget(page, flyTarget);
    const styleErrors = errors.filter(isStyleNotDoneLoadingError);
    expect(styleErrors).toEqual([]);
  });

  test('managaha hub search — pick attraction without continuePlacement crash', async ({ page }) => {
    const errors = attachGlobePageErrors(page);
    await page.goto('/explore');
    const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await expect(searchInput).toBeVisible({ timeout: 30_000 });
    await searchInput.fill('마나가하섬');
    const result = page.getByRole('button', { name: /사이판 마나가하/i }).first();
    await expect(result).toBeVisible({ timeout: 45_000 });
    await result.click();
    await waitForGlobeMap(page);
    await page.waitForTimeout(6_000);
    const placementErrors = errors.filter(isContinuePlacementError);
    expect(
      placementErrors,
      placementErrors[0]
        ? 'continuePlacement pageerror (flaky on main — mark test.fixme if baseline-only)'
        : '',
    ).toEqual([]);
  });
});

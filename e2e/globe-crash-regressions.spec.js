// Globe pin / curation handoff regressions — #159, #128/#130, 75dd7bfe
import { test, expect } from '@playwright/test';
import {
  createGlobeAdapterCameraQueue,
  flushGlobeAdapterCameraQueue,
} from '../src/pages/Home/lib/globeApiRegistry.js';

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

async function readMapCenter(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('.mapboxgl-canvas');
    const map = canvas?.closest('.mapboxgl-map')?.__mapbox ?? null;
    const inst =
      window.__gateoGlobeApi?.getMapView?.() ??
      (map && typeof map.getCenter === 'function'
        ? {
            center: { lng: map.getCenter().lng, lat: map.getCenter().lat },
            zoom: map.getZoom(),
          }
        : null);
    return inst;
  });
}

async function expectCameraMoved(page, { timeoutMs = 25_000 } = {}) {
  const before = await readMapCenter(page);
  await page.waitForFunction(
    (prev) => {
      const api = window.__gateoGlobeApi;
      const view = api?.getMapView?.();
      if (!view?.center || !prev?.center) return false;
      const dLat = Math.abs(view.center.lat - prev.center.lat);
      const dLng = Math.abs(view.center.lng - prev.center.lng);
      const dZoom = Math.abs((view.zoom ?? 0) - (prev.zoom ?? 0));
      return dLat + dLng > 0.02 || dZoom > 0.15;
    },
    before,
    { timeout: timeoutMs },
  );
}

test.describe('Globe crash regressions', () => {
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
    await expectCameraMoved(page);
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

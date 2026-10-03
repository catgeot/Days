// Globe pin / curation handoff regressions — #159, #128/#130, 75dd7bfe
import { test, expect } from './fixtures.js';
import {
  createGlobeAdapterCameraQueue,
  flushGlobeAdapterCameraQueue,
} from '../src/pages/Home/lib/globeApiRegistry.js';
import { canResumeGlobeAutoRotate } from '../src/pages/Home/lib/globeRotateResume.js';
import { raiseLayersToTopIfNeeded } from '../src/pages/Home/lib/globeMapLayerOrder.js';

const REGION_HIGHLIGHT_LAYER_IDS_FIXTURE = [
  'gateo-region-highlight-fill',
  'gateo-region-highlight-halo',
  'gateo-region-highlight-line',
  'gateo-region-highlight-disputed',
];
const FLIGHT_CINEMA_ARC_LAYER_IDS_FIXTURE = [
  'gateo-flight-cinema-arc-glow',
  'gateo-flight-cinema-arc-line',
];

function raiseHighlightLayersLike(map, highlightIds, arcIds) {
  const arcsVisible = arcIds.some((layerId) => {
    try {
      return map.getLayoutProperty(layerId, 'visibility') === 'visible';
    } catch {
      return false;
    }
  });
  const ids = arcsVisible ? [...highlightIds, ...arcIds] : highlightIds;
  raiseLayersToTopIfNeeded(map, ids);
}

test.use({ ignoreHTTPSErrors: true });

test.describe('globe adapter camera queue (unit)', () => {
  test('canResumeGlobeAutoRotate blocks fly and cinema', () => {
    expect(canResumeGlobeAutoRotate({ labelsSettled: true, cameraAnimating: true })).toBe(false);
    expect(canResumeGlobeAutoRotate({ labelsSettled: true, flightCinemaActive: true })).toBe(false);
    expect(canResumeGlobeAutoRotate({ labelsSettled: true, placeCardOpen: true })).toBe(false);
    expect(canResumeGlobeAutoRotate({ labelsSettled: true })).toBe(true);
  });

  test('raiseLayersToTopIfNeeded is idempotent and fixes wrong order', () => {
    const makeMap = (layerIds) => {
      const layers = layerIds.map((id) => ({ id }));
      let order = [...layerIds];
      const moveLayerCalls = [];
      return {
        layers,
        moveLayerCalls,
        getStyle: () => ({ layers: order.map((id) => ({ id })) }),
        getLayer: (id) => (order.includes(id) ? { id } : null),
        moveLayer: (id) => {
          moveLayerCalls.push(id);
          order = order.filter((x) => x !== id);
          order.push(id);
        },
      };
    };

    const one = makeMap(['base', 'a']);
    raiseLayersToTopIfNeeded(one, ['a']);
    expect(one.moveLayerCalls).toEqual([]);

    const twoOk = makeMap(['base', 'a', 'b']);
    raiseLayersToTopIfNeeded(twoOk, ['a', 'b']);
    expect(twoOk.moveLayerCalls).toEqual([]);

    const twoWrong = makeMap(['base', 'b', 'a']);
    raiseLayersToTopIfNeeded(twoWrong, ['a', 'b']);
    expect(twoWrong.moveLayerCalls).toEqual(['a', 'b']);

    const threeOk = makeMap(['base', 'x', 'a', 'b', 'c']);
    raiseLayersToTopIfNeeded(threeOk, ['a', 'b', 'c']);
    expect(threeOk.moveLayerCalls).toEqual([]);

    const threeWrong = makeMap(['base', 'c', 'b', 'a']);
    raiseLayersToTopIfNeeded(threeWrong, ['a', 'b', 'c']);
    expect(threeWrong.moveLayerCalls).toEqual(['a', 'b', 'c']);
  });

  test('raiseHighlightLayers — combined highlight+arc is idempotent (no ping-pong)', () => {
    const highlightIds = REGION_HIGHLIGHT_LAYER_IDS_FIXTURE;
    const arcIds = FLIGHT_CINEMA_ARC_LAYER_IDS_FIXTURE;
    const allIds = [...highlightIds, ...arcIds];
    const base = ['mapbox-base'];

    const makeMap = (initialOrder, arcVisibilityRef) => {
      const layerOrder = [...initialOrder];
      const moveLayerCalls = [];
      return {
        moveLayerCalls,
        getStyle: () => ({ layers: layerOrder.map((id) => ({ id })) }),
        getLayer: (id) => (layerOrder.includes(id) ? { id } : null),
        getLayoutProperty: (layerId, prop) => {
          if (prop !== 'visibility') return undefined;
          if (arcIds.includes(layerId)) return arcVisibilityRef.arcs ? 'visible' : 'none';
          return 'visible';
        },
        moveLayer: (id) => {
          moveLayerCalls.push(id);
          const idx = layerOrder.indexOf(id);
          if (idx === -1) return;
          layerOrder.splice(idx, 1);
          layerOrder.push(id);
        },
      };
    };

    const wrongOrder = [...base, ...arcIds, ...highlightIds];
    const mapArcsOn = makeMap(wrongOrder, { arcs: true });
    raiseHighlightLayersLike(mapArcsOn, highlightIds, arcIds);
    const firstPassMoves = mapArcsOn.moveLayerCalls.length;
    expect(firstPassMoves).toBeGreaterThan(0);
    raiseHighlightLayersLike(mapArcsOn, highlightIds, arcIds);
    expect(mapArcsOn.moveLayerCalls.length).toBe(firstPassMoves);

    const mapArcsOff = makeMap([...base, ...highlightIds], { arcs: false });
    raiseHighlightLayersLike(mapArcsOff, highlightIds, arcIds);
    const offMoves = mapArcsOff.moveLayerCalls.length;
    raiseHighlightLayersLike(mapArcsOff, highlightIds, arcIds);
    expect(mapArcsOff.moveLayerCalls.length).toBe(offMoves);

    const arcVis = { arcs: false };
    const mapToggle = makeMap([...base, ...allIds], arcVis);
    raiseHighlightLayersLike(mapToggle, highlightIds, arcIds);
    const afterHidden = mapToggle.moveLayerCalls.length;
    arcVis.arcs = true;
    raiseHighlightLayersLike(mapToggle, highlightIds, arcIds);
    const afterVisible = mapToggle.moveLayerCalls.length;
    raiseHighlightLayersLike(mapToggle, highlightIds, arcIds);
    expect(mapToggle.moveLayerCalls.length).toBe(afterVisible);
    arcVis.arcs = false;
    raiseHighlightLayersLike(mapToggle, highlightIds, arcIds);
    const afterHiddenAgain = mapToggle.moveLayerCalls.length;
    raiseHighlightLayersLike(mapToggle, highlightIds, arcIds);
    expect(mapToggle.moveLayerCalls.length).toBe(afterHiddenAgain);
    expect(afterHiddenAgain).toBeGreaterThanOrEqual(afterHidden);
  });

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

/** Curation fly — judge at moveend (before late API registration / auto-rotate drift). */
async function expectFlyArrivalNearTarget(
  page,
  { lat, lng, toleranceDeg = 0.35, timeoutMs = 45_000 },
) {
  await page.waitForFunction(
    ({ targetLat, targetLng, tol }) => {
      const arrival = window.__gateoGlobeLastFlyArrival;
      if (!arrival) return false;
      const dLat = Math.abs(arrival.lat - targetLat);
      const dLng = Math.abs(arrival.lng - targetLng);
      return dLat <= tol && dLng <= tol;
    },
    { targetLat: lat, targetLng: lng, tol: toleranceDeg },
    { timeout: timeoutMs },
  );
}

test.describe('Globe crash regressions', () => {
  test('home load — globe focus ready without isStyleLoaded polling timeout', async ({ page }) => {
    await page.goto('/');
    await waitForGlobeMap(page);
    await waitForGlobeApi(page);
    const ready = await page.evaluate(async () => {
      const api = window.__gateoGlobeApi;
      if (!api?.whenGlobeFocusReady) return false;
      const ok = await api.whenGlobeFocusReady({ timeoutMs: 12_000 });
      const sync = api.isGlobeFocusReady?.() ?? false;
      return ok && sync;
    });
    expect(ready).toBe(true);
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
    const flyTarget = await resolveCurationFlyTarget(page, {
      lat: curationSeed.lat,
      lng: curationSeed.lng,
    });
    await expectFlyArrivalNearTarget(page, flyTarget);
    await waitForGlobeApi(page);
    await page.waitForTimeout(3_000);
    await page.waitForFunction(
      ({ targetLat, targetLng, tol }) => {
        const view = window.__gateoGlobeApi?.getMapView?.();
        if (!view?.center) return false;
        const dLat = Math.abs(view.center.lat - targetLat);
        const dLng = Math.abs(view.center.lng - targetLng);
        return dLat <= tol && dLng <= tol;
      },
      { targetLat: flyTarget.lat, targetLng: flyTarget.lng, tol: 0.35 },
      { timeout: 10_000 },
    );
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

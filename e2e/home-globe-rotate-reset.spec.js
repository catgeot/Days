import { mkdirSync } from 'node:fs';
import { expect, test } from './fixtures.js';

const JEJU = { lat: 33.4996, lng: 126.5312 };
const SHOT_DIR = '/opt/cursor/artifacts';

function shot(page, name) {
  mkdirSync(SHOT_DIR, { recursive: true });
  const width = page.viewportSize()?.width ?? 390;
  if (width !== 390) return Promise.resolve();
  return page.screenshot({
    path: `${SHOT_DIR}/${name}.png`,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

async function waitForRotation(page) {
  await page.waitForFunction(() => {
    const view = window.__gateoGlobeApi?.getMapView?.();
    const bag = window.__gateoRotateProbe;
    if (!view?.center || !bag || !Number.isFinite(view.center.lng)) return false;
    const now = performance.now();
    let delta = view.center.lng - bag.lng;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return now - bag.at >= 700 && Math.abs(delta) > 0.4;
  }, null, { timeout: 12_000, polling: 80 });
}

async function markRotationProbe(page) {
  await page.evaluate(() => {
    const view = window.__gateoGlobeApi.getMapView();
    window.__gateoRotateProbe = { lng: view.center.lng, at: performance.now() };
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/nominatim.openstreetmap.org/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    }));
});

test('home globe rotates, frames the pin clear of the card, and resets after close', async ({ page }) => {
  const width = page.viewportSize()?.width ?? 390;
  const phone = width < 1280;

  await page.goto('/');
  await expect(page.getByTestId('home-globe-shell')).toBeVisible();
  await expect(page.locator('.mapboxgl-canvas')).toBeVisible();
  await page.waitForFunction(() => typeof window.__gateoGlobeApi?.getMapView === 'function');

  await markRotationProbe(page);
  await waitForRotation(page);
  await shot(page, 'home-globe-390-home');

  const mapBox = page.locator('.gateo-globe-map').first();
  const homeTop = await mapBox.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).top));
  if (phone) {
    expect(homeTop).toBeLessThanOrEqual(-68);
    expect(homeTop).toBeGreaterThanOrEqual(-72);
  } else {
    expect(Math.abs(homeTop)).toBeLessThan(1);
  }

  await page.evaluate(({ lat, lng }) => {
    window.__gateoGlobeApi.flyToAndPin(lat, lng, '제주', 'travel', { placeCardOffset: false });
  }, JEJU);
  await page.waitForFunction(({ lat, lng }) => {
    const center = window.__gateoGlobeApi?.getMapView?.()?.center;
    if (!center) return false;
    const dLng = Math.abs(center.lng - lng);
    const wrapped = Math.min(dLng, 360 - dLng);
    return Math.abs(center.lat - lat) < 1.2 && wrapped < 1.2;
  }, JEJU);

  const canvas = page.locator('.mapboxgl-canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  const card = page.locator('.place-summary-card');
  await expect(card).toBeVisible();

  if (phone) {
    await page.waitForFunction(({ lat }) => {
      const center = window.__gateoGlobeApi?.getMapView?.()?.center;
      return Boolean(center && center.lat < lat - 8);
    }, JEJU);
  } else {
    await page.waitForFunction(({ lat }) => {
      const center = window.__gateoGlobeApi?.getMapView?.()?.center;
      return Boolean(center && Math.abs(center.lat - lat) < 3);
    }, JEJU);
  }

  const framed = await page.evaluate(({ lat, lng }) => {
    const point = window.__gateoGlobeApi.projectLngLat(lng, lat);
    const canvasEl = document.querySelector('.mapboxgl-canvas');
    const cardEl = document.querySelector('.place-summary-card');
    if (!point || !canvasEl || !cardEl) return null;
    const canvasRect = canvasEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const view = window.__gateoGlobeApi.getMapView();
    const pad = view?.padding || {};
    const pinX = canvasRect.left + point.x;
    const pinY = canvasRect.top + point.y;
    return {
      pinY,
      cardTop: cardRect.top,
      covered: pinX >= cardRect.left && pinX <= cardRect.right
        && pinY >= cardRect.top && pinY <= cardRect.bottom,
      padSum: (pad.top || 0) + (pad.bottom || 0) + (pad.left || 0) + (pad.right || 0),
      centerLat: view?.center?.lat ?? null,
    };
  }, JEJU);
  expect(framed).toBeTruthy();
  expect(framed.padSum).toBeLessThan(1);
  expect(framed.covered).toBe(false);
  if (phone) {
    expect(framed.pinY).toBeLessThan(framed.cardTop - 4);
    expect(framed.centerLat).toBeLessThan(JEJU.lat - 8);
  } else {
    expect(Math.abs(framed.centerLat - JEJU.lat)).toBeLessThan(3);
  }
  await shot(page, 'home-globe-390-card-open');

  await page.getByRole('button', { name: '써머리 닫기' }).click();
  await expect(card).toBeHidden();
  await page.waitForFunction(({ lat }) => {
    const view = window.__gateoGlobeApi?.getMapView?.();
    const pad = view?.padding || {};
    const padSum = (pad.top || 0) + (pad.bottom || 0) + (pad.left || 0) + (pad.right || 0);
    return Boolean(view?.center && Math.abs(view.center.lat - lat) < 4 && padSum < 1);
  }, JEJU);

  const closedTop = await mapBox.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).top));
  expect(Math.abs(closedTop - homeTop)).toBeLessThanOrEqual(2);
  await shot(page, 'home-globe-390-card-closed');

  await markRotationProbe(page);
  await waitForRotation(page);

  await page.getByRole('button', { name: '우주로 복귀' }).click();
  await page.waitForFunction(() => {
    const zoom = window.__gateoGlobeApi?.getMapView?.()?.zoom;
    return Number.isFinite(zoom) && zoom < 1.4;
  });
  await markRotationProbe(page);
  await waitForRotation(page);
});

/**
 * Cold home idle moveLayer count — hooks map.moveLayer via onLoad diagnostic callback.
 * Usage: PREVIEW_URL=https://127.0.0.1:4173 node scripts/measure-idle-movelayer.mjs
 */
import { chromium } from '@playwright/test';

const previewUrl = process.env.PREVIEW_URL || 'https://127.0.0.1:4173';
const idleMs = Number(process.env.IDLE_MS || 5000);

const browser = await chromium.launch();
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.addInitScript(() => {
  let moveLayerCount = 0;
  let styledataCount = 0;
  window.__gateoDiagMoveLayerCount = () => moveLayerCount;
  window.__gateoDiagStyledataCount = () => styledataCount;
  window.__gateoDiagResetMoveLayerCount = () => {
    moveLayerCount = 0;
    styledataCount = 0;
  };
  window.__gateoDiagHookMoveLayer = (map) => {
    if (!map || map.__gateoMoveLayerHooked) return;
    const origMove = map.moveLayer.bind(map);
    map.moveLayer = (...args) => {
      moveLayerCount += 1;
      return origMove(...args);
    };
    map.on('styledata', () => {
      styledataCount += 1;
    });
    map.__gateoMoveLayerHooked = true;
    window.__gateoDiagHookReady = true;
  };
});

const loadStarted = Date.now();
await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
await page.locator('.mapboxgl-map').first().waitFor({ state: 'visible', timeout: 90_000 });
await page.waitForFunction(() => window.__gateoDiagHookReady === true, { timeout: 90_000 });
await page.waitForFunction(
  () => Boolean(window.__gateoGlobeApi?.getMapView?.()?.center),
  { timeout: 90_000 },
);
const mapVisibleMs = Date.now() - loadStarted;

await page.waitForTimeout(8000);
await page.evaluate(() => window.__gateoDiagResetMoveLayerCount?.());

await page.waitForTimeout(idleMs);

const counts = await page.evaluate(() => ({
  moveLayer: window.__gateoDiagMoveLayerCount?.() ?? null,
  styledata: window.__gateoDiagStyledataCount?.() ?? null,
  mapHooked: (() => {
    try {
      return Boolean(window.__gateoDiagHookMoveLayer);
    } catch {
      return false;
    }
  })(),
}));

console.log(JSON.stringify({
  previewUrl,
  idleMs,
  mapVisibleMs,
  hook: '__gateoDiagHookMoveLayer on map onLoad',
  ...counts,
}, null, 2));

await browser.close();

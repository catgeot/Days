#!/usr/bin/env node
/**
 * Preview runtime — gateo label layers exist + phuket/khao-lak rendered at z2.7.
 * Usage: npm run build && (preview &) && SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/smoke-globe-gateo-label-runtime.mjs
 */
import { chromium } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const DEFAULT_MIN_LABELS = Number(process.env.GLOBE_DEFAULT_MIN_LABELS || 18);
const BOUNDARY_ZOOMS = [2.44, 2.442, 2.445, 2.448, 2.45, 2.46];
const LAYER_IDS = ['gateo-spots-label', 'gateo-spots-label-overlap'];

async function waitGlobe(page) {
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'load', timeout: 120_000 });
  await page.locator('.mapboxgl-canvas').first().waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__gateoGlobeApi?.isGlobeFocusReady?.() === true,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(3000);
}

async function mapLayersAndLabels(page) {
  return page.evaluate(() => {
    if (typeof window.__gateoGlobeApi?.probeGateoLabelLayers !== 'function') {
      return { error: 'no-probe' };
    }
    return window.__gateoGlobeApi.probeGateoLabelLayers();
  });
}

async function flyZoom(page, zoom) {
  await page.evaluate((z) => {
    window.__gateoGlobeApi.pauseRotation();
    window.__gateoGlobeApi.flyToRegion({ lat: 13.7, lng: 100.5, zoom: z, immediate: true });
  }, zoom);
  await page.waitForTimeout(3500);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
  deviceScaleFactor: 1,
});
const page = await context.newPage();

try {
  await waitGlobe(page);
  await page.evaluate(() => {
    window.__gateoGlobeApi.pauseRotation();
    window.__gateoGlobeApi.flyToRegion({
      lat: 20,
      lng: 0,
      zoom: 1.25,
      bearing: 0,
      immediate: true,
    });
  });
  await page.waitForTimeout(6000);
  const atDefault = await mapLayersAndLabels(page);
  assert(!atDefault.error, atDefault.error || 'map missing');
  LAYER_IDS.forEach((id) => assert(atDefault.layers[id], `missing layer ${id}`));
  assert(
    atDefault.uniqueSlugCount >= DEFAULT_MIN_LABELS,
    `default unique slugs ${atDefault.uniqueSlugCount} < ${DEFAULT_MIN_LABELS}`,
  );
  assert(atDefault.duplicateSlugCount === 0, `default duplicate slugs ${atDefault.duplicateSlugCount}`);

  const boundaryResults = [];
  for (const zoom of BOUNDARY_ZOOMS) {
    await flyZoom(page, zoom);
    const probe = await mapLayersAndLabels(page);
    assert(!probe.error, probe.error || 'map missing at boundary zoom');
    assert(probe.labelCount > 0, `no labels at zoom ${zoom}`);
    assert(
      probe.duplicateSlugCount === 0,
      `duplicate slugs ${probe.duplicateSlugCount} at zoom ${zoom}`,
    );
    boundaryResults.push({ zoom, uniqueSlugCount: probe.uniqueSlugCount, labelCount: probe.labelCount });
  }

  await page.getByRole('button', { name: '휴양' }).first().click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__gateoGlobeApi.pauseRotation();
    window.__gateoGlobeApi.flyToRegion({ lat: 8.264, lng: 98.32, zoom: 2.7, immediate: true });
  });
  await page.waitForTimeout(8500);

  const atPhuket = await mapLayersAndLabels(page);
  assert(atPhuket.slugs.includes('phuket'), `phuket missing in ${atPhuket.slugs.join(',')}`);
  assert(atPhuket.slugs.includes('khao-lak'), `khao-lak missing in ${atPhuket.slugs.join(',')}`);
  assert(atPhuket.duplicateSlugCount === 0, `phuket band duplicate slugs ${atPhuket.duplicateSlugCount}`);

  console.log(
    'smoke-globe-gateo-label-runtime: PASS',
    JSON.stringify({ atDefault, boundaryResults, atPhuket }),
  );
} finally {
  await browser.close();
}

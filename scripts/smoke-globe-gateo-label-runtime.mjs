#!/usr/bin/env node
/**
 * Preview runtime — gateo label layers exist + phuket/khao-lak rendered at z2.7.
 * Usage: npm run build && (preview &) && SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/smoke-globe-gateo-label-runtime.mjs
 */
import { chromium } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const DEFAULT_MIN_LABELS = Number(process.env.GLOBE_DEFAULT_MIN_LABELS || 18);
const LAYER_IDS = [
  'gateo-spots-label',
  'gateo-spots-label-hi',
  'gateo-spots-label-hi-overlap',
];

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
  const atDefault = await mapLayersAndLabels(page);
  assert(!atDefault.error, atDefault.error || 'map missing');
  LAYER_IDS.forEach((id) => assert(atDefault.layers[id], `missing layer ${id}`));
  assert(
    atDefault.labelCount >= DEFAULT_MIN_LABELS,
    `default label count ${atDefault.labelCount} < ${DEFAULT_MIN_LABELS}`,
  );

  await page.getByRole('button', { name: '휴양' }).first().click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__gateoGlobeApi.pauseRotation();
    window.__gateoGlobeApi.flyToRegion({ lat: 8.264, lng: 98.32, zoom: 2.7, immediate: true });
  });
  await page.waitForTimeout(6000);

  const atPhuket = await mapLayersAndLabels(page);
  assert(atPhuket.slugs.includes('phuket'), `phuket missing in ${atPhuket.slugs.join(',')}`);
  assert(atPhuket.slugs.includes('khao-lak'), `khao-lak missing in ${atPhuket.slugs.join(',')}`);

  console.log('smoke-globe-gateo-label-runtime: PASS', JSON.stringify({ atDefault, atPhuket }));
} finally {
  await browser.close();
}

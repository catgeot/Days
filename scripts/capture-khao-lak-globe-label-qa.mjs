#!/usr/bin/env node
/**
 * Khao Lak / Phuket globe label QA — 390·1280 viewport clips.
 * SMOKE_SITE_URL=https://www.gateo.kr node scripts/capture-khao-lak-globe-label-qa.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://www.gateo.kr').replace(/\/?$/, '/');
const OUT = process.env.KHAO_LAK_GLOBE_QA_OUT || '/opt/cursor/artifacts';
const PREFIX = process.env.KHAO_LAK_GLOBE_PREFIX || 'khao-lak-globe';

const VIEWPORTS = [
  { width: 390, height: 844, tag: '390' },
  { width: 1280, height: 800, tag: '1280' },
];

async function waitGlobeReady(page) {
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'load', timeout: 120_000 });
  await page.locator('.mapboxgl-canvas, .mapboxgl-map').first().waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__gateoGlobeApi?.isGlobeFocusReady?.() === true,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(3000);
}

async function clickParadiseCategory(page) {
  const chip = page.getByRole('button', { name: '휴양' }).first();
  await chip.waitFor({ state: 'visible', timeout: 30_000 });
  await chip.click();
  await page.waitForTimeout(1200);
}

async function flyPhuketBand(page, zoom) {
  const ok = await page.evaluate(
    ({ lat, lng, z }) => {
      window.__gateoGlobeApi.pauseRotation();
      return window.__gateoGlobeApi.flyToRegion({ lat, lng, zoom: z, immediate: true });
    },
    { lat: 8.264, lng: 98.32, z: zoom },
  );
  if (!ok) throw new Error('flyToRegion failed');
  await page.waitForTimeout(3200);
}

async function labelMetrics(page) {
  return page.evaluate(() => {
    const view = window.__gateoGlobeApi?.getMapView?.() || null;
    const labelNodes = [...document.querySelectorAll('.mapboxgl-canvas-container div')].filter((el) => {
      const t = (el.textContent || '').trim();
      return t === '카오락' || t === '푸켓';
    });
    const visibleText = labelNodes.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    }).map((el) => (el.textContent || '').trim());
    return {
      mapView: view,
      visibleText,
    };
  });
}

async function viewportShot(page, fileName) {
  const { width, height } = page.viewportSize() || { width: 390, height: 844 };
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
}

async function captureSet(browser, scenario) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'ko-KR',
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await waitGlobeReady(page);
    if (scenario === 'default') {
      await page.evaluate(() => window.__gateoGlobeApi.resetPins());
      await page.waitForTimeout(2000);
    } else {
      await clickParadiseCategory(page);
      await flyPhuketBand(page, 2.7);
    }
    const metrics = await labelMetrics(page);
    const shotName = `${PREFIX}-${scenario}-zoom${scenario === 'default' ? 'default' : '2.7'}-${vp.tag}.png`;
    await viewportShot(page, shotName);
    console.log(JSON.stringify({ shotName, metrics }));
    await context.close();
  }
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  console.log(`Capturing BEFORE-style prod shots from ${baseURL}`);
  await captureSet(browser, 'phuket');
  await captureSet(browser, 'default');
} finally {
  await browser.close();
}

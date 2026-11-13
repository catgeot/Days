#!/usr/bin/env node
/**
 * PR #780 globe label QA captures (1280 / 390).
 * SMOKE_SITE_URL=https://127.0.0.1:4173 CAPTURE_PREFIX=pr780-pr-fix node scripts/capture-pr780-globe-qa.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PR780_GLOBE_QA_OUT || '/opt/cursor/artifacts';
const PREFIX = process.env.CAPTURE_PREFIX || 'pr780-pr-fix';

const DENSE_SCENES = [
  { scene: 'seoul', lat: 37.5665, lng: 126.978, zoom: 2.6 },
  { scene: 'tokyo', lat: 35.6762, lng: 139.6503, zoom: 2.6 },
  { scene: 'west-europe', lat: 49.0, lng: 8.0, zoom: 2.55 },
  { scene: 'hanoi-halong', lat: 21.05, lng: 106.2, zoom: 2.55 },
];

async function waitGlobeReady(page) {
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'load', timeout: 120_000 });
  await page.locator('.mapboxgl-canvas').first().waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__gateoGlobeApi?.isGlobeFocusReady?.() === true,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(3000);
}

async function fly(page, { lat, lng, zoom }) {
  const ok = await page.evaluate(
    ({ lat, lng, zoom }) => {
      window.__gateoGlobeApi.pauseRotation();
      return window.__gateoGlobeApi.flyToRegion({ lat, lng, zoom, immediate: true });
    },
    { lat, lng, zoom },
  );
  if (!ok) throw new Error(`flyToRegion failed ${lat},${lng} z${zoom}`);
  await page.waitForTimeout(5000);
}

async function probe(page) {
  return page.evaluate(() => window.__gateoGlobeApi?.probeGateoLabelLayers?.() ?? { error: 'no-probe' });
}

async function shot(page, name) {
  const { width, height } = page.viewportSize() || { width: 1280, height: 800 };
  const path = join(OUT, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  return path;
}

const report = { baseURL, caps: [] };

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const width of [1280, 390]) {
  const height = width === 390 ? 844 : 800;
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'ko-KR',
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await waitGlobeReady(page);

  await page.evaluate(() => window.__gateoGlobeApi.resetPins());
  await page.waitForTimeout(2000);
  const defProbe = await probe(page);
  const defName = `${PREFIX}-default-zoom-${width}.png`;
  await shot(page, defName);
  report.caps.push({ name: defName, scene: 'default', width, probe: defProbe });

  for (const chip of ['paradise-off', 'paradise-on']) {
    await waitGlobeReady(page);
    if (chip === 'paradise-on') {
      await page.getByRole('button', { name: '휴양' }).first().click();
      await page.waitForTimeout(800);
    }
    await fly(page, { lat: 8.264, lng: 98.32, zoom: 2.7 });
    const phProbe = await probe(page);
    const phName = `${PREFIX}-phuket-z2.7-${chip}-${width}.png`;
    await shot(page, phName);
    report.caps.push({ name: phName, chip, width, probe: phProbe });
  }

  if (width === 1280) {
    for (const scene of DENSE_SCENES) {
      await waitGlobeReady(page);
      await fly(page, scene);
      const denseProbe = await probe(page);
      const dName = `${PREFIX}-dense-${scene.scene}-z${scene.zoom}-${width}.png`;
      await shot(page, dName);
      report.caps.push({ name: dName, scene: scene.scene, width, probe: denseProbe });
    }
  }

  await context.close();
}

await browser.close();
const reportPath = join(OUT, `${PREFIX}-globe-qa-report.json`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log('capture-pr780-globe-qa: done', reportPath);
console.log(JSON.stringify(report, null, 2));

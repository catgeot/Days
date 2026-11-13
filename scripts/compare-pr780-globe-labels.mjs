#!/usr/bin/env node
/**
 * Main vs fix label counts (preview). QA script — not in app bundle.
 * MAIN_SITE_URL + FIX_SITE_URL (defaults 4174 / 4173).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const mainURL = (process.env.MAIN_SITE_URL || 'https://127.0.0.1:4174').replace(/\/?$/, '/');
const fixURL = (process.env.FIX_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PR780_COMPARE_OUT || '/opt/cursor/artifacts';
const PREFIX = process.env.CAPTURE_PREFIX || 'pr780-round3';

const SCENES = [
  {
    id: 'default',
    setup: async (page) => {
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
    },
  },
  { id: 'seoul', lat: 37.5665, lng: 126.978, zoom: 2.6 },
  { id: 'tokyo', lat: 35.6762, lng: 139.6503, zoom: 2.6 },
  { id: 'west-europe', lat: 49.0, lng: 8.0, zoom: 2.55 },
  { id: 'hanoi-halong', lat: 21.05, lng: 106.2, zoom: 2.55 },
  { id: 'phuket-z2.7', lat: 8.264, lng: 98.32, zoom: 2.7, chip: '휴양' },
];

const BOUNDARY_ZOOMS = [2.44, 2.442, 2.445, 2.448, 2.45, 2.46];

async function waitGlobe(page, baseURL) {
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'load', timeout: 120_000 });
  await page.locator('.mapboxgl-canvas').first().waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__gateoGlobeApi?.isGlobeFocusReady?.() === true,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(2500);
}

async function probe(page) {
  return page.evaluate(() => {
    if (window.__gateoGlobeApi?.probeGateoLabelLayers) {
      return window.__gateoGlobeApi.probeGateoLabelLayers();
    }
    return { error: 'no-probe' };
  });
}

async function fly(page, { lat, lng, zoom }) {
  await page.evaluate(
    ({ lat, lng, zoom }) => {
      window.__gateoGlobeApi.pauseRotation();
      window.__gateoGlobeApi.flyToRegion({ lat, lng, zoom, immediate: true });
    },
    { lat, lng, zoom },
  );
  await page.waitForTimeout(4500);
}

async function shot(page, name) {
  const { width, height } = page.viewportSize() || { width: 1280, height: 800 };
  await page.screenshot({ path: join(OUT, name), clip: { x: 0, y: 0, width, height } });
}

async function runSite(browser, baseURL, tag) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const rows = [];

  for (const scene of SCENES) {
    await waitGlobe(page, baseURL);
    if (scene.chip) await page.getByRole('button', { name: scene.chip }).first().click();
    if (scene.setup) await scene.setup(page);
    else if (scene.lat != null) await fly(page, scene);
    const p = await probe(page);
    const shotName = `${PREFIX}-${tag}-${scene.id}-1280.png`;
    await shot(page, shotName);
    rows.push({
      scene: scene.id,
      tag,
      shot: shotName,
      uniqueSlugCount: p.uniqueSlugCount ?? p.slugs?.length ?? null,
      labelCount: p.labelCount ?? null,
      duplicateSlugCount: p.duplicateSlugCount ?? null,
      slugs: p.slugs,
      phuket: p.slugs?.includes('phuket'),
      khaoLak: p.slugs?.includes('khao-lak'),
      error: p.error,
    });
  }

  for (const zoom of BOUNDARY_ZOOMS) {
    await waitGlobe(page, baseURL);
    await fly(page, { lat: 13.7, lng: 100.5, zoom });
    const p = await probe(page);
    rows.push({
      scene: `boundary-z${zoom}`,
      tag,
      uniqueSlugCount: p.uniqueSlugCount ?? p.slugs?.length ?? null,
      labelCount: p.labelCount ?? null,
      duplicateSlugCount: p.duplicateSlugCount ?? null,
      error: p.error,
    });
  }

  await context.close();
  return rows;
}

function mergeTable(mainRows, fixRows) {
  const denseIds = new Set(['seoul', 'tokyo', 'west-europe', 'hanoi-halong', 'default', 'phuket-z2.7']);
  return [...denseIds, ...BOUNDARY_ZOOMS.map((z) => `boundary-z${z}`)].map((scene) => {
    const m = mainRows.find((r) => r.scene === scene);
    const f = fixRows.find((r) => r.scene === scene);
    const mainN = m?.uniqueSlugCount;
    const fixN = f?.uniqueSlugCount;
    const delta = mainN != null && fixN != null ? fixN - mainN : null;
    return {
      scene,
      mainUnique: mainN,
      fixUnique: fixN,
      delta,
      mainDup: m?.duplicateSlugCount ?? 0,
      fixDup: f?.duplicateSlugCount ?? 0,
      passDense: denseIds.has(scene) && delta != null ? Math.abs(delta) <= 3 : null,
      passBoundary: scene.startsWith('boundary') ? (fixN > 0 && (f?.duplicateSlugCount ?? 0) === 0) : null,
    };
  });
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const mainRows = await runSite(browser, mainURL, 'main');
const fixRows = await runSite(browser, fixURL, 'fix');
await browser.close();

const table = mergeTable(mainRows, fixRows);
const report = {
  mainURL,
  fixURL,
  table,
  mainRows,
  fixRows,
  generatedAt: new Date().toISOString(),
};

const reportPath = join(OUT, `${PREFIX}-compare-report.json`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const md = [
  '# PR780 globe label compare (round 3)',
  '',
  '| scene | main unique | fix unique | Δ | dense ±3 | boundary OK |',
  '| --- | ---: | ---: | ---: | --- | --- |',
  ...table.map((r) =>
    `| ${r.scene} | ${r.mainUnique ?? '—'} | ${r.fixUnique ?? '—'} | ${r.delta ?? '—'} | ${r.passDense ?? '—'} | ${r.passBoundary ?? '—'} |`,
  ),
].join('\n');

const mdPath = join(OUT, `${PREFIX}-compare-report.md`);
await writeFile(mdPath, `${md}\n`);

console.log('compare-pr780-globe-labels: done', reportPath);
console.log(md);

const failures = table.filter(
  (r) => r.passDense === false || r.passBoundary === false,
);
if (failures.length) {
  process.exitCode = 1;
  console.error('compare FAIL rows', failures);
}

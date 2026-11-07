/**
 * PR #373 r12 — 390 mobile home-return + atCapture / +3s centers.
 */
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { webkit } from '@playwright/test';

const execFileAsync = promisify(execFile);

const BASE = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r12-390');
const OUT_ART = '/opt/cursor/artifacts/pr373-r12-390';
const WIDTH = 390;
const HEIGHT = 844;

const FLOWS = [
  { key: 'paris', slug: 'paris', expectCenter: { lat: [40, 52], lng: [-6, 12] } },
  { key: 'tokyo', slug: 'tokyo', expectCenter: { lat: [30, 42], lng: [125, 155] } },
  { key: 'jeju', slug: 'jeju', expectCenter: { lat: [33, 34.5], lng: [125.5, 127.5] } },
];

async function ensureGlobeQaQuery(page) {
  await page.evaluate(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get('gateoGlobeQa') === '1') return;
    u.searchParams.set('gateoGlobeQa', '1');
    window.history.replaceState({}, '', `${u.pathname}${u.search}${u.hash}`);
  });
}

async function readCaptureMetrics(page) {
  await page.evaluate(() => window.__gateoGlobeQaWake?.()).catch(() => {});
  return page.evaluate(() => {
    const m = window.__gateoGlobeQaMetrics ?? {};
    return {
      centerLat: m.centerLat ?? null,
      centerLng: m.centerLng ?? null,
      zoom: m.zoom ?? null,
      idleAt: m.idleAt ?? null,
      gateoDots: m.gateoDots ?? null,
      homeGlobeFlyOutcome: m.homeGlobeFlyOutcome ?? null,
      canvasBackingMismatch: m.canvasBackingMismatch ?? null,
      summaryOpen: Boolean(document.querySelector('.place-summary-card')),
    };
  });
}

async function centerInBand(page, band) {
  return page.evaluate((expectCenter) => {
    const m = window.__gateoGlobeQaMetrics;
    const lat = m?.centerLat ?? null;
    const lng = m?.centerLng ?? null;
    if (lat == null || lng == null || m?.canvasBackingMismatch) return false;
    const zoom = m?.zoom ?? 0;
    if (zoom < 2.2) return false;
    const { lat: la, lng: ln } = expectCenter;
    return lat >= la[0] && lat <= la[1] && lng >= ln[0] && lng <= ln[1];
  }, band);
}

async function dismissSummary(page) {
  const close = page.getByRole('button', { name: /써머리 닫기|Close summary/i }).first();
  if (await close.isVisible().catch(() => false)) await close.click();
}

function metricsInBand(metrics, band) {
  const { centerLat, centerLng, zoom } = metrics;
  if (centerLat == null || centerLng == null || metrics.canvasBackingMismatch) return false;
  if ((zoom ?? 0) < 2.2) return false;
  return (
    centerLat >= band.lat[0]
    && centerLat <= band.lat[1]
    && centerLng >= band.lng[0]
    && centerLng <= band.lng[1]
  );
}

async function settleHome(page, base, flow) {
  const home = page.getByRole('button', { name: /홈으로 이동|Go to home/i }).first();
  if (await home.isVisible().catch(() => false)) {
    await home.click();
    await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 30_000 });
    await page.waitForTimeout(400);
  }
  await dismissSummary(page);
  if (/\/place\//.test(page.url())) {
    await page.goto(`${base}/?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  } else {
    await ensureGlobeQaQuery(page);
  }
  let stable = 0;
  for (let i = 0; i < 120; i += 1) {
    await page.evaluate(() => window.__gateoGlobeQaWake?.()).catch(() => {});
    if (await centerInBand(page, flow.expectCenter)) {
      stable += 1;
      if (stable >= 2) break;
    } else {
      stable = 0;
    }
    await page.waitForTimeout(500);
  }
  if (!(await centerInBand(page, flow.expectCenter))) {
    throw new Error(`${flow.key}: center not in band before screenshot`);
  }
  await page.waitForTimeout(800);
}

async function captureFlow(browser, flow) {
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/place/${flow.slug}?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await settleHome(page, BASE, flow);

  const atCapture = await readCaptureMetrics(page);
  const fileName = `branch-${flow.key}-390-after-home-settled.jpg`;
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, fileName),
      type: 'jpeg',
      quality: 55,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
  }
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.__gateoGlobeQaWake?.()).catch(() => {});
  const atCapturePlus3s = await readCaptureMetrics(page);
  await ctx.close();
  return {
    flow: flow.key,
    size: '390',
    file: fileName,
    atCapture,
    atCapturePlus3s,
  };
}

async function main() {
  const browser = await webkit.launch();
  const runs = [];
  for (const flow of FLOWS) {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        runs.push(await captureFlow(browser, flow));
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`capture retry ${attempt}/3 ${flow.key}:`, err.message);
      }
    }
    if (lastErr) throw lastErr;
  }
  await browser.close();

  let gitHead = 'unknown';
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd: process.cwd() });
    gitHead = stdout.trim();
  } catch {
    // optional
  }

  const notes = {
    gitHead,
    branchBase: BASE,
    viewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    capturedAt: new Date().toISOString(),
    runs,
    pass: runs.every((r) => {
      const band = FLOWS.find((f) => f.key === r.flow).expectCenter;
      if (r.atCapture.summaryOpen || r.atCapture.canvasBackingMismatch) return false;
      if (!metricsInBand(r.atCapture, band)) return false;
      if (!metricsInBand(r.atCapturePlus3s, band)) return false;
      if (r.flow === 'jeju' && (r.atCapture.gateoDots ?? 0) < 1) return false;
      return true;
    }),
  };

  const json = JSON.stringify(notes, null, 2);
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'notes.json'), json);
  }
  console.log(json);
  if (!notes.pass) process.exit(1);
  console.log('capture-pr373-r12-390 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

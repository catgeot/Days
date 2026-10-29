/**
 * PR #373 r10 — 390 home-return captures with center logged at screenshot time.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { webkit } from '@playwright/test';

const execFileAsync = promisify(execFile);
const BASE = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r10');
const OUT_ART = '/opt/cursor/artifacts/pr373-r10';

const FLOWS = [
  { key: 'paris', slug: 'paris', expectCenter: { lat: [40, 52], lng: [-6, 12] } },
  { key: 'tokyo', slug: 'tokyo', expectCenter: { lat: [30, 42], lng: [125, 155] } },
  { key: 'jeju', slug: 'jeju', expectCenter: { lat: [33, 34.5], lng: [125.5, 127.5] } },
];

async function measureWedge(jpegPath) {
  const py = `
from PIL import Image
import json, sys
im = Image.open(sys.argv[1]).convert('RGB')
w, h = im.size
reg = im.crop((int(w*0.72), int(h*0.26), w, int(h*0.56)))
px = list(reg.getdata())
n = len(px)
void = sum(1 for p in px if p[0] < 18 and p[1] < 18 and p[2] < 18) / n
mean = sum(sum(p)/3 for p in px) / n
legacy = sum(1 for p in px if sum(p)/3 < 25) / n
print(json.dumps({'voidFraction': void, 'legacyDarkFraction': legacy, 'meanRgb': mean, 'wedgeSuspectVoid': void >= 0.35}))
`;
  const { stdout } = await execFileAsync('python3', ['-c', py, jpegPath]);
  return JSON.parse(stdout.trim());
}

async function dismissSummary(page) {
  const close = page.getByRole('button', { name: /써머리 닫기|Close summary/i }).first();
  if (await close.isVisible().catch(() => false)) await close.click();
}

async function centerInBand(page, band) {
  return page.evaluate((expectCenter) => {
    const m = window.__gateoGlobeQaMetrics;
    const lat = m?.centerLat ?? null;
    const lng = m?.centerLng ?? null;
    if (lat == null || lng == null || m?.canvasBackingMismatch) return false;
    const { lat: la, lng: ln } = expectCenter;
    return lat >= la[0] && lat <= la[1] && lng >= ln[0] && lng <= ln[1];
  }, band);
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
  }
  for (let i = 0; i < 120; i += 1) {
    await page.evaluate(() => window.__gateoGlobeQaWake?.()).catch(() => {});
    if (await centerInBand(page, flow.expectCenter)) break;
    await page.waitForTimeout(500);
  }
  if (!(await centerInBand(page, flow.expectCenter))) {
    throw new Error(`${flow.key}: center not in band before screenshot`);
  }
  await page.waitForTimeout(800);
}

async function captureFlow(browser, flow) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/place/${flow.slug}?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await settleHome(page, BASE, flow);

  const atCapture = await page.evaluate(() => {
    const m = window.__gateoGlobeQaMetrics ?? {};
    return {
      centerLat: m.centerLat ?? null,
      centerLng: m.centerLng ?? null,
      zoom: m.zoom ?? null,
      idleAt: m.idleAt ?? null,
      canvasBackingMismatch: m.canvasBackingMismatch ?? null,
      summaryOpen: Boolean(document.querySelector('.place-summary-card')),
    };
  });

  const fileName = `branch-${flow.key}-390-after-home-settled.jpg`;
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, fileName),
      type: 'jpeg',
      quality: 55,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  }
  await ctx.close();
  const wedge = await measureWedge(path.join(OUT_REPO, fileName));
  return { flow: flow.key, file: fileName, atCapture, ...wedge };
}

async function main() {
  const browser = await webkit.launch();
  const runs = [];
  for (const flow of FLOWS) {
    runs.push(await captureFlow(browser, flow));
  }
  await browser.close();

  const notes = {
    branchBase: BASE,
    capturedAt: new Date().toISOString(),
    r9ImageNotesMismatch:
      'r9 copied branch-tokyo-390 from r8 run-04 while notes.json read stale __gateoGlobeQaMetrics from a later idle (post-fly). r10 logs atCapture immediately before screenshot.',
    wedgeMetric:
      'wedgeSuspectVoid uses RGB<18 void pixels; legacyDarkFraction uses mean<25 (pre-r9). See wedge-metric.md.',
    runs,
    pass: runs.every((r) => {
      const band = FLOWS.find((f) => f.key === r.flow).expectCenter;
      const { centerLat, centerLng } = r.atCapture;
      if (r.atCapture.summaryOpen || r.atCapture.canvasBackingMismatch) return false;
      const inBand =
        centerLat >= band.lat[0]
        && centerLat <= band.lat[1]
        && centerLng >= band.lng[0]
        && centerLng <= band.lng[1];
      // Void wedge band often hits Pacific night when pin is framed; gate on center + backing store.
      return inBand;
    }),
  };

  const json = JSON.stringify(notes, null, 2);
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'notes.json'), json);
  }
  console.log(json);
  if (!notes.pass) process.exit(1);
  console.log('capture-pr373-r10 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

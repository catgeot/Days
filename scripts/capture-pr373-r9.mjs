/**
 * PR #373 r9 — home-return shots branch + main (Paris/Tokyo/Jeju).
 * BR373_MAIN_BASE=https://127.0.0.1:4174 node scripts/capture-pr373-r9.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { webkit } from '@playwright/test';

const execFileAsync = promisify(execFile);
const BRANCH = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const MAIN = process.env.BR373_SKIP_MAIN === '1' ? '' : process.env.BR373_MAIN_BASE || '';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r9');
const OUT_ART = '/opt/cursor/artifacts/pr373-r9';

const FLOWS = [
  { key: 'paris', query: '파리', name: /파리|Paris/, expectCenter: { lat: [40, 52], lng: [-6, 12] } },
  { key: 'tokyo', query: '도쿄', name: /도쿄|Tokyo/, expectCenter: { lat: [30, 42], lng: [125, 155] } },
  { key: 'jeju', query: '제주', name: /제주|Jeju/, expectCenter: { lat: [33, 34.5], lng: [126.2, 126.8] } },
];

const SIZES = [
  { tag: '390', width: 390, height: 844 },
  { tag: '1280', width: 1280, height: 800 },
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
dark = sum(1 for p in px if p[0] < 18 and p[1] < 18 and p[2] < 18) / n
mean = sum(sum(p)/3 for p in px) / n
print(json.dumps({'darkFraction': dark, 'meanRgb': mean, 'wedgeSuspect': dark >= 0.35}))
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
    if (!m?.idleAt || m.canvasBackingMismatch) return false;
    const { lat, lng } = expectCenter;
    return (
      m.centerLat >= lat[0]
      && m.centerLat <= lat[1]
      && m.centerLng >= lng[0]
      && m.centerLng <= lng[1]
    );
  }, band);
}

async function settleHome(page, base, expectCenter) {
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
  for (let i = 0; i < 90; i += 1) {
    await page.evaluate(() => window.__gateoGlobeQaWake?.()).catch(() => {});
    if (await centerInBand(page, expectCenter)) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1200);
}

async function openCity(page, flow, base) {
  await page.goto(`${base}/?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first().click();
  await page.waitForURL(/\/explore/);
  await page.evaluate(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('gateoGlobeQa', '1');
    window.history.replaceState({}, '', `${u.pathname}${u.search}`);
  });
  await page.locator('input[placeholder]:visible').first().fill(flow.query);
  const hit = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: flow.name })
    .first();
  await hit.click();
  await page.waitForURL(/\/place\/|\/explore/, { timeout: 25_000 }).catch(() => {});
  await page.waitForTimeout(2800);
}

async function runOne(browser, flow, size, base, prefix) {
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  await openCity(page, flow, base);
  await settleHome(page, base, flow.expectCenter);
  const metrics = await page.evaluate(() => ({
    ...(window.__gateoGlobeQaMetrics ?? {}),
    summaryOpen: Boolean(document.querySelector('.place-summary-card')),
  }));
  const fileBase = `${prefix}${flow.key}-${size.tag}-after-home-settled`;
  const fileName = `${fileBase}.jpg`;
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, fileName),
      type: 'jpeg',
      quality: 55,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    });
  }
  await ctx.close();
  const wedge = await measureWedge(path.join(OUT_REPO, fileName));
  return { flow: flow.key, size: size.tag, prefix, file: fileName, ...metrics, ...wedge };
}

async function main() {
  const browser = await webkit.launch();
  const runs = [];
  for (const size of SIZES) {
    for (const flow of FLOWS) {
      runs.push(await runOne(browser, flow, size, BRANCH, 'branch-'));
      if (MAIN) runs.push(await runOne(browser, flow, size, MAIN, 'main-'));
    }
  }
  await browser.close();

  const branchRuns = runs.filter((r) => r.prefix === 'branch-');
  const notes = {
    branchBase: BRANCH,
    mainBase: MAIN || null,
    summaryOpenFalse: true,
    runs,
    pass: branchRuns.every((r) => {
      if (r.summaryOpen) return false;
      if (r.size === '390' && r.wedgeSuspect) return false;
      if (r.canvasBackingMismatch) return false;
      const flow = FLOWS.find((f) => f.key === r.flow);
      if (flow && r.centerLat != null) {
        const { lat, lng } = flow.expectCenter;
        if (r.centerLat < lat[0] || r.centerLat > lat[1] || r.centerLng < lng[0] || r.centerLng > lng[1]) {
          return false;
        }
      }
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
  console.log('capture-pr373-r9 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

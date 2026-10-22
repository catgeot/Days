/**
 * PR #373 r5 — WebKit home-return QA + optional main side-by-side.
 * BRANCH_BASE=https://127.0.0.1:4173 MAIN_BASE=https://127.0.0.1:4174 node scripts/capture-pr373-r5.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { webkit } from '@playwright/test';

const BRANCH_BASE = process.env.BR373_BRANCH_BASE || process.env.PR373_BASE_URL || 'https://127.0.0.1:4173';
const MAIN_BASE = process.env.BR373_MAIN_BASE || '';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r5');
const OUT_ART = '/opt/cursor/artifacts/pr373-r5';

const FLOWS = [
  { key: 'paris', query: '파리', name: /파리|Paris/, entry: 'home-search' },
  { key: 'tokyo', query: '도쿄', name: /도쿄|Tokyo/, entry: 'home-search' },
  { key: 'jeju', query: '제주', name: /제주|Jeju/, entry: 'home-search' },
  { key: 'jeju-explore', query: '제주', name: /제주|Jeju/, entry: 'explore-direct' },
];

const SIZE = { tag: '390', width: 390, height: 844, dpr: 1 };

async function shot(page, fileBase) {
  const name = `${fileBase}.jpg`;
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, name),
      type: 'jpeg',
      quality: 56,
      clip: { x: 0, y: 0, width: SIZE.width, height: SIZE.height },
    });
  }
}

async function openCity(page, flow, base) {
  if (flow.entry === 'explore-direct') {
    await page.goto(`${base}/explore`, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
    await search.waitFor({ state: 'visible', timeout: 60_000 });
    await search.click();
    await page.waitForURL(/\/explore/, { timeout: 30_000 });
  }
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill(flow.query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: flow.name })
    .first();
  await row.waitFor({ state: 'visible', timeout: 20_000 });
  await row.click();
  await page.waitForTimeout(2000);
}

async function clickHome(page) {
  const home = page.getByRole('button', { name: /홈으로 이동|Go to home/ }).first();
  if (await home.isVisible().catch(() => false)) {
    await home.click();
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 30_000 }).catch(() => {});
    return 'place-header';
  }
  return 'summary-only';
}

async function waitSettle(page) {
  await page.waitForTimeout(4000);
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('.mapboxgl-canvas');
      return Boolean(canvas && canvas.clientWidth > 0);
    },
    { timeout: 15_000 },
  ).catch(() => {});
  await page.waitForTimeout(1500);
}

async function globeMetrics(page) {
  return page.evaluate(() => ({
    markers: document.querySelectorAll('.mapboxgl-marker').length,
    summaryOpen: Boolean(document.querySelector('.place-summary-card')),
    canvasW: document.querySelector('.mapboxgl-canvas')?.width ?? null,
    cssW: document.querySelector('.mapboxgl-canvas')?.clientWidth ?? null,
    windowDpr: window.devicePixelRatio,
  }));
}

async function runFlow(browser, flow, base, prefix) {
  const context = await browser.newContext({
    viewport: { width: SIZE.width, height: SIZE.height },
    deviceScaleFactor: SIZE.dpr,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  await openCity(page, flow, base);
  await clickHome(page);
  await waitSettle(page);
  const metrics = await globeMetrics(page);
  const fileBase = `${prefix}${flow.key}-${SIZE.tag}-after-home-4s`;
  await shot(page, fileBase);
  await context.close();
  return { flow: flow.key, entry: flow.entry, prefix, base, ...metrics };
}

async function main() {
  const browser = await webkit.launch();
  const notes = {
    branchBase: BRANCH_BASE,
    mainBase: MAIN_BASE || null,
    capturedAt: new Date().toISOString(),
    runs: [],
  };

  for (const flow of FLOWS) {
    notes.runs.push(await runFlow(browser, flow, BRANCH_BASE, 'branch-'));
    if (MAIN_BASE) {
      notes.runs.push(await runFlow(browser, flow, MAIN_BASE, 'main-'));
    }
  }

  await browser.close();
  const json = JSON.stringify(notes, null, 2);
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'notes.json'), json);
  }
  console.log(json);

  const bad = notes.runs.filter((r) => r.prefix === 'branch-' && r.summaryOpen);
  if (bad.length) {
    console.error('FAIL: summary still open', bad);
    process.exit(1);
  }
  console.log('capture-pr373-r5 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

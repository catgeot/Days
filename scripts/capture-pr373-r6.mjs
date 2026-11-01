/**
 * PR #373 r6 — branch vs main, map idle + symbol layers for category markers.
 * BR373_MAIN_BASE=https://127.0.0.1:4174 node scripts/capture-pr373-r6.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { webkit } from '@playwright/test';

const BRANCH_BASE = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const MAIN_BASE = process.env.BR373_MAIN_BASE || '';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r6');
const OUT_ART = '/opt/cursor/artifacts/pr373-r6';

const FLOWS = [
  { key: 'paris', query: '파리', name: /파리|Paris/, entry: 'home-search' },
  { key: 'tokyo', query: '도쿄', name: /도쿄|Tokyo/, entry: 'home-search' },
  { key: 'jeju', query: '제주', name: /제주|Jeju/, entry: 'home-search' },
  { key: 'jeju-explore', query: '제주', name: /제주|Jeju/, entry: 'explore-direct' },
];

const SIZES = [
  { tag: '390', width: 390, height: 844 },
  { tag: '1280', width: 1280, height: 800 },
];

async function shot(page, fileBase, size) {
  const name = `${fileBase}.jpg`;
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, name),
      type: 'jpeg',
      quality: 55,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    });
  }
}

async function openCity(page, flow, base) {
  const qa = `${base}/?gateoGlobeQa=1`;
  if (flow.entry === 'explore-direct') {
    await page.goto(`${base}/explore?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto(qa, { waitUntil: 'domcontentloaded' });
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
  await page.waitForTimeout(2500);
}

async function clickHome(page) {
  const home = page.getByRole('button', { name: /홈으로 이동|Go to home/ }).first();
  if (await home.isVisible().catch(() => false)) {
    await home.click();
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 30_000 }).catch(() => {});
  }
}

async function waitGlobeSettled(page, prevIdleAt = 0) {
  await page.waitForTimeout(3000);
  await page.waitForFunction(
    (since) => {
      const m = window.__gateoGlobeQaMetrics;
      return Boolean(m?.idleAt && m.idleAt > since);
    },
    prevIdleAt,
    { timeout: 25_000 },
  ).catch(() => {});
  await page.waitForFunction(
    (since) => {
      const m = window.__gateoGlobeQaMetrics;
      if (!m?.idleAt || m.idleAt <= since) return false;
      return (m.gateoDots ?? 0) > 0 || (m.clusterDots ?? 0) > 0;
    },
    prevIdleAt,
    { timeout: 20_000 },
  ).catch(() => {});
  await page.waitForTimeout(1500);
}

async function metrics(page) {
  return page.evaluate(() => ({
    ...(window.__gateoGlobeQaMetrics ?? {}),
    summaryOpen: Boolean(document.querySelector('.place-summary-card')),
  }));
}

async function runFlow(browser, flow, size, base, prefix) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  const t0 = Date.now();
  await openCity(page, flow, base);
  await clickHome(page);
  await waitGlobeSettled(page, t0);
  const m = await metrics(page);
  const fileBase = `${prefix}${flow.key}-${size.tag}-after-home-settled`;
  await shot(page, fileBase, size);
  await context.close();
  return { flow: flow.key, size: size.tag, prefix, base, ...m };
}

async function main() {
  const browser = await webkit.launch();
  const notes = { branchBase: BRANCH_BASE, mainBase: MAIN_BASE || null, runs: [] };

  const targets = FLOWS.filter((f) => f.key === 'tokyo' || f.key === 'paris' || f.key === 'jeju' || f.key === 'jeju-explore');
  for (const size of SIZES) {
    for (const flow of targets) {
      notes.runs.push(await runFlow(browser, flow, size, BRANCH_BASE, 'branch-'));
      if (MAIN_BASE) notes.runs.push(await runFlow(browser, flow, size, MAIN_BASE, 'main-'));
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
    console.error('FAIL summary open', bad);
    process.exit(1);
  }
  console.log('capture-pr373-r6 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

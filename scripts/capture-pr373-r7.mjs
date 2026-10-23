/**
 * PR #373 r7 — branch vs main, summary closed on both, canvas settle QA.
 * BR373_MAIN_BASE=https://127.0.0.1:4174 node scripts/capture-pr373-r7.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { webkit } from '@playwright/test';

const BRANCH_BASE = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const MAIN_BASE = process.env.BR373_MAIN_BASE || '';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r7');
const OUT_ART = '/opt/cursor/artifacts/pr373-r7';

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

async function dismissSummaryCard(page) {
  const card = page.locator('.place-summary-card');
  if (!(await card.isVisible().catch(() => false))) return;
  const close = page.getByRole('button', { name: /써머리 닫기|Close summary/i }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.waitForTimeout(400);
  }
}

async function isHomePath(urlString) {
  try {
    const p = new URL(urlString).pathname;
    return p === '/' || p === '';
  } catch {
    return false;
  }
}

async function settleHomeFromPlace(page, base) {
  const home = page.getByRole('button', { name: /홈으로 이동|Go to home/i }).first();
  if (await home.isVisible().catch(() => false)) {
    await home.click();
    await page
      .waitForURL((url) => isHomePath(String(url)), { timeout: 30_000 })
      .catch(() => {});
    await page.waitForTimeout(500);
  }
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await dismissSummaryCard(page);
    if (!(await page.locator('.place-summary-card').isVisible().catch(() => false))) break;
    await page.waitForTimeout(450);
  }
  if (/\/place\//.test(page.url())) {
    await page.goto(`${base}/?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await dismissSummaryCard(page);
      if (!(await page.locator('.place-summary-card').isVisible().catch(() => false))) break;
      await page.waitForTimeout(400);
    }
  } else if (isHomePath(page.url()) && !page.url().includes('gateoGlobeQa=1')) {
    await page.evaluate(() => {
      const u = new URL(window.location.href);
      u.searchParams.set('gateoGlobeQa', '1');
      window.history.replaceState({}, '', `${u.pathname}${u.search}`);
    });
  }
}

async function waitGlobeSettled(page, prevIdleAt = 0) {
  await page.waitForTimeout(5000);
  await page.waitForFunction(
    (since) => {
      const m = window.__gateoGlobeQaMetrics;
      return Boolean(m?.idleAt && m.idleAt > since);
    },
    prevIdleAt,
    { timeout: 30_000 },
  ).catch(() => {});
  await page.waitForFunction(
    (since) => {
      const m = window.__gateoGlobeQaMetrics;
      if (!m?.idleAt || m.idleAt <= since) return false;
      if (m.canvasBackingMismatch) return false;
      return (m.gateoDots ?? 0) > 0 || (m.clusterDots ?? 0) > 0;
    },
    prevIdleAt,
    { timeout: 30_000 },
  ).catch(() => {});
  await page.waitForTimeout(2500);
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
  await settleHomeFromPlace(page, base);
  await waitGlobeSettled(page, t0);
  const m = await metrics(page);
  const fileBase = `${prefix}${flow.key}-${size.tag}-after-home-settled`;
  await shot(page, fileBase, size);
  await context.close();
  return { flow: flow.key, size: size.tag, prefix, base, ...m };
}

async function main() {
  const browser = await webkit.launch();
  const notes = {
    branchBase: BRANCH_BASE,
    mainBase: MAIN_BASE || null,
    capturePolicy: 'branch+main summaryOpen=false (settleHomeFromPlace + dismissSummaryCard on main)',
    runs: [],
  };

  for (const size of SIZES) {
    for (const flow of FLOWS) {
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

  const bad = notes.runs.filter((r) => r.summaryOpen);
  if (bad.length) {
    console.error('FAIL summary open', bad);
    process.exit(1);
  }
  const mismatch = notes.runs.filter((r) => r.prefix === 'branch-' && r.canvasBackingMismatch);
  if (mismatch.length) {
    console.error('FAIL branch canvas backing mismatch', mismatch);
    process.exit(1);
  }
  console.log('capture-pr373-r7 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

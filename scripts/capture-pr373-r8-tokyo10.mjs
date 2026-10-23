/**
 * PR #373 r8 — Tokyo 390 home-return ×10 (WebKit), wedge metric table.
 * BR373_BRANCH_BASE=https://127.0.0.1:4173 node scripts/capture-pr373-r8-tokyo10.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { webkit } from '@playwright/test';

const execFileAsync = promisify(execFile);

const BASE = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const RUNS = 10;
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r8');
const OUT_ART = '/opt/cursor/artifacts/pr373-r8';
const VIEWPORT = { width: 390, height: 844 };

async function measureJpegWedge(jpegPath) {
  const py = `
from PIL import Image
import json, sys
im = Image.open(sys.argv[1]).convert('RGB')
w, h = im.size
x0, y0, x1, y1 = int(w*0.72), int(h*0.26), w, int(h*0.56)
reg = im.crop((x0, y0, x1, y1))
px = list(reg.getdata())
n = len(px)
mean = sum(sum(p)/3 for p in px) / n
dark = sum(1 for p in px if sum(p)/3 < 25) / n
print(json.dumps({'darkFraction': dark, 'meanRgb': mean, 'wedgeSuspect': dark >= 0.35}))
`;
  const { stdout } = await execFileAsync('python3', ['-c', py, jpegPath]);
  return JSON.parse(stdout.trim());
}

async function tokyoHomeReturn(page) {
  await page.goto(`${BASE}/?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first().click();
  await page.waitForURL(/\/explore/);
  await page.locator('input[placeholder]:visible').first().fill('도쿄');
  await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /도쿄|Tokyo/ })
    .first()
    .click();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /홈으로 이동|Go to home/i }).first().click();
  await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const m = window.__gateoGlobeQaMetrics;
      return Boolean(m?.idleAt) && m.canvasBackingMismatch === false;
    },
    null,
    { timeout: 45_000 },
  ).catch(() => {});
  await page.waitForTimeout(2000);
  const summaryOpen = await page.evaluate(() => Boolean(document.querySelector('.place-summary-card')));
  return { summaryOpen };
}

async function main() {
  const browser = await webkit.launch();
  const rows = [];

  for (let i = 1; i <= RUNS; i += 1) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    const meta = await tokyoHomeReturn(page);
    const fileName = `branch-tokyo-390-home-run-${String(i).padStart(2, '0')}.jpg`;
    for (const dir of [OUT_REPO, OUT_ART]) {
      await mkdir(dir, { recursive: true });
      await page.screenshot({
        path: path.join(dir, fileName),
        type: 'jpeg',
        quality: 55,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });
    }
    await context.close();

    const wedge = await measureJpegWedge(path.join(OUT_REPO, fileName));
    rows.push({
      run: i,
      file: fileName,
      summaryOpen: meta.summaryOpen,
      darkFraction: Number(wedge.darkFraction.toFixed(4)),
      meanRgb: Number(wedge.meanRgb.toFixed(1)),
      wedgeSuspect: wedge.wedgeSuspect,
    });
    console.log(`run ${i}`, rows[rows.length - 1]);
  }

  await browser.close();

  const table = {
    branchBase: BASE,
    viewport: VIEWPORT,
    wedgeRule: 'darkFraction>=0.35 in band x[72%,100%] y[26%,56%]',
    runs: rows,
    pass: rows.every((r) => !r.wedgeSuspect && !r.summaryOpen),
  };

  const md = [
    '# PR #373 r8 — Tokyo 390 wedge metrics (10 runs)',
    '',
    `| Run | File | darkFraction | meanRgb | wedge | summaryOpen |`,
    `|-----|------|--------------|---------|-------|-------------|`,
    ...rows.map(
      (r) =>
        `| ${r.run} | ${r.file} | ${r.darkFraction} | ${r.meanRgb} | ${r.wedgeSuspect ? 'FAIL' : 'ok'} | ${r.summaryOpen} |`,
    ),
    '',
    `**pass**: ${table.pass}`,
  ].join('\n');

  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'wedge-metrics.json'), `${JSON.stringify(table, null, 2)}\n`);
    await writeFile(path.join(dir, 'wedge-metrics.md'), `${md}\n`);
  }

  console.log(md);

  if (!table.pass) {
    console.error('FAIL: wedge or summaryOpen in at least one run');
    process.exit(1);
  }
  console.log('capture-pr373-r8-tokyo10 PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

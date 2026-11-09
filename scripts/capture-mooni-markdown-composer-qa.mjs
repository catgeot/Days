import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/mooni-composer-qa';
const fixturePath = '/qa/mooni-markdown-composer';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.goto(`${baseURL}${fixturePath}`, { waitUntil: 'networkidle' });

function visibilityInViewport(selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const h = window.innerHeight;
    const w = window.innerWidth;
    return {
      found: true,
      fullyVisible:
        r.top >= 0 && r.left >= 0 && r.bottom <= h + 0.5 && r.right <= w + 0.5,
      top: r.top,
      bottom: r.bottom,
      viewportH: h,
      scrollY: window.scrollY,
    };
  }, selector);
}

async function assertLayout() {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const bubble = document.querySelector('[data-testid="mooni-composer-qa-bubble"]');
    const tableWrap = bubble?.querySelector('.mooni-chat-markdown .overflow-x-auto');
    const chips = document.querySelector('[data-testid="mooni-composer-qa-chips"]');
    const foot = document.querySelector('[data-testid="mooni-composer-qa-foot"]');
    const bubbleRect = bubble?.getBoundingClientRect();
    const chipsRect = chips?.getBoundingClientRect();
    const footRect = foot?.getBoundingClientRect();
    const trustBar = document.querySelector('a[href="/about"]')?.closest('nav,div');
    const trustBarRect = trustBar?.getBoundingClientRect();
    const overlap =
      bubbleRect && chipsRect ? bubbleRect.bottom > chipsRect.top + 1 : false;
    return {
      docScrollMinusClient: doc.scrollWidth - doc.clientWidth,
      tableOverflowX: tableWrap ? getComputedStyle(tableWrap).overflowX : '',
      overlapBubbleChips: overlap,
      footBelowChips: chipsRect && footRect ? footRect.top >= chipsRect.bottom - 1 : false,
      tableExists: Boolean(bubble?.querySelector('table')),
      strongA: Boolean(bubble?.querySelector('strong')?.textContent?.includes('A')),
      mainLayoutTrustBarInDom: Boolean(trustBar),
      trustBarOverlapsThread:
        Boolean(trustBarRect && footRect) && trustBarRect.top < footRect.bottom,
    };
  });
}

async function readPngSize(filePath) {
  const buf = await readFile(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const report = {
  baseURL,
  fixturePath,
  captureMode: 'viewport-only (no clip, no element screenshot)',
  isolatedRoute: true,
  note:
    'Isolated /qa/mooni-markdown-composer skips MainLayout TrustLinkBar; not PROD home chat.',
  capturedAt: new Date().toISOString(),
  viewports: {},
};

const viewportSpecs = [
  { key: '390x1280', width: 390, height: 1280 },
  { key: '1280x800', width: 1280, height: 800 },
];

for (const spec of viewportSpecs) {
  await page.setViewportSize({ width: spec.width, height: spec.height });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  const metrics = await assertLayout();
  const footTop = await visibilityInViewport('[data-testid="mooni-composer-qa-foot"]');
  const tableTop = await visibilityInViewport('[data-testid="mooni-composer-qa-bubble"] table');

  const shots = [];
  const baseName = `composer-mock-viewport-${spec.key}`;

  const topPath = path.join(outDir, `${baseName}-scroll-top.png`);
  await page.screenshot({ path: topPath, fullPage: false });
  const topSize = await readPngSize(topPath);
  shots.push({
    file: `${baseName}-scroll-top.png`,
    scrollY: 0,
    png: topSize,
    foot: footTop,
    table: tableTop,
  });

  let footFullyVisible = footTop.found && footTop.fullyVisible;
  if (!footFullyVisible && footTop.found) {
    await page.evaluate(() => {
      document.querySelector('[data-testid="mooni-composer-qa-foot"]')?.scrollIntoView({
        block: 'end',
        behavior: 'instant',
      });
    });
    await page.waitForTimeout(200);
    const footScrolled = await visibilityInViewport('[data-testid="mooni-composer-qa-foot"]');
    const footPath = path.join(outDir, `${baseName}-scroll-foot.png`);
    await page.screenshot({ path: footPath, fullPage: false });
    const footSize = await readPngSize(footPath);
    shots.push({
      file: `${baseName}-scroll-foot.png`,
      scrollY: await page.evaluate(() => window.scrollY),
      png: footSize,
      foot: footScrolled,
    });
    footFullyVisible = footScrolled.found && footScrolled.fullyVisible;
  }

  report.viewports[spec.key] = {
    ...metrics,
    footFullyVisibleInOneViewport: footFullyVisible,
    screenshots: shots,
    pngMatchesViewport:
      shots[0].png.width === spec.width && shots[0].png.height === spec.height,
  };
}

const failures = [];
for (const [key, m] of Object.entries(report.viewports)) {
  if (!m.pngMatchesViewport) {
    failures.push(`${key}: top PNG is not full viewport (${JSON.stringify(m.screenshots[0]?.png)})`);
  }
  if (m.docScrollMinusClient > 1) {
    failures.push(`${key}: page horizontal overflow ${m.docScrollMinusClient}px`);
  }
  if (!m.tableExists) failures.push(`${key}: table missing`);
  if (!m.strongA) failures.push(`${key}: bold A missing`);
  if (m.overlapBubbleChips) failures.push(`${key}: bubble overlaps chips`);
  if (!m.footBelowChips) failures.push(`${key}: footer not below chips`);
  if (m.tableOverflowX !== 'auto') {
    failures.push(`${key}: table overflow-x not auto (${m.tableOverflowX})`);
  }
  if (!m.footFullyVisibleInOneViewport && m.screenshots.length < 2) {
    failures.push(`${key}: footer not visible and no scroll-foot shot`);
  }
  if (m.mainLayoutTrustBarInDom && m.trustBarOverlapsThread) {
    failures.push(`${key}: MainLayout trust bar overlaps thread (use isolated route)`);
  }
}

report.pass = failures.length === 0;
report.failures = failures;

await writeFile(path.join(outDir, 'composer-qa-metrics.json'), `${JSON.stringify(report, null, 2)}\n`);

await browser.close();

if (failures.length) {
  console.error('composer QA FAIL:\n', failures.join('\n'));
  process.exit(1);
}
console.log(`composer QA PASS → ${outDir}`);

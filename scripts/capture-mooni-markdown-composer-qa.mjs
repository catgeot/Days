import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/mooni-composer-qa';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.goto(`${baseURL}/qa/mooni-markdown-fixture`, { waitUntil: 'networkidle' });

const thread = page.locator('[data-testid="mooni-composer-qa-thread"]');
await thread.scrollIntoViewIfNeeded();

async function assertLayout(viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(150);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const bubble = document.querySelector('[data-testid="mooni-composer-qa-bubble"]');
    const tableWrap = bubble?.querySelector('.mooni-chat-markdown .overflow-x-auto');
    const chips = document.querySelector('[data-testid="mooni-composer-qa-chips"]');
    const foot = document.querySelector('[data-testid="mooni-composer-qa-foot"]');
    const bubbleRect = bubble?.getBoundingClientRect();
    const chipsRect = chips?.getBoundingClientRect();
    const footRect = foot?.getBoundingClientRect();
    const overlap =
      bubbleRect && chipsRect
        ? bubbleRect.bottom > chipsRect.top + 1
        : false;
    return {
      docScrollMinusClient: doc.scrollWidth - doc.clientWidth,
      bubbleScrollMinusClient: bubble ? bubble.scrollWidth - bubble.clientWidth : 0,
      tableOverflowX: tableWrap ? getComputedStyle(tableWrap).overflowX : '',
      overlapBubbleChips: overlap,
      footBelowChips: chipsRect && footRect ? footRect.top >= chipsRect.bottom - 1 : false,
      tableExists: Boolean(bubble?.querySelector('table')),
      strongA: Boolean(bubble?.querySelector('strong')?.textContent?.includes('A')),
    };
  });

  return metrics;
}

const report = { baseURL, capturedAt: new Date().toISOString(), viewports: {} };

for (const spec of [
  { key: '390x1280', width: 390, height: 1280 },
  { key: '1280x800', width: 1280, height: 800 },
]) {
  const metrics = await assertLayout({ width: spec.width, height: spec.height });
  report.viewports[spec.key] = metrics;

  const box = await thread.boundingBox();
  if (!box) throw new Error('composer thread not found');
  const height = Math.min(spec.height, Math.ceil(box.height) + 16);
  const file =
    spec.width === 390
      ? `composer-mock-full-thread-${spec.width}x${spec.height}.png`
      : `composer-mock-full-thread-${spec.width}.png`;

  await page.screenshot({
    path: path.join(outDir, file),
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y - 4),
      width: spec.width === 390 ? 390 : Math.min(spec.width, Math.ceil(box.width) + 8),
      height,
    },
  });
}

const failures = [];
for (const [key, m] of Object.entries(report.viewports)) {
  if (m.docScrollMinusClient > 1) failures.push(`${key}: page horizontal overflow ${m.docScrollMinusClient}px`);
  if (!m.tableExists) failures.push(`${key}: table missing in bubble`);
  if (!m.strongA) failures.push(`${key}: bold A missing`);
  if (m.overlapBubbleChips) failures.push(`${key}: bubble overlaps chips`);
  if (!m.footBelowChips) failures.push(`${key}: footer not below chips`);
  if (m.tableOverflowX !== 'auto') failures.push(`${key}: table wrapper overflow-x not auto (${m.tableOverflowX})`);
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

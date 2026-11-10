import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/mooni-saved-chat-markdown';
const fixturePath = '/qa/mooni-saved-chat-markdown';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();

await page.goto(`${baseURL}${fixturePath}`, { waitUntil: 'networkidle', timeout: 120_000 });
await page.waitForSelector('h1:text("MOONi saved chat replay (QA)")', {
  timeout: 60_000,
  state: 'attached',
});
await page.waitForFunction(
  () => {
    const guam = document.querySelector('[data-testid="mooni-saved-guam-text-only-bubble"]');
    const udo = document.querySelector('[data-testid="mooni-saved-udo-text-only-bubble"]');
    return Boolean(guam?.querySelector('table') && udo?.querySelector('strong'));
  },
  undefined,
  { timeout: 60_000 },
);

async function bubbleMetrics(testId) {
  return page.evaluate((id) => {
    const bubble = document.querySelector(`[data-testid="${id}"]`);
    if (!bubble) return { found: false };
    return {
      found: true,
      table: Boolean(bubble.querySelector('table')),
      strongHangul: Boolean(
        bubble.querySelector('strong')?.textContent?.includes('천진항'),
      ),
      literalAsterisk: (bubble.textContent || '').includes('**'),
      thCount: bubble.querySelectorAll('th').length,
    };
  }, testId);
}

async function readPngSize(filePath) {
  const buf = await readFile(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const report = {
  baseURL,
  fixturePath,
  capturedAt: new Date().toISOString(),
  viewports: {},
};

const viewportSpecs = [
  { key: '390', width: 390, height: 844 },
  { key: '1280', width: 1280, height: 800 },
];

const bubbleIds = [
  'mooni-saved-guam-text-only-bubble',
  'mooni-saved-udo-text-only-bubble',
];

for (const spec of viewportSpecs) {
  await page.setViewportSize({ width: spec.width, height: spec.height });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  const metrics = {};
  for (const id of bubbleIds) {
    metrics[id] = await bubbleMetrics(id);
  }

  const fileName = `mooni-saved-chat-${spec.key}.png`;
  const shotPath = path.join(outDir, fileName);
  if (spec.width === 390) {
    await page.screenshot({
      path: shotPath,
      clip: { x: 0, y: 0, width: 390, height: Math.min(844, spec.height) },
    });
  } else {
    await page.screenshot({ path: shotPath, fullPage: false });
  }
  const png = await readPngSize(shotPath);

  report.viewports[spec.key] = {
    ...metrics,
    screenshot: fileName,
    png,
    widthOk: spec.width === 390 ? png.width === 390 : png.width === spec.width,
  };
}

const failures = [];
for (const [key, m] of Object.entries(report.viewports)) {
  if (!m.widthOk) failures.push(`${key}: PNG width ${m.png.width} !== expected`);
  for (const id of bubbleIds) {
    const b = m[id];
    if (!b?.found) failures.push(`${key}: missing ${id}`);
    else {
      if (id.includes('guam') && !b.table) failures.push(`${key}: guam table missing in ${id}`);
      if (id.includes('udo') && !b.strongHangul) {
        failures.push(`${key}: udo bold missing in ${id}`);
      }
      if (b.literalAsterisk) failures.push(`${key}: literal ** visible in ${id}`);
    }
  }
}

report.pass = failures.length === 0;
report.failures = failures;

await writeFile(path.join(outDir, 'saved-chat-metrics.json'), `${JSON.stringify(report, null, 2)}\n`);

await browser.close();

if (failures.length) {
  console.error('saved-chat markdown capture FAIL:\n', failures.join('\n'));
  process.exit(1);
}
console.log(`saved-chat markdown capture PASS → ${outDir}`);

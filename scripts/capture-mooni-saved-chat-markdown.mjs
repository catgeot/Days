import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PREVIEW_URL || 'https://127.0.0.1:4174';
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
    const guam = document.querySelector('[data-testid="mooni-saved-guam-raw-bubble"]');
    const thText = guam?.textContent || '';
    return (
      thText.includes('괌 (Guam)') &&
      thText.includes('주요 매력') &&
      !thText.includes('주요 특징') &&
      thText.includes('분위기')
    );
  },
  undefined,
  { timeout: 60_000 },
);

async function readPngSize(filePath) {
  const buf = await readFile(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function scrollBubbleIntoView(testId) {
  await page.locator(`[data-testid="${testId}"]`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
}

async function clipBubbleScreenshot(testId, shotPath, viewportWidth, viewportHeight) {
  const box = await page.locator(`[data-testid="${testId}"]`).boundingBox();
  if (!box) throw new Error(`bounding box missing: ${testId}`);
  const maxH = viewportHeight ?? (viewportWidth === 390 ? 844 : 800);
  const height = Math.min(maxH, Math.ceil(box.height) + 8);
  await page.screenshot({
    path: shotPath,
    clip: {
      x: 0,
      y: Math.max(0, Math.floor(box.y)),
      width: viewportWidth,
      height,
    },
  });
}

const UDO_BUBBLE = 'mooni-saved-udo-raw-bubble';

async function captureUdoClip(needle, shotPath, viewportWidth, viewportHeight) {
  await scrollBubbleIntoView(UDO_BUBBLE);
  const locator = page.locator(`[data-testid="${UDO_BUBBLE}"]`).getByText(needle, { exact: false }).first();
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await clipBubbleScreenshot(UDO_BUBBLE, shotPath, viewportWidth, viewportHeight);
}

const report = {
  baseURL,
  fixturePath,
  capturedAt: new Date().toISOString(),
  shots: {},
};

const viewports = [
  { key: '390', width: 390, height: 844 },
  { key: '1280', width: 1280, height: 800 },
];

const GUAM_BUBBLE = 'mooni-saved-guam-raw-bubble';

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  const guamName = `mooni-saved-chat-guam-${vp.key}.png`;
  await scrollBubbleIntoView(GUAM_BUBBLE);
  await clipBubbleScreenshot(GUAM_BUBBLE, path.join(outDir, guamName), vp.width, vp.height);

  const udoArrival = `mooni-saved-chat-udo-arrival-${vp.key}.png`;
  await captureUdoClip('도착 항구', path.join(outDir, udoArrival), vp.width, vp.height);

  const udoBoarding = `mooni-saved-chat-udo-boarding-${vp.key}.png`;
  await captureUdoClip('탑승 절차', path.join(outDir, udoBoarding), vp.width, vp.height);

  report.shots[vp.key] = {
    guam: {
      file: guamName,
      png: await readPngSize(path.join(outDir, guamName)),
    },
    udoArrival: {
      file: udoArrival,
      png: await readPngSize(path.join(outDir, udoArrival)),
    },
    udoBoarding: {
      file: udoBoarding,
      png: await readPngSize(path.join(outDir, udoBoarding)),
    },
  };
}

const failures = [];
for (const [vpKey, shots] of Object.entries(report.shots)) {
  const expectedW = vpKey === '390' ? 390 : 1280;
  for (const [kind, meta] of Object.entries(shots)) {
    if (meta.png.width !== expectedW) {
      failures.push(`${vpKey}/${kind}: width ${meta.png.width} !== ${expectedW}`);
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

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/mooni-markdown';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.goto(`${baseURL}/qa/mooni-markdown-fixture`, { waitUntil: 'networkidle' });

for (const testId of [
  'mooni-md-table',
  'mooni-md-collapsed-table',
  'mooni-md-live-merged-table',
  'mooni-md-prod-collapsed-compare',
]) {
  const tableCount = await page.locator(`[data-testid="${testId}"] table`).count();
  if (tableCount < 1) {
    throw new Error(`${testId}: expected <table>, got ${tableCount}`);
  }
}

await page.setViewportSize({ width: 390, height: 844 });
await page.locator('[data-testid="mooni-md-dark"]').screenshot({
  path: path.join(outDir, 'after-mobile-390-dark.png'),
});
await page.setViewportSize({ width: 1280, height: 800 });
await page.locator('[data-testid="mooni-md-dark"]').screenshot({
  path: path.join(outDir, 'after-desktop-dark.png'),
});
await page.locator('[data-testid="mooni-md-truncated"]').screenshot({
  path: path.join(outDir, 'after-desktop-truncated.png'),
});

await page.setViewportSize({ width: 390, height: 1280 });
await page.screenshot({
  path: path.join(outDir, 'after-mobile-390-table-1280.png'),
  clip: { x: 0, y: 0, width: 390, height: 1280 },
});
const tableBox = await page.locator('[data-testid="mooni-md-table"]').boundingBox();
if (tableBox) {
  await page.screenshot({
    path: path.join(outDir, 'after-mobile-390-table-section.png'),
    clip: { x: 0, y: Math.max(0, tableBox.y - 8), width: 390, height: Math.min(520, tableBox.height + 24) },
  });
}

await page.setViewportSize({ width: 1280, height: 800 });
await page.locator('[data-testid="mooni-md-table"]').screenshot({
  path: path.join(outDir, 'after-desktop-1280-table-section.png'),
});

const collapsedBox = await page.locator('[data-testid="mooni-md-collapsed-table"]').boundingBox();
if (collapsedBox) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(outDir, 'after-mobile-390-collapsed-table-clip.png'),
    clip: {
      x: 0,
      y: Math.max(0, collapsedBox.y - 8),
      width: 390,
      height: Math.min(560, collapsedBox.height + 32),
    },
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('[data-testid="mooni-md-collapsed-table"]').screenshot({
    path: path.join(outDir, 'after-desktop-1280-collapsed-table-section.png'),
  });
}

await page.setViewportSize({ width: 390, height: 844 });
const liveMerged = await page.locator('[data-testid="mooni-md-live-merged-table"]').boundingBox();
if (liveMerged) {
  await page.screenshot({
    path: path.join(outDir, 'live-merged-table-mobile-390.png'),
    clip: { x: 0, y: Math.max(0, liveMerged.y - 8), width: 390, height: Math.min(640, liveMerged.height + 24) },
  });
}
await page.setViewportSize({ width: 1280, height: 800 });
await page.locator('[data-testid="mooni-md-live-merged-table"]').screenshot({
  path: path.join(outDir, 'live-merged-table-desktop-1280.png'),
});

const prodCompare = await page.locator('[data-testid="mooni-md-prod-collapsed-compare"]').boundingBox();
if (prodCompare) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(outDir, 'prod-guam-compare-mobile-390.png'),
    clip: {
      x: 0,
      y: Math.max(0, prodCompare.y - 8),
      width: 390,
      height: Math.min(720, prodCompare.height + 24),
    },
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('[data-testid="mooni-md-prod-collapsed-compare"]').screenshot({
    path: path.join(outDir, 'prod-guam-compare-desktop-1280.png'),
  });
}

const udoBold = await page.locator('[data-testid="mooni-md-udo-spaced-bold"]').boundingBox();
if (udoBold) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(outDir, 'udo-spaced-bold-mobile-390.png'),
    clip: { x: 0, y: Math.max(0, udoBold.y - 8), width: 390, height: Math.min(120, udoBold.height + 16) },
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('[data-testid="mooni-md-udo-spaced-bold"]').screenshot({
    path: path.join(outDir, 'udo-spaced-bold-desktop-1280.png'),
  });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.locator('[data-testid="mooni-md-ordered-gap"]').screenshot({
  path: path.join(outDir, 'ordered-gap-mobile-390.png'),
});
await page.setViewportSize({ width: 1280, height: 800 });
await page.locator('[data-testid="mooni-md-ordered-gap"]').screenshot({
  path: path.join(outDir, 'ordered-gap-desktop-1280.png'),
});

await browser.close();
console.log(`mooni markdown screenshots → ${outDir}`);

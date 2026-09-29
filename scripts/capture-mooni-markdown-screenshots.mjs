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

await browser.close();
console.log(`mooni markdown screenshots → ${outDir}`);

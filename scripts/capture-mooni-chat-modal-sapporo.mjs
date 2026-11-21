import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PREVIEW_URL || 'https://127.0.0.1:4173';
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts';
const label = process.env.CAPTURE_LABEL || 'after';

async function captureWith(browserType, width) {
  const browser = await browserType.launch();
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  await page.goto(`${baseURL}/place/sapporo?lang=ko`, { waitUntil: 'domcontentloaded' });
  const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
  if (await hint.isVisible({ timeout: 2000 }).catch(() => false)) {
    await hint.click();
  }
  await page.locator('.place-header-mooni-btn').first().click();
  await page.getByTestId('mooni-chat-close').waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(400);
  const file = path.join(outDir, `mooni-sapporo-modal-${label}-${width}.png`);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width, height: Math.min(360, width === 390 ? 844 : 900) },
  });
  await browser.close();
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [];
for (const width of [390, 1280]) {
  files.push(await captureWith(chromium, width));
}

console.log(JSON.stringify({ label, baseURL, files }, null, 2));
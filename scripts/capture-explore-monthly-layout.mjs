#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/opt/cursor/artifacts/explore-monthly-picks-layout';
const port = Number(process.env.CAPTURE_PORT || 5196);
const baseURL = `http://127.0.0.1:${port}`;

const shots = [
  { name: '390-monthly', width: 390, height: 844 },
  { name: '1280-monthly', width: 1280, height: 900 },
  { name: '1440-monthly', width: 1440, height: 900 },
];

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const shot of shots) {
      const page = await browser.newPage({
        viewport: { width: shot.width, height: shot.height },
        deviceScaleFactor: 1,
      });
      await page.goto(`${baseURL}/explore`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      const section = page.getByTestId('explore-v2-monthly-section');
      await section.waitFor({ state: 'visible', timeout: 60_000 });
      await page.waitForTimeout(1500);
      await section.screenshot({
        path: join(outDir, `${shot.name}.png`),
      });
      if (shot.width === 390) {
        await page.screenshot({
          path: join(outDir, `${shot.name}-viewport.png`),
          clip: { x: 0, y: 0, width: 390, height: Math.min(844, shot.height) },
        });
      }
      await page.close();
    }
    console.log(`OK captures -> ${outDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

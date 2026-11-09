#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const outDir = process.env.PLACE_HEADER_LOCALE_SCREENSHOT_DIR || '/opt/cursor/artifacts';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const prefix = process.env.PLACE_HEADER_LOCALE_SHOT_PREFIX || 'place-header-locale';

const paths = ['/place/paris?lang=ko', '/place/tour-127635?lang=ko'];
const widths = [390, 1280];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const path of paths) {
  const slug = path.includes('paris') ? 'paris' : 'tour-127635';
  for (const width of widths) {
    const height = width === 390 ? 844 : 900;
    await page.setViewportSize({ width, height });
    await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForTimeout(1200);
    const headerH = width === 390 ? 120 : 140;
    await page.screenshot({
      path: join(outDir, `${prefix}-${slug}-${width}-${process.env.SHOT_PHASE || 'after'}.png`),
      clip: { x: 0, y: 0, width, height: headerH },
    });
  }
}

await browser.close();
console.log(`Wrote header clips to ${outDir} (${prefix}-*)`);

#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4188';
const outDir = join('/opt/cursor/artifacts', 'explore-v2-query-prod-preview');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const { width, height, name } of [
  { width: 390, height: 844, name: '390' },
  { width: 1280, height: 720, name: '1280' },
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/explore?explore_v2=1`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.getByTestId('explore-v2-monthly-section').waitFor({ state: 'visible', timeout: 45_000 });
  const widgetLog = await page.getByText('모바일 위젯 로그').count();
  const workLog = await page.getByText('작업 로그').count();
  if (widgetLog !== 0 || workLog !== 0) {
    throw new Error(`debug chrome visible (${name}): widget=${widgetLog} work=${workLog}`);
  }
  if (name === '390') {
    await page.screenshot({
      path: join(outDir, `explore-v2-query-${name}.png`),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  } else {
    await page.screenshot({ path: join(outDir, `explore-v2-query-${name}.png`) });
  }
  await context.close();
}
await browser.close();
console.log(`OK ${outDir}`);

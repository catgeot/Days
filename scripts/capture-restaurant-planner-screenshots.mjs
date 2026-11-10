#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT = '/opt/cursor/artifacts';
const BASE = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:4173';

const SHOTS = [
  ['gangneung-390-before', 390, '/qa/restaurant-planner-fixture?city=gangneung'],
  ['gangneung-390-after', 390, '/qa/restaurant-planner-fixture?city=gangneung&after=1'],
  ['gangneung-1280-before', 1280, '/qa/restaurant-planner-fixture?city=gangneung'],
  ['gangneung-1280-after', 1280, '/qa/restaurant-planner-fixture?city=gangneung&after=1'],
  ['tokyo-390-before', 390, '/qa/restaurant-planner-fixture?city=tokyo'],
  ['tokyo-390-after', 390, '/qa/restaurant-planner-fixture?city=tokyo&after=1'],
  ['tokyo-1280-before', 1280, '/qa/restaurant-planner-fixture?city=tokyo'],
  ['tokyo-1280-after', 1280, '/qa/restaurant-planner-fixture?city=tokyo&after=1'],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [name, width, path] of SHOTS) {
  const height = width <= 390 ? 844 : 900;
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('[data-planner-scroll-root], button:has-text("플래너")', {
    timeout: 60_000,
  });
  const out = join(OUT, `restaurant-planner-${name}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width, height: Math.min(height, 1200) } });
  await page.close();
  console.log('saved', out);
}
await browser.close();

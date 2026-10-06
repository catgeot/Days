#!/usr/bin/env node
/**
 * OutboundSearchButtons — 320px·390px에서 라벨 줄바꿈 없음(버튼 단위 wrap).
 *
 *   npm run smoke:outbound-search-buttons-layout
 *
 * PLAYWRIGHT_BASE_URL 없으면 로컬 vite preview(4173) 기동.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTBOUND = join(__dirname, '../src/shared/outbound/OutboundSearchButtons.jsx');
const src = readFileSync(OUTBOUND, 'utf8');
assert.match(src, /whitespace-nowrap/, 'OutboundSearchButtons uses whitespace-nowrap');

const WIDTHS = [320, 390];

async function waitForHttp(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server not ready: ${url}`);
}

async function ensureBaseUrl() {
  const env = process.env.PLAYWRIGHT_BASE_URL;
  if (env) {
    return { base: env.replace(/\/?$/, '/'), child: null };
  }

  const port = 4174;
  const base = `http://127.0.0.1:${port}/`;
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: join(__dirname, '..'),
    stdio: 'ignore',
    env: { ...process.env, BROWSER: 'none', DEV_SSL: '0' },
  });
  await waitForHttp(base);
  return { base, child };
}

async function assertButtonLines(page, selector) {
  const buttons = page.locator(selector);
  const count = await buttons.count();
  assert.ok(count >= 1, `expected outbound buttons: ${selector}`);
  for (let i = 0; i < count; i += 1) {
    const box = await buttons.nth(i).boundingBox();
    assert.ok(box, 'button bounding box');
    const lineCount = await buttons.nth(i).evaluate((el) => {
      const label = el.querySelector('span:not([aria-hidden])');
      if (!label) return 1;
      const lh = parseFloat(getComputedStyle(label).lineHeight) || 16;
      return Math.round(label.getBoundingClientRect().height / lh);
    });
    assert.ok(lineCount <= 1, `button ${i} label should be single line (got ${lineCount})`);
  }
}

async function openFestivalDetail(page, base) {
  await page.goto(`${base}korea/`);
  const cards = page
    .getByRole('main')
    .getByRole('button')
    .filter({ has: page.locator('img[alt]') });
  await cards.first().waitFor({ state: 'visible', timeout: 90_000 });
  await cards.first().click();
  await page.locator('[data-festival-outbound-search]').waitFor({ timeout: 60_000 });
}

async function openScenicDetail(page, base) {
  await page.goto(`${base}korea/theme/scenic?spot=gyeongbokgung`);
  await page.locator('[data-scenic-outbound-search]').waitFor({ timeout: 60_000 });
}

const { base, child } = await ensureBaseUrl();
const browser = await chromium.launch();
try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await openFestivalDetail(page, base);
    await assertButtonLines(page, '[data-festival-outbound-search] a');
    await page.screenshot({
      path: `/opt/cursor/artifacts/outbound-festival-${width}px.png`,
      fullPage: false,
    });

    await openScenicDetail(page, base);
    await assertButtonLines(page, '[data-scenic-outbound-search] a');
    await page.screenshot({
      path: `/opt/cursor/artifacts/outbound-scenic-${width}px.png`,
      fullPage: false,
    });
    await page.close();
  }
  console.log('smoke:outbound-search-buttons-layout PASS');
} finally {
  await browser.close();
  if (child) child.kill('SIGTERM');
}

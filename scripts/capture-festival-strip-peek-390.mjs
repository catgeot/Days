/**
 * Festival stay/tour horizontal strip — 390px before/after evidence.
 * Usage:
 *   OUT_TAG=before npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
 *   OUT_TAG=before node scripts/capture-festival-strip-peek-390.mjs
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
function eventStripCardPeekMetrics(containerWidthPx, { large = false, gapPx = 8 } = {}) {
  const divisor = large ? 1.55 : 2.18;
  const cardWidth = (containerWidthPx - gapPx) / divisor;
  const peekPx = containerWidthPx - cardWidth * 2 - gapPx;
  const peekPercent = cardWidth > 0 ? (peekPx / cardWidth) * 100 : 0;
  return { cardWidth, peekPx, peekPercent };
}

const BASE = process.env.PREVIEW_URL || 'https://127.0.0.1:4174';
const OUT_TAG = process.env.OUT_TAG || 'after';
const OUT = `/opt/cursor/artifacts/festival-strip-peek-390/${OUT_TAG}`;
const FESTIVAL_IDS = (process.env.FESTIVAL_IDS || '2930716,637693,638576').split(',');

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function measureRow(page, section) {
  return page.evaluate((sectionName) => {
    const root = document.querySelector(`[data-festival-section="${sectionName}"]`);
    if (!root) return null;
    const row =
      root.querySelector('.snap-x') ||
      root.querySelector('[class*="overflow-x-auto"]');
    const cards = row
      ? [...row.children].filter((el) => {
          const w = el.getBoundingClientRect().width;
          return w > 60 && el.tagName !== 'SCRIPT';
        })
      : [];
    if (!row || cards.length < 2) return null;
    const rowRect = row.getBoundingClientRect();
    const cardRect = cards[0].getBoundingClientRect();
    const gap = cards.length > 1 ? cards[1].getBoundingClientRect().left - cardRect.right : 8;
    const visibleRight = Math.min(rowRect.right, window.innerWidth);
    const used = cardRect.width * 2 + gap;
    const peekPx = Math.max(0, visibleRight - rowRect.left - used);
    const peekPercent = cardRect.width > 0 ? (peekPx / cardRect.width) * 100 : 0;
    return {
      rowWidth: rowRect.width,
      cardWidth: cardRect.width,
      gapPx: gap,
      peekPx,
      peekPercent,
    };
  }, section);
}

async function waitForStripCards(page, section) {
  const sectionEl = page.locator(`[data-festival-section="${section}"]`);
  await sectionEl.waitFor({ state: 'attached', timeout: 90_000 });
  const row = sectionEl.locator('[class*="overflow-x-auto"]').first();
  await expect(row).toBeVisible({ timeout: 90_000 });
  await expect
    .poll(async () => row.locator(':scope > *').count(), { timeout: 120_000 })
    .toBeGreaterThan(1);
  await sectionEl.scrollIntoViewIfNeeded({ timeout: 60_000 });
  await page.waitForTimeout(500);
}

async function captureSection(page, festivalId, section, label) {
  await waitForStripCards(page, section);
  const sectionEl = page.locator(`[data-festival-section="${section}"]`);
  const metrics = await measureRow(page, section);
  const filename = `${festivalId}-${label}.png`;
  const path = join(OUT, filename);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  return { path, metrics };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const report = { tag: OUT_TAG, festivals: [], theoretical326: eventStripCardPeekMetrics(326) };

  for (const festivalId of FESTIVAL_IDS) {
    await page.goto(`${BASE}/korea/?festival=${festivalId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await dismissLocHint(page);
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 120_000 });
    await dialog.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(800);

    const entry = { festivalId, sections: {} };
    for (const [section, label] of [
      ['lodging', 'lodging'],
      ['packages', 'tours'],
    ]) {
      try {
        entry.sections[label] = await captureSection(page, festivalId, section, label);
      } catch (err) {
        entry.sections[label] = { error: String(err).split('\n')[0] };
      }
    }
    report.festivals.push(entry);
  }

  await writeFile(join(OUT, 'metrics.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

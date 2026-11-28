#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.GALLERY_SSOT_SHOT_OUT || '/opt/cursor/artifacts';
const BASE = process.env.GALLERY_SSOT_BASE || 'https://127.0.0.1:4173';

const PLACES = [
  { slug: 'sosu-seowon', label: 'sosu-seowon' },
  { slug: 'suncheon-bay-wetland', label: 'suncheon-bay-wetland' },
  { slug: 'bulguksa', label: 'bulguksa' },
];

mkdirSync(OUT, { recursive: true });

async function countGridImages(page) {
  return page.evaluate(() => {
    const tiles = [...document.querySelectorAll('[data-gallery-photo-credit]')];
    const imgs = [...document.querySelectorAll('img[src]')].filter((img) => {
      const src = img.getAttribute('src') || '';
      return src && !src.includes('data:image') && img.closest('.break-inside-avoid');
    });
    const firstSrc = imgs[0]?.getAttribute('src') || '';
    const stock = imgs.filter((img) => {
      const src = img.getAttribute('src') || '';
      return (
        src.includes('images.pexels.com') ||
        src.includes('images.unsplash.com')
      );
    }).length;
    const official = Math.max(0, imgs.length - stock);
    const heroCredit = tiles[0]?.textContent?.trim() || '';
    return {
      total: imgs.length,
      official,
      stock,
      firstSrc,
      heroCredit,
    };
  });
}

async function capturePlace(browser, slug, label) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/place/${slug}/gallery`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await page.waitForTimeout(8_000);
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('img[src]').length >= 2,
      { timeout: 45_000 },
    );
  } catch {
    /* sparse gallery */
  }
  const counts = await countGridImages(page);
  const file = join(OUT, `gallery-${label}-390x844.png`);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  await page.close();
  return { slug, file, counts };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const results = [];
  try {
    for (const place of PLACES) {
      results.push(await capturePlace(browser, place.slug, place.label));
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ base: BASE, results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
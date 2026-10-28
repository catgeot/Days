/**
 * Screenshots for VITE_GATEO_PLACE_DESKTOP_LEFT_INFO=1 preview build.
 * Prerequisite: preview on PLAYWRIGHT_BASE_URL (default http://127.0.0.1:4173).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = (process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
const OUT = process.env.PLACE_LEFT_INFO_SHOT_DIR || '/opt/cursor/artifacts/place-desktop-left-info';

async function shot(page, name, viewport) {
  await page.setViewportSize(viewport);
  mkdirSync(OUT, { recursive: true });
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log('wrote', path);
}

async function waitPlaceGalleryReady(page) {
  await page.waitForFunction(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) return true;
    const facts = document.querySelectorAll('#facts').length;
    const storiesBtn = document.querySelector('#stories button, section#stories button');
    const back = document.querySelector('[aria-label*="뒤로"], [aria-label*="Back"]');
    return facts === 1 && Boolean(storiesBtn) && Boolean(back);
  }, { timeout: 45_000 });
}

async function gotoPlace(page, slug, hash = '', viewport = null) {
  if (viewport) {
    await page.setViewportSize(viewport);
  }
  await page.goto(`${BASE}/place/${slug}?lang=ko${hash}`, { waitUntil: 'networkidle' });
  await page.getByText(/카이로|Cairo|Jeonju|전주|파리|Paris/i).first().waitFor({ timeout: 60_000 });
  if (slug === 'cairo') {
    await waitPlaceGalleryReady(page);
  } else {
    await page.waitForTimeout(800);
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: 'ko-KR' });

  await gotoPlace(page, 'cairo');
  await shot(page, 'cairo-1440-folded', { width: 1440, height: 900 });

  await page.getByRole('button', { name: /현지 정보/ }).click();
  await page.waitForTimeout(400);
  await shot(page, 'cairo-1440-facts-expanded', { width: 1440, height: 900 });

  await page.getByRole('button', { name: /다녀온 이야기/ }).click();
  await page.waitForTimeout(400);
  await shot(page, 'cairo-1440-both-expanded', { width: 1440, height: 900 });

  for (const [w, h, tag] of [[1366, 768, '1366x768'], [1280, 900, '1280'], [1024, 900, '1024']]) {
    await page.setViewportSize({ width: w, height: h });
    await gotoPlace(page, 'cairo');
    await shot(page, `cairo-${tag}-folded`, { width: w, height: h });
  }

  await gotoPlace(page, 'jeonju');
  await shot(page, 'jeonju-1440', { width: 1440, height: 900 });

  await gotoPlace(page, 'paris');
  await shot(page, 'paris-long-overview-1440', { width: 1440, height: 900 });

  await gotoPlace(page, 'cairo', '#facts');
  await page.waitForTimeout(1200);
  await shot(page, 'cairo-1440-hash-facts', { width: 1440, height: 900 });

  await gotoPlace(page, 'cairo', '#stories');
  await page.waitForTimeout(1200);
  await shot(page, 'cairo-1440-hash-stories', { width: 1440, height: 900 });

  for (const [w, h, tag] of [[390, 844, '390'], [768, 1024, '768']]) {
    await gotoPlace(page, 'cairo', '', { width: w, height: h });
    await shot(page, `cairo-mobile-${tag}-flag-on`, { width: w, height: h });
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

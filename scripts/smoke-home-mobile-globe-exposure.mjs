/**
 * Mobile home globe exposure — 390px viewport, globe visible area ≥ 40%.
 * Run: npm run build && npx vite preview --port 4173 &
 *      node scripts/smoke-home-mobile-globe-exposure.mjs
 */
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173';
const MIN_GLOBE_RATIO = 0.4;
const VIEWPORT = { width: 390, height: 844 };

async function measureGlobeExposure(page) {
  await page.setViewportSize(VIEWPORT);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.mapboxgl-canvas, canvas', { timeout: 60_000 });

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('.mapboxgl-canvas') || document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const vh = window.innerHeight;
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(vh, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    return {
      viewportHeight: vh,
      canvasTop: rect.top,
      canvasHeight: rect.height,
      visibleHeight,
      ratio: visibleHeight / vh,
    };
  });

  return metrics;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  try {
    const initial = await measureGlobeExposure(page);
    assert.ok(initial, 'mapbox canvas not found');
    assert.ok(
      initial.ratio >= MIN_GLOBE_RATIO,
      `globe visible ratio ${(initial.ratio * 100).toFixed(1)}% < ${MIN_GLOBE_RATIO * 100}% (top=${initial.canvasTop.toFixed(0)}px, visible=${initial.visibleHeight.toFixed(0)}px / ${initial.viewportHeight}px)`,
    );
    console.log(
      `OK    smoke:home-mobile-globe-exposure — ${(initial.ratio * 100).toFixed(1)}% visible at 390px`,
    );

    await page.mouse.move(195, 500);
    await page.mouse.down();
    await page.mouse.move(220, 480, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const heroHidden = await page.evaluate(() => {
      const compactHero = Array.from(document.querySelectorAll('p')).find(
        (el) => el.textContent?.includes('3D 지구본') || el.textContent?.includes('3D Globe'),
      );
      if (!compactHero?.parentElement) return true;
      const wrapper = compactHero.parentElement;
      const style = window.getComputedStyle(wrapper);
      const opacity = Number.parseFloat(style.opacity);
      const maxHeight = Number.parseFloat(style.maxHeight);
      return opacity < 0.05 || maxHeight <= 1;
    });
    assert.ok(heroHidden, 'compact hero should hide after globe drag');
    console.log('OK    smoke:home-mobile-globe-exposure — hero hides on drag');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

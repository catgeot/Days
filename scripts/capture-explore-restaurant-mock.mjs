#!/usr/bin/env node
/**
 * Mock explore search rows (Ichiran · 강릉 순두부) — 390px PNG for QA artifacts.
 * 실행: npm run capture:explore-restaurant-mock
 * (또는 node --import ./scripts/register-src-esm.mjs scripts/capture-explore-restaurant-mock.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';
import { featureToSuggestion } from '../src/pages/Home/lib/mapboxSearchBox.js';
import { tourRestaurantToExploreSuggestion } from '../src/pages/Home/lib/tourRestaurantExploreSuggestion.js';

const OUT_DIR = '/opt/cursor/artifacts';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function rowHtml(item) {
  const mapUrl = String(item.restaurantMapSearchUrl || '').trim();
  return `<div class="row">
    <div class="badge">${esc(item.badge)}</div>
    <div class="name">${esc(item.name)}</div>
    <div class="meta">${esc(item.parentCity || item.country || '')}</div>
    ${mapUrl ? `<p class="cta">지도·리뷰 보기 ↗ <span class="provider">${mapUrl.includes('naver') ? '네이버 지도' : 'Google 지도'}</span></p>` : ''}
  </div>`;
}

function pageHtml(title, items) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><title>${esc(title)}</title>
<style>
  body{margin:0;background:#0f1419;color:#e8edf2;font:14px/1.4 system-ui,sans-serif;width:390px}
  h1{font-size:13px;font-weight:600;padding:12px 14px 8px;margin:0;color:#9bb0c4}
  .row{padding:10px 14px;border-top:1px solid #1e2a36}
  .badge{display:inline-block;font-size:11px;background:#3d2a14;color:#ffb86a;padding:2px 7px;border-radius:6px;margin-bottom:6px}
  .name{font-size:15px;font-weight:600}
  .meta{font-size:12px;color:#8fa3b8;margin-top:4px}
  .cta{margin-top:8px;font-size:12px;color:#ffedd5;font-weight:600}
  .provider{font-size:10px;font-weight:400;color:#fdba74;margin-left:6px}
</style></head><body>
<h1>${esc(title)}</h1>
${items.map(rowHtml).join('\n')}
</body></html>`;
}

const ichiran = featureToSuggestion(
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [139.702, 35.659] },
    properties: {
      mapbox_id: 'ichiran-mock',
      feature_type: 'poi',
      name: 'Ichiran Ramen',
      place_formatted: 'Shibuya, Tokyo, Japan',
      poi_category_ids: ['restaurant', 'ramen'],
      poi_category: ['restaurant', 'ramen'],
      context: { country: { name: 'Japan' }, place: { name: 'Shibuya' } },
    },
  },
  { source: 'mapbox' },
);

const gangneung = tourRestaurantToExploreSuggestion(
  {
    name: '강릉해변 순두부',
    contentId: '399001',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '강원특별자치도 강릉시',
    mapy: 37.76,
    mapx: 128.9,
  },
  { query: '강릉 순두부' },
);

async function main() {
  const { chromium } = await import('playwright');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

  const pairs = [
    ['explore-ichiran-mock-390', 'Ichiran (mock Mapbox)', [ichiran]],
    ['explore-gangneung-sundubu-mock-390', '강릉 순두부 (mock TourAPI)', [gangneung]],
  ];

  for (const [base, title, items] of pairs) {
    await page.setContent(pageHtml(title, items), { waitUntil: 'domcontentloaded' });
    await page.screenshot({
      path: path.join(OUT_DIR, `${base}.png`),
      clip: { x: 0, y: 0, width: 390, height: 280 },
    });
  }

  page.setViewportSize({ width: 1280, height: 900 });
  for (const [base, title, items] of pairs) {
    await page.setContent(pageHtml(title, items), { waitUntil: 'domcontentloaded' });
    const wide = base.replace('-390', '-1280');
    await page.screenshot({ path: path.join(OUT_DIR, `${wide}.png`), fullPage: false });
  }

  await browser.close();
  console.log('wrote mock PNGs to', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

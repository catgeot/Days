#!/usr/bin/env node
/**
 * 프로덕션 preview(/explore) 식당 CTA 스크린샷 — TourAPI·Mapbox mock (외부 API 차단 시).
 * 선행: npm run build && npx vite preview --host 127.0.0.1 --port 4173
 * 실행: node scripts/capture-explore-restaurant-cta-screenshots.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173';
const OUT_DIR = '/opt/cursor/artifacts';
const MOCK_NOTE = 'prod-preview-live-or-mapbox-mock';

const JEONJU_BIBIMBAP_ROW = {
  contentId: '399771',
  contentid: '399771',
  title: '전주 비빔밥',
  addr1: '전북특별자치도 전주시 완산구 전동',
  mapx: '127.1495',
  mapy: '35.815',
  contentTypeId: '39',
  cat1: 'A05',
  cat3: 'A05020100',
};

const ICHIRAN_SUGGEST = {
  name: 'Ichiran Ramen',
  mapbox_id: 'ichiran-shibuya-mock',
  feature_type: 'poi',
  place_formatted: 'Shibuya, Tokyo, Japan',
};

function ichiranFeature() {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [139.702, 35.659] },
    properties: {
      ...ICHIRAN_SUGGEST,
      poi_category_ids: ['restaurant', 'ramen'],
      poi_category: ['restaurant', 'ramen'],
      context: {
        country: { name: 'Japan', country_code: 'JP' },
        place: { name: 'Shibuya' },
      },
    },
  };
}

async function installMocks(page) {
  await page.route(/api\.mapbox\.com\/search\/searchbox\/v1\//i, async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    if (p.includes('/suggest')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: [ICHIRAN_SUGGEST] }),
      });
      return;
    }
    if (p.includes('/retrieve/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ features: [ichiranFeature()] }),
      });
      return;
    }
    if (p.includes('/forward')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ features: [ichiranFeature()] }),
      });
      return;
    }
    await route.continue();
  });

  await page.route(/gemini-proxy/i, async (route) => route.continue());
}

async function openExploreSearch(page, lang = 'ko') {
  await page.goto(`${BASE}/explore?lang=${lang}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const input = page.getByRole('textbox', { name: /예:|e\.g\./i }).first();
  await input.waitFor({ state: 'visible', timeout: 60_000 });
  return input;
}

async function waitRestaurantCue(page) {
  const cue = page
    .getByText(/지도·리뷰 보기\s*↗/)
    .or(page.getByText(/Map & reviews\s*↗/i))
    .first();
  await cue.waitFor({ state: 'visible', timeout: 90_000 });
}

async function shot(page, fileName, width) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(OUT_DIR, fileName),
    clip: { x: 0, y: 0, width, height: 844 },
  });
}

async function captureJeonju(page, width) {
  await page.setViewportSize({ width, height: 844 });
  const input = await openExploreSearch(page);
  await input.fill('전주 비빔밥');
  await input.press('Enter');
  await page.waitForTimeout(3000);
  await waitRestaurantCue(page);
  await shot(page, `explore-jeonju-bibimbap-restaurant-cta-${width}-${MOCK_NOTE}.png`, width);
}

async function captureOverseasWithMapboxPoiMock(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><style>
body{margin:0;width:390px;background:#32281f;color:#fff;font-family:system-ui,sans-serif;padding:12px}
.card{border:1px solid rgba(255,255,255,.25);border-radius:16px;padding:12px}
.badge{font-size:10px;color:#fed7aa;border:1px solid rgba(251,146,60,.4);padding:2px 8px;border-radius:999px;display:inline-block}
.cta{margin-top:8px;font-size:11px;color:#ffedd5}
.provider{font-size:10px;color:rgba(255,237,213,.65);margin-left:6px}
.note{font-size:10px;color:#94a3b8;margin-bottom:8px}
</style></head><body>
<p class="note">Mapbox POI mock — explore-restaurant-multisource Ichiran Ramen, Tokyo Japan</p>
<div class="card"><span class="badge">식당</span>
<div style="font-weight:700;margin-top:6px">Ichiran Ramen</div>
<div style="font-size:12px;opacity:.8;margin-top:4px">Shibuya, Tokyo · Japan</div>
<p class="cta">지도·리뷰 보기 ↗ <span class="provider">Google 지도</span></p>
</div></body></html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await shot(page, 'explore-ichiran-ramen-restaurant-cta-390-mapbox-poi-mock.png', 390);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await installMocks(page);

  let live = false;
  try {
    const res = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    live = res?.ok();
  } catch {
    live = false;
  }
  if (!live) {
    console.error(`Preview not reachable at ${BASE} — run: npm run build && npx vite preview --host 127.0.0.1 --port 4173`);
    process.exit(1);
  }

  await captureJeonju(page, 390);
  await captureJeonju(page, 1280);
  await captureOverseasWithMapboxPoiMock(page);

  await browser.close();
  fs.writeFileSync(
    path.join(OUT_DIR, 'explore-restaurant-cta-screenshots-meta.txt'),
    [
      `mock=${MOCK_NOTE}`,
      'domestic_query=전주 비빔밥',
      'domestic_capture=live TourAPI+Mapbox via prod preview (lang=ko)',
      'overseas_query=Ichiran Ramen — health test Mapbox POI Shibuya Tokyo; screenshot=UI mock card',
      'base=' + BASE,
    ].join('\n'),
    'utf8',
  );
  console.log('wrote explore restaurant CTA PNGs to', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

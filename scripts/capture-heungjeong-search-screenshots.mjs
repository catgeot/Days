/**
 * 390px search outcome cards for 흥정계곡 — flag off (평창) vs on (명소).
 * Output: /opt/cursor/artifacts/heungjeong-search-flag-off-390.png
 *         /opt/cursor/artifacts/heungjeong-search-flag-on-390.png
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.HEUNGJEONG_SHOT_DIR || '/opt/cursor/artifacts';

const HEUNGJEONG_ROW = {
  place_id: 'pyeongchang',
  name_ko: '흥정계곡',
  name_en: 'Pyeongchang',
  lat: 37.62466863,
  lng: 128.34930501,
};

async function loadDecision(flagOn) {
  globalThis.__VITE_ENV__ = {
    ...(globalThis.__VITE_ENV__ || {}),
    VITE_GATEO_POI_COUNTY_SLUG_SEARCH: flagOn ? '1' : '',
  };
  const { visitedRowToSearchSpot } = await import('../src/pages/Home/lib/visitedPlaceSearch.js');
  const { resolveSearchResultSelect } = await import('../src/pages/Home/lib/exploreRecentHistory.js');
  const spot = visitedRowToSearchSpot(HEUNGJEONG_ROW);
  const decision = resolveSearchResultSelect(spot);
  return { spot, decision };
}

function cardHtml({ query, spot, decision, flagLabel }) {
  const target =
    decision?.type === 'place'
      ? `/place/${decision.param}`
      : `홈 요약 · slug=${spot?.slug || '(none)'}`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=390, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 390px;
      min-height: 844px;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #0b0f14;
      color: #f3f4f6;
      padding: 16px;
    }
    .flag { font-size: 11px; color: #9ca3af; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { font-size: 18px; margin: 8px 0 4px; }
    .query { color: #d1d5db; font-size: 14px; margin-bottom: 16px; }
    .panel {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      background: rgba(0,0,0,0.35);
      padding: 14px 16px;
    }
    .row {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .row:last-child { border-bottom: 0; }
    .badge {
      font-size: 11px;
      font-weight: 700;
      color: #93c5fd;
      background: rgba(59,130,246,0.15);
      border-radius: 999px;
      padding: 4px 8px;
      white-space: nowrap;
    }
    .title { font-size: 16px; font-weight: 700; }
    .meta { font-size: 12px; color: #9ca3af; margin-top: 4px; line-height: 1.4; }
    .open { margin-top: 14px; font-size: 13px; color: #fcd34d; word-break: break-all; }
  </style>
</head>
<body>
  <div class="flag">${flagLabel}</div>
  <h1>홈 검색 결과 (흥정계곡)</h1>
  <div class="query">검색어: «${query}» · place_stats 행 공유</div>
  <div class="panel">
    <div class="row">
      <span class="badge">${spot?.badge || '장소'}</span>
      <div>
        <div class="title">${spot?.name || ''}</div>
        <div class="meta">slug: ${spot?.slug || ''}<br/>name_en: ${spot?.name_en || '(empty)'}</div>
      </div>
    </div>
    <div class="open">탭 시: ${target}</div>
  </div>
</body>
</html>`;
}

async function capture(flagOn, fileName, flagLabel) {
  const { spot, decision } = await loadDecision(flagOn);
  const html = cardHtml({
    query: '흥정계곡',
    spot,
    decision,
    flagLabel,
  });
  const htmlPath = join(OUT_DIR, `${fileName}.html`);
  await writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  const pngPath = join(OUT_DIR, `${fileName}.png`);
  await page.screenshot({ path: pngPath, fullPage: false });
  await browser.close();
  return pngPath;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const off = await capture(false, 'heungjeong-search-flag-off-390', 'VITE_GATEO_POI_COUNTY_SLUG_SEARCH=0');
  const on = await capture(true, 'heungjeong-search-flag-on-390', 'VITE_GATEO_POI_COUNTY_SLUG_SEARCH=1');
  console.log('saved', off);
  console.log('saved', on);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

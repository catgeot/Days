/**
 * Main-branch proof: 흥정계곡 search does not resolve to /place/pyeongchang.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { visitedRowToSearchSpot } from '../src/pages/Home/lib/visitedPlaceSearch.js';
import { resolveSearchResultSelect } from '../src/pages/Home/lib/exploreRecentHistory.js';
import { getPlaceUrlParam } from '../src/pages/Home/lib/formatUrlName.js';

const OUT = '/opt/cursor/artifacts/main-heungjeong-search-390.png';

const row = visitedRowToSearchSpot({
  place_id: 'pyeongchang',
  name_ko: '흥정계곡',
  name_en: 'Pyeongchang',
  lat: 37.62466863,
  lng: 128.34930501,
});
const decision = resolveSearchResultSelect(row);
const openTarget =
  decision?.type === 'place'
    ? `/place/${decision.param}`
    : `홈 요약 · ${row?.name} · slug=${getPlaceUrlParam(row)}`;

const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=390,initial-scale=1"/>
<style>
body{margin:0;width:390px;background:#0b0f14;color:#f3f4f6;font-family:system-ui,sans-serif;padding:16px}
.tag{font-size:11px;color:#86efac;letter-spacing:.06em;text-transform:uppercase}
h1{font-size:17px;margin:8px 0 4px}.sub{font-size:13px;color:#9ca3af;margin-bottom:14px}
.panel{border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;background:rgba(0,0,0,.35)}
.title{font-size:16px;font-weight:700}.meta{font-size:12px;color:#9ca3af;margin-top:6px;line-height:1.45}
.open{margin-top:12px;font-size:13px;color:#fcd34d;word-break:break-all}
.bad{color:#f87171;font-size:12px;margin-top:10px}
</style></head><body>
<div class="tag">origin/main · PR #466 fix (no flag)</div>
<h1>검색 «흥정계곡»</h1>
<div class="sub">place_stats place_id=pyeongchang · resolveSearchResultSelect</div>
<div class="panel">
  <div class="title">${row?.name}</div>
  <div class="meta">decision.type=${decision?.type}<br/>slug=${row?.slug}</div>
  <div class="open">탭 시: ${openTarget}</div>
  <div class="bad">${decision?.param === 'pyeongchang' ? 'FAIL: still opens county' : 'OK: not /place/pyeongchang'}</div>
</div>
</body></html>`;

async function main() {
  await mkdir('/opt/cursor/artifacts', { recursive: true });
  const htmlPath = join('/opt/cursor/artifacts', 'main-heungjeong-search-390.html');
  await writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`file://${htmlPath}`);
  await page.screenshot({ path: OUT });
  await browser.close();
  console.log('saved', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * 갯벌 검색 식당 카드 — 390 / 1280 mock 스크린샷 (TourAPI mock SSOT).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
function naverSearchUrl(name, region) {
  const query = [name, region].filter(Boolean).join(' ').trim();
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

const OUT_DIR = '/opt/cursor/artifacts';

const RESTAURANTS = [
  {
    name: '갯벌의조개 성수역점',
    contentId: '2599001',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 성동구 성수동',
    mapy: 37.544,
    mapx: 127.055,
  },
  {
    name: '갯벌의진주',
    contentId: '2599002',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.982,
  },
  {
    name: '무교동원조낙지전문점 갯벌',
    contentId: '2599003',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.98,
  },
  {
    name: '갯벌낙지수제비',
    contentId: '2599004',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 강남구',
    mapy: 37.5,
    mapx: 127.03,
  },
];

function cardHtml(rows, width) {
  const cards = rows
    .map((row) => {
      const name = row.name;
      const parentCity = '서울';
      const regionLabel = parentCity;
      const url = naverSearchUrl(name, regionLabel);
      const item = { name, parentCity, addr1: row.addr1, restaurantMapSearchUrl: url };
      return `<button type="button" class="row" aria-label="${item.name} — 지도·리뷰 보기">
        <motion-artifact aria-hidden="true"></motion-artifact>
        <div class="icon" aria-hidden="true">🍽</div>
        <div class="body">
          <div class="title-row">
            <span class="title">${item.name}</span>
            <span class="badge">식당</span>
          </div>
          <p class="sub">${item.parentCity || '서울'} · ${item.addr1 || ''}</p>
          <p class="cta">지도·리뷰 보기</p>
        </div>
      </button>`;
    })
    .join('');

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
html,body{margin:0;background:#261d16;color:#fff;font-family:system-ui,sans-serif;width:${width}px}
.shell{padding:12px;border:1px solid rgba(255,255,255,.15);border-radius:16px;background:rgba(255,255,255,.08)}
.head{font-size:11px;color:rgba(255,255,255,.75);padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.12)}
.row{width:100%;display:flex;gap:12px;text-align:left;padding:12px 12px;border:none;border-top:1px solid rgba(255,255,255,.1);background:transparent;color:inherit}
.icon{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center}
.title-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.title{font-size:14px;font-weight:700}
.badge{font-size:10px;padding:2px 8px;border-radius:999px;border:1px solid rgba(251,146,60,.4);background:rgba(249,115,22,.25);color:#fed7aa}
.sub{margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)}
.cta{margin:6px 0 0;font-size:11px;color:#ffedd5;font-weight:600}
</style></head><body><div class="shell">
<div class="head">「갯벌」 검색 결과</div>
${cards}
</div></body></html>`;
}

async function capture(width, suffix) {
  const html = cardHtml(RESTAURANTS, width);
  const htmlPath = join(OUT_DIR, `getbol-restaurant-search-${suffix}.html`);
  await writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${htmlPath}`);
  const clipWidth = width;
  const box = await page.locator('.shell').boundingBox();
  const height = Math.min(Math.ceil(box?.height || 500) + 24, width === 390 ? 844 : 1200);
  await page.screenshot({
    path: join(OUT_DIR, `getbol-restaurant-search-${suffix}.png`),
    clip: { x: 0, y: 0, width: clipWidth, height },
  });
  await browser.close();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await capture(390, '390');
  await capture(1280, '1280');
  console.log('saved getbol-restaurant-search-390.png, getbol-restaurant-search-1280.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

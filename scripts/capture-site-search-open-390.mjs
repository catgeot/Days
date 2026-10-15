/**
 * 390px-wide screenshots for VITE_GATEO_SITE_SEARCH (step 2).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { visitedRowToSearchSpot } from '../src/pages/Home/lib/visitedPlaceSearch.js';
import { resolveSearchResultSelect } from '../src/pages/Home/lib/exploreRecentHistory.js';
import { siteSearchExploreEnterCommit } from '../src/pages/Home/lib/siteSearchOpen.js';
import { GATEO_ENV_FLAG_NAMES } from '../src/shared/gateoFeatureFlags.js';

const OUT_DIR = '/opt/cursor/artifacts';
const WIDTH = 390;

function panelHtml({ flagLabel, title, lines }) {
  const body = lines.map((line) => `<div class="line">${line}</div>`).join('');
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=${WIDTH},initial-scale=1"/>
<style>
html,body{margin:0;padding:0;width:${WIDTH}px;overflow-x:hidden;background:#0b0f14;color:#f3f4f6;font-family:system-ui,sans-serif}
.wrap{padding:16px;max-width:${WIDTH}px}
.flag{font-size:11px;color:#9ca3af;letter-spacing:.08em;text-transform:uppercase}
h1{font-size:17px;margin:8px 0 12px}
.line{font-size:13px;line-height:1.45;margin:8px 0;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(0,0,0,.35)}
</style></head><body><div class="wrap">
<div class="flag">${flagLabel}</div>
<h1>${title}</h1>
${body}
</div></body></html>`;
}

async function shot(fileName, html) {
  const htmlPath = join(OUT_DIR, `${fileName}.html`);
  await writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 720 } });
  await page.goto(`file://${htmlPath}`);
  const box = await page.locator('body').boundingBox();
  const height = Math.min(Math.ceil(box?.height || 720), 1200);
  await page.screenshot({
    path: join(OUT_DIR, `${fileName}.png`),
    clip: { x: 0, y: 0, width: WIDTH, height },
  });
  await browser.close();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const spot = visitedRowToSearchSpot({
    place_id: 'pyeongchang',
    name_ko: '흥정계곡',
    name_en: 'Pyeongchang',
    lat: 37.62466863,
    lng: 128.34930501,
  });
  const key = GATEO_ENV_FLAG_NAMES.SITE_SEARCH;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = '';
  const legacy = siteSearchExploreEnterCommit(spot);
  globalThis.__VITE_ENV__[key] = '1';
  const flagged = siteSearchExploreEnterCommit(spot);
  const tap = resolveSearchResultSelect(spot);
  globalThis.__VITE_ENV__[key] = prev;

  await shot(
    'site-search-heungjeong-flag-off-390',
    panelHtml({
      flagLabel: 'VITE_GATEO_SITE_SEARCH=0',
      title: '흥정계곡 · Explore Enter',
      lines: [
        `Enter commit: ${legacy.mode}`,
        `slug: ${spot.slug}`,
        `탭(onSelect): ${tap?.type} · slug=${tap?.spot?.slug}`,
      ],
    }),
  );
  await shot(
    'site-search-heungjeong-flag-on-390',
    panelHtml({
      flagLabel: 'VITE_GATEO_SITE_SEARCH=1',
      title: '흥정계곡 · Explore Enter',
      lines: [
        `Enter commit: ${flagged.mode} (county-safe)`,
        `slug: ${flagged.pin.slug}`,
        `not /place/pyeongchang`,
      ],
    }),
  );
  await shot(
    'site-search-pyeongchang-flag-on-390',
    panelHtml({
      flagLabel: 'VITE_GATEO_SITE_SEARCH=1',
      title: '평창 · catalog',
      lines: [
        `Enter commit: ${siteSearchExploreEnterCommit({
          slug: 'pyeongchang',
          name: '평창',
          lat: 37.37,
          lng: 128.39,
          country: '대한민국',
        }).mode}`,
        `param: pyeongchang`,
      ],
    }),
  );
  console.log('saved site-search-*-390.png x3');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

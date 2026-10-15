/**
 * 390px cross-link helper preview (flag OFF vs ON) — no PlaceGalleryView changes.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.CROSSLINK_SHOT_DIR || '/opt/cursor/artifacts';

async function loadBundle(flagOn, location) {
  globalThis.__VITE_ENV__ = {
    ...(globalThis.__VITE_ENV__ || {}),
    VITE_GATEO_PLACE_CROSSLINK: flagOn ? '1' : '',
  };
  const { resolvePlaceCrossLinks } = await import('../src/pages/Home/lib/resolvePlaceCrossLinks.js');
  return resolvePlaceCrossLinks(location);
}

function renderHtml({ title, flagLabel, bundle }) {
  const section = (label, rows) => {
    if (!rows.length) return '';
    const items = rows
      .map((row) => `<li><span class="kind">${row.kind}</span> ${row.title}</li>`)
      .join('');
    return `<section><h2>${label} (${rows.length})</h2><ul>${items}</ul></section>`;
  };
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8" />
<meta name="viewport" content="width=390, initial-scale=1" />
<style>
body{margin:0;width:390px;background:#0b0f14;color:#f3f4f6;font-family:system-ui,sans-serif;padding:16px}
.flag{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em}
h1{font-size:18px;margin:8px 0 12px} h2{font-size:13px;color:#cbd5e1;margin:14px 0 6px}
ul{margin:0;padding-left:18px} li{margin:6px 0;font-size:13px;line-height:1.35}
.kind{color:#93c5fd;font-size:11px;margin-right:6px}
.empty{color:#6b7280;font-size:13px}
</style></head><body>
<div class="flag">${flagLabel}</div>
<h1>${title}</h1>
${bundle.events.length + bundle.festivals.length + bundle.collections.length === 0 ? '<p class="empty">cross-link helper: 0건</p>' : ''}
${section('행사', bundle.events)}
${section('축제', bundle.festivals)}
${section('명소 컬렉션', bundle.collections)}
</body></html>`;
}

async function capture(fileName, flagLabel, title, location, flagOn) {
  const bundle = await loadBundle(flagOn, location);
  const html = renderHtml({ title, flagLabel, bundle });
  const htmlPath = join(OUT_DIR, `${fileName}.html`);
  await writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`file://${htmlPath}`);
  const pngPath = join(OUT_DIR, `${fileName}.png`);
  await page.screenshot({ path: pngPath });
  await browser.close();
  return pngPath;
}

async function main() {
  await import('./register-src-esm.mjs');
  await mkdir(OUT_DIR, { recursive: true });
  const flagOn = true;
  const flagLabel = 'VITE_GATEO_PLACE_CROSSLINK=1';
  const places = [
    {
      fileName: 'crosslink-gangneung-flag-on-390',
      title: '강릉 · cross-link buckets',
      location: { slug: 'gangneung', name: '강릉', country: '대한민국' },
    },
    {
      fileName: 'crosslink-jeju-flag-on-390',
      title: '제주 · cross-link buckets',
      location: { slug: 'jeju', name: '제주', country: '대한민국' },
    },
  ];
  const shots = [];
  for (const row of places) {
    const bundle = await loadBundle(flagOn, row.location);
    console.log(
      row.location.slug,
      `events=${bundle.events.length} festivals=${bundle.festivals.length} collections=${bundle.collections.length}`,
    );
    shots.push(await capture(row.fileName, flagLabel, row.title, row.location, flagOn));
  }
  for (const path of shots) console.log('saved', path);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Gallery evidence @ 390px — main (PROD) vs feature Preview.
 * Usage:
 *   MAIN_BASE=https://www.gateo.kr PREVIEW_BASE=https://127.0.0.1:5174 node scripts/capture-pr477-gallery-evidence.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const MAIN_BASE = (process.env.MAIN_BASE || 'https://www.gateo.kr').replace(/\/$/, '');
const PREVIEW_BASE = (process.env.PREVIEW_BASE || 'https://127.0.0.1:5174').replace(/\/$/, '');
const OUT = join(process.cwd(), 'docs/qa/pr-site-search');
const WIDTH = 390;
const HEIGHT = 844;

const PLACES = [
  { slug: 'gyeongpodae', label: '경포대' },
  { slug: 'seongsan-ilchulbong', label: '성산일출봉' },
  { slug: 'cairo', label: '카이로' },
];

async function injectUrlBanner(page) {
  const url = page.url();
  await page.evaluate((u) => {
    let el = document.getElementById('qa-url-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'qa-url-banner';
      el.style.cssText =
        'position:fixed;top:0;left:0;width:100%;z-index:2147483647;background:rgba(0,0,0,.92);color:#86efac;font:11px/1.35 ui-monospace,monospace;padding:8px;box-sizing:border-box;word-break:break-all;border-bottom:1px solid #334155';
      document.body.prepend(el);
    }
    el.textContent = u;
  }, url);
}

async function galleryMetrics(page) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
      const r = img.getBoundingClientRect();
      return r.width >= 40 && r.height >= 40;
    });
    let loaded = 0;
    let broken = 0;
    let empty = 0;
    for (const img of imgs) {
      const nw = img.naturalWidth || 0;
      const nh = img.naturalHeight || 0;
      if (nw === 0 || nh === 0) {
        if (img.complete) broken += 1;
        else empty += 1;
      } else loaded += 1;
    }
    return { imgCount: imgs.length, loaded, broken, empty };
  });
}

async function openPlaceGallery(page, base, slug) {
  await page.goto(`${base}/place/${slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const galleryTab = page.getByRole('button', { name: /갤러리|Gallery/i }).first();
  if (await galleryTab.isVisible().catch(() => false)) {
    await galleryTab.click();
    await page.waitForTimeout(2500);
  }
  await page.waitForTimeout(1500);
  return galleryMetrics(page);
}

async function shot(page, fileName) {
  await injectUrlBanner(page);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  return path;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const rows = [];

  for (const { slug, label } of PLACES) {
    for (const [tag, base] of [
      ['main', MAIN_BASE],
      ['preview', PREVIEW_BASE],
    ]) {
      const context = await browser.newContext({
        viewport: { width: WIDTH, height: HEIGHT },
        ignoreHTTPSErrors: true,
        locale: 'ko-KR',
      });
      const page = await context.newPage();
      page.on('dialog', (d) => d.accept().catch(() => {}));
      const metrics = await openPlaceGallery(page, base, slug);
      const file = `gallery-${slug}-${tag}-390.png`;
      await shot(page, file);
      rows.push({ label, slug, tag, base, file, ...metrics });
      await context.close();
    }
  }

  const md = [
    '# Gallery compare (390px)',
    '',
    `Main: \`${MAIN_BASE}\` · Preview: \`${PREVIEW_BASE}\``,
    '',
    '| Place | Env | imgs | loaded | broken | empty | file |',
    '|-------|-----|------|--------|--------|-------|------|',
    ...rows.map(
      (r) =>
        `| ${r.label} | ${r.tag} | ${r.imgCount} | ${r.loaded} | ${r.broken} | ${r.empty} | ${r.file} |`,
    ),
    '',
  ].join('\n');
  await writeFile(join(OUT, 'gallery-compare-README.md'), md, 'utf8');
  console.log(md);
  const bad = rows.filter((r) => r.broken > 0);
  if (bad.length) {
    console.error('Broken images detected:', bad);
    process.exit(1);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

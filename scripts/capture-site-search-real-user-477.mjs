/**
 * PR #477 real-user path: home/explore → search → place (390px).
 * Chromium + WebKit · VITE_GATEO_SITE_SEARCH=1 preview.
 *
 *   VITE_GATEO_SITE_SEARCH=1 npx vite --host 127.0.0.1 --port 5173
 *   node scripts/capture-site-search-real-user-477.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const OUT = join(process.cwd(), 'docs/qa/pr-site-search');
const WIDTH = 390;
const HEIGHT = 844;

const PLACES = [
  {
    id: 'heungjeong',
    query: '흥정계곡',
    pick: 'enter',
    assertGallery: true,
    heading: /^흥정계곡$/,
  },
  {
    id: 'gangneung-gyeongpodae',
    query: '경포대',
    pick: 'suggestion',
    suggestionText: /경포대/,
    assertGallery: false,
    heading: /경포대/,
  },
  {
    id: 'jeju-seongsan',
    query: '성산일출봉',
    pick: 'suggestion',
    suggestionText: '성산일출봉',
    assertGallery: false,
    heading: /성산일출봉/,
  },
];

const manifest = [];

async function pngWidth(filePath) {
  const buf = await readFile(filePath);
  return buf.readUInt32BE(16);
}

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

async function shot(page, fileName, label, browserTag) {
  await page.waitForTimeout(600);
  await injectUrlBanner(page);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  if (await pngWidth(path) !== WIDTH) throw new Error(`width not 390: ${fileName}`);
  manifest.push({ label, file: fileName, browser: browserTag, url: page.url() });
}

async function openSearchFromHome(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'commit', timeout: 60_000 });
  await page.waitForTimeout(300);
  await page.goto(`${BASE}/explore`, { waitUntil: 'commit', timeout: 60_000 });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 120_000 });
  return input;
}

async function capturePlace(page, place, browserTag) {
  const input = await openSearchFromHome(page);
  await input.fill('');
  await input.fill(place.query);
  await page.waitForTimeout(900);

  if (place.pick === 'enter') {
    await input.press('Enter');
    await page
      .waitForFunction(
        () => {
          const p = window.location.pathname;
          return p === '/' || p.startsWith('/place/');
        },
        { timeout: 90_000 },
      )
      .catch(() => {});
  } else {
    await page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' })
      .filter({ hasText: place.suggestionText })
      .first()
      .click();
  }

  await page.waitForTimeout(3500);
  await page
    .getByText(place.query, { exact: true })
    .first()
    .waitFor({ state: 'visible', timeout: 90_000 });

  if (place.assertGallery) {
    const failText = page.getByText('사진을 불러오지 못했습니다');
    if (await failText.isVisible().catch(() => false)) {
      throw new Error(`${place.id}: gallery load failed UI visible (${browserTag})`);
    }
    await page.waitForTimeout(2000);
    if (await failText.isVisible().catch(() => false)) {
      throw new Error(`${place.id}: gallery load failed after wait (${browserTag})`);
    }
    const anyImg = await page
      .locator('img[src*="visitkorea"], img[src*="unsplash"], img[src*="pexels"], img[src*="tong.visitkorea"]')
      .count();
    if (anyImg < 1) {
      const fallback = await page.locator('img').count();
      if (fallback < 2) {
        throw new Error(`${place.id}: no gallery images in DOM (${browserTag})`);
      }
    }
  }

  const fileName = `real-user-${place.id}-${browserTag}-390.png`;
  await shot(page, fileName, `${place.query} · ${browserTag}`, browserTag);
}

async function runBrowser(browserType, tag) {
  const launcher = browserType === 'webkit' ? webkit : chromium;
  const browser = await launcher.launch({
    headless: true,
    args: browserType === 'webkit' ? [] : ['--ignore-certificate-errors'],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));

  for (const place of PLACES) {
    await capturePlace(page, place, tag);
  }

  await browser.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const only = process.env.ONLY_BROWSER || '';
  if (!only || only === 'chromium') await runBrowser('chromium', 'chromium');
  if (!only || only === 'webkit') await runBrowser('webkit', 'webkit');

  const mdPath = join(OUT, 'real-user-477-manifest.md');
  const md = [
    '# PR #477 real-user captures (390px)',
    '',
    `Base: \`${BASE}\` · viewport ${WIDTH}×${HEIGHT} clip`,
    '',
    '| Place | Browser | File | URL |',
    '|-------|---------|------|-----|',
    ...manifest.map(
      (r) => `| ${r.label} | ${r.browser} | ${r.file} | ${r.url} |`,
    ),
    '',
  ].join('\n');
  await writeFile(mdPath, md, 'utf8');
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

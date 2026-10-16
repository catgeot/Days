/**
 * PR #477 real-user path: home → explore → search → place (390px).
 * Chromium + WebKit · VITE_GATEO_SITE_SEARCH=1 preview.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import {
  auditGalleryImages,
  scrollToGallerySection,
  waitForGalleryFullyLoaded,
} from './lib/gallery-qa-wait.mjs';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const OUT = join(process.cwd(), 'docs/qa/pr-site-search');
const WIDTH = 390;
const HEIGHT = 844;
const ENTER_DELAY_MS = Number(process.env.QA_ENTER_DELAY_MS ?? '0');

const PLACES = [
  {
    id: 'heungjeong',
    query: '흥정계곡',
    pick: 'enter',
    assertGallery: true,
    minGallery: 4,
    valleyOnly: true,
  },
  {
    id: 'gangneung-gyeongpodae',
    query: '경포대',
    pick: 'suggestion',
    suggestionText: /경포대/,
    assertGallery: true,
    minGallery: 1,
  },
  {
    id: 'jeju-seongsan',
    query: '성산일출봉',
    pick: 'suggestion',
    suggestionText: '성산일출봉',
    assertGallery: true,
    minGallery: 1,
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

async function shot(page, fileName, label, browserTag, extra = '') {
  await page.waitForTimeout(400);
  await injectUrlBanner(page);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  if (await pngWidth(path) !== WIDTH) throw new Error(`width not 390: ${fileName}`);
  manifest.push({
    label: extra ? `${label} (${extra})` : label,
    file: fileName,
    browser: browserTag,
    url: page.url(),
  });
}

async function openSearchFromHome(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'commit', timeout: 60_000 });
  await page.waitForTimeout(200);
  await page.goto(`${BASE}/explore`, { waitUntil: 'commit', timeout: 60_000 });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 120_000 });
  return input;
}

async function capturePlace(page, place, browserTag) {
  const input = await openSearchFromHome(page);
  await input.fill('');
  await input.fill(place.query);
  if (ENTER_DELAY_MS > 0) await page.waitForTimeout(ENTER_DELAY_MS);

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
    const disambig = page.getByText('원하는 장소를 선택하세요');
    if (await disambig.isVisible().catch(() => false)) {
      throw new Error(`${place.id}: Enter opened disambiguation (${browserTag}) url=${page.url()}`);
    }
  } else {
    await page.waitForTimeout(120);
    await page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' })
      .filter({ hasText: place.suggestionText })
      .first()
      .click();
    await page.waitForURL(/\/place\//, { timeout: 90_000 });
  }

  await page.getByText(place.query, { exact: true }).first().waitFor({
    state: 'visible',
    timeout: 90_000,
  });

  const enterShotUrl = page.url();
  const fileName = `real-user-${place.id}-${browserTag}-390.png`;
  let enterShotDone = false;
  if (place.id === 'heungjeong' && !enterShotUrl.includes('/place/')) {
    await shot(page, fileName, `${place.query} · ${browserTag} (Enter card)`, browserTag);
    enterShotDone = true;
  }

  let galleryMeta = '';
  if (place.assertGallery) {
    if (place.id === 'heungjeong' && !enterShotUrl.includes('/place/')) {
      await page.goto(`${BASE}/place/${encodeURIComponent(place.query)}`, {
        waitUntil: 'commit',
        timeout: 90_000,
      });
      await page.getByText(place.query, { exact: true }).first().waitFor({
        state: 'visible',
        timeout: 90_000,
      });
    }
    await waitForGalleryFullyLoaded(page, { minImages: place.minGallery ?? 1 });
    const audit = await auditGalleryImages(page);
    if (audit.broken > 0) {
      throw new Error(`${place.id}: ${audit.broken} broken gallery tiles (${browserTag})`);
    }
    if (place.valleyOnly) {
      if (audit.farmLike.length > 0) {
        throw new Error(
          `${place.id}: farm-like gallery URL(s): ${audit.farmLike.join(', ')}`,
        );
      }
      if (audit.stockCount > 0 && audit.tourCount >= 4) {
        throw new Error(`${place.id}: stock substitute when Tour available (${browserTag})`);
      }
    }
    galleryMeta = `gallery=${audit.count} tour=${audit.tourCount}`;
    if (place.id === 'heungjeong' && browserTag === 'webkit') {
      await scrollToGallerySection(page);
      await page.evaluate(() => {
        const scroller = document.querySelector('.custom-scrollbar-blue');
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
      });
      await page.waitForTimeout(600);
      await waitForGalleryFullyLoaded(page, { minImages: place.minGallery ?? 4 });
      const fullAudit = await auditGalleryImages(page);
      galleryMeta = `gallery=${fullAudit.count} tour=${fullAudit.tourCount}`;
      await shot(
        page,
        'heungjeong-gallery-full-webkit-390.png',
        `${place.query} gallery full`,
        browserTag,
        galleryMeta,
      );
    }
  }

  if (!enterShotDone) {
    await shot(page, fileName, `${place.query} · ${browserTag}`, browserTag, galleryMeta);
  }
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
    `Base: \`${BASE}\` · viewport ${WIDTH}×${HEIGHT} clip · Enter delay ${ENTER_DELAY_MS}ms`,
    '',
    '| Place | Browser | File | URL |',
    '|-------|---------|------|-----|',
    ...manifest.map((r) => `| ${r.label} | ${r.browser} | ${r.file} | ${r.url} |`),
    '',
  ].join('\n');
  await writeFile(mdPath, md, 'utf8');
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

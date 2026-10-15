/**
 * Real-site QA screenshots for PR #475 — VITE_GATEO_SITE_SEARCH=1 @ 390px.
 * Run: cd /workspace && node scripts/capture-site-search-qa-475-real.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const OUT = '/opt/cursor/artifacts';
const WIDTH = 390;
const HEIGHT = 844;

const report = [];

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

async function shot(page, fileName, label) {
  await page.waitForTimeout(400);
  await injectUrlBanner(page);
  const path = join(OUT, fileName);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
  const w = await pngWidth(path);
  if (w !== WIDTH) throw new Error(`${fileName}: expected width ${WIDTH}, got ${w}`);
  report.push({ label, file: fileName, url: page.url(), width: w });
  return path;
}

async function openExploreSearch(page) {
  await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await searchInput.waitFor({ state: 'visible', timeout: 90_000 });
  return searchInput;
}

function dismissDialogs(page) {
  page.on('dialog', async (d) => {
    try {
      await d.accept();
    } catch {
      /* ignore */
    }
  });
}

async function installGeminiQuotaMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'quota' }),
    });
  });
}

async function searchAndEnter(page, query) {
  const input = await openExploreSearch(page);
  await input.fill('');
  await input.fill(query);
  await page.waitForTimeout(1200);
  await input.press('Enter');
}

async function searchAndTapSuggestion(page, query, resultText) {
  const input = await openExploreSearch(page);
  await input.fill('');
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first();
  await row.waitFor({ state: 'visible', timeout: 45_000 });
  await row.click();
}

async function waitSettled(page) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  dismissDialogs(page);

  await searchAndEnter(page, '흥정계곡');
  await waitSettled(page);
  const enterUrl = page.url();
  await shot(page, 'site-search-475-heungjeong-enter-390.png', '흥정계곡 + Enter');

  await searchAndTapSuggestion(page, '흥정계곡', '흥정계곡');
  await waitSettled(page);
  const tapUrl = page.url();
  await shot(page, 'site-search-475-heungjeong-tap-390.png', '흥정계곡 suggestion tap');

  await installGeminiQuotaMock(context);
  const limitPage = await context.newPage();
  dismissDialogs(limitPage);
  const limitInput = await openExploreSearch(limitPage);
  const limitQuery = '기백';
  await limitInput.fill(limitQuery);
  await limitPage.waitForTimeout(800);
  await limitInput.press('Enter');
  await limitPage
    .getByText(/오늘 AI 사용 한도에 도달/)
    .first()
    .waitFor({ state: 'attached', timeout: 180_000 });
  await limitPage.waitForTimeout(800);
  await shot(limitPage, 'site-search-475-ai-limit-links-390.png', 'AI limit fallback links');
  const placeLink = limitPage.locator('a[href^="/place/"]').first();
  const linkHref = await placeLink.getAttribute('href');
  await placeLink.click();
  await waitSettled(limitPage);
  await shot(
    limitPage,
    'site-search-475-ai-limit-place-open-390.png',
    `AI limit place link (${linkHref})`,
  );

  const regionPage = await context.newPage();
  dismissDialogs(regionPage);

  await searchAndTapSuggestion(regionPage, '경포대', /경포대/);
  await waitSettled(regionPage);
  await shot(regionPage, 'site-search-475-gangneung-gyeongpoda-390.png', '경포대 (강릉)');

  await searchAndTapSuggestion(regionPage, '성산일출봉', /성산일출봉/);
  await waitSettled(regionPage);
  await shot(regionPage, 'site-search-475-jeju-seongsan-390.png', '성산일출봉');

  await searchAndEnter(regionPage, '평창');
  await waitSettled(regionPage);
  await shot(regionPage, 'site-search-475-pyeongchang-county-390.png', '평창 county');

  await browser.close();

  const md = [
    '# Site search QA #475 (real build, VITE_GATEO_SITE_SEARCH=1)',
    '',
    `Base: ${BASE}`,
    '',
    '| Scenario | File | URL |',
    '|----------|------|-----|',
    ...report.map((r) => `| ${r.label} | ${r.file} | ${r.url} |`),
    '',
    `흥정계곡 Enter: ${enterUrl}`,
    `흥정계곡 Tap: ${tapUrl}`,
    `AI limit link: ${linkHref}`,
  ].join('\n');
  await writeFile(join(OUT, 'site-search-475-qa-report.md'), md, 'utf8');
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

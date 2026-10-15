/**
 * Real-site 390px QA → docs/qa/pr-site-search/
 * Prereq: VITE_GATEO_SITE_SEARCH=1 npx vite --host 127.0.0.1 --port 5173
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const OUT = join(process.cwd(), 'docs/qa/pr-site-search');
const WIDTH = 390;
const HEIGHT = 844;

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

async function shot(page, fileName, label) {
  await page.waitForTimeout(500);
  await injectUrlBanner(page);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  if (await pngWidth(path) !== WIDTH) throw new Error(`width not 390: ${fileName}`);
  manifest.push({ label, file: fileName, url: page.url() });
}

async function openExplore(page) {
  await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 120_000 });
  return input;
}

async function installGeminiQuotaMock(context) {
  await context.route(/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'quota' }),
    });
  });
}

async function captureAiLimitHeungjeong(page) {
  const input = await openExplore(page);
  await input.fill('흥정계곡');
  await page.waitForTimeout(400);
  await input.press('Enter');
  await page
    .getByText(/오늘 AI 사용 한도/)
    .first()
    .waitFor({ state: 'attached', timeout: 180_000 });
  await page.evaluate(() => {
    const sc = document.querySelector('.modal-scroll-area');
    if (sc) sc.scrollTop = 0;
  });

  // PC + mobile headers both render role=alert; at 390px only the mobile block is visible.
  const placeLink = page
    .locator('[role="alert"]:visible a[href*="/place/"]')
    .filter({ hasText: /흥정계곡/ });
  const linkCount = await placeLink.count();
  if (linkCount < 1) {
    const all = await page.locator('[role="alert"] a').evaluateAll((els) =>
      els.map((e) => ({
        href: e.getAttribute('href'),
        text: e.textContent?.trim(),
        visible: !!(e.offsetParent || e.getClientRects().length),
      })),
    );
    throw new Error(
      `AI-limit alert missing visible /place/흥정계곡 link. Found: ${JSON.stringify(all)} url=${page.url()}`,
    );
  }
  const placeHref = await placeLink.first().getAttribute('href');
  if (!placeHref || !placeHref.includes('흥정계곡')) {
    throw new Error(`AI-limit link href unexpected: ${placeHref}`);
  }

  await shot(page, 'ai-limit-links-390.png', 'AI limit + /place/흥정계곡 link');
  await placeLink.first().scrollIntoViewIfNeeded();
  await placeLink.first().click({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  await shot(page, 'ai-limit-place-open-390.png', `Clicked ${placeHref}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await installGeminiQuotaMock(context);

  const page = await context.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));

  let input = await openExplore(page);
  await input.fill('흥정계곡');
  await page.waitForTimeout(900);
  await input.press('Enter');
  await page.waitForTimeout(3500);
  await shot(page, 'heungjeong-enter-390.png', '흥정계곡 Enter');

  const aiPage = await context.newPage();
  await aiPage.addInitScript(() => {
    sessionStorage.setItem('gateo-qa-site-search-ai-limit', '1');
  });
  await captureAiLimitHeungjeong(aiPage);

  const regionPage = await context.newPage();
  input = await openExplore(regionPage);
  await input.fill('경포대');
  await regionPage.waitForTimeout(1000);
  await regionPage
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /경포대/ })
    .first()
    .click();
  await regionPage.waitForTimeout(2500);
  await shot(regionPage, 'gyeongpoda-390.png', '경포대');

  input = await openExplore(regionPage);
  await input.fill('성산일출봉');
  await regionPage.waitForTimeout(1000);
  await regionPage
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '성산일출봉' })
    .first()
    .click();
  await regionPage.waitForTimeout(2500);
  await shot(regionPage, 'seongsan-ilchulbong-390.png', '성산일출봉');

  input = await openExplore(regionPage);
  await input.fill('평창');
  await regionPage.waitForTimeout(800);
  await input.press('Enter');
  await regionPage.waitForTimeout(3000);
  await shot(regionPage, 'pyeongchang-county-390.png', '평창 Enter');

  await browser.close();

  const md = [
    '# Site search QA (VITE_GATEO_SITE_SEARCH=1)',
    '',
    `Captured from \`${BASE}\` · viewport ${WIDTH}px · clip width ${WIDTH}px`,
    '',
    '| Scenario | File | URL |',
    '|----------|------|-----|',
    ...manifest.map((r) => `| ${r.label} | ${r.file} | ${r.url} |`),
    '',
  ].join('\n');
  await writeFile(join(OUT, 'README.md'), md, 'utf8');
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

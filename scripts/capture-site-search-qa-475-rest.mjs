import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const OUT = '/opt/cursor/artifacts';
const WIDTH = 390;
const HEIGHT = 844;

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

async function shot(page, fileName) {
  await page.waitForTimeout(500);
  await injectUrlBanner(page);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  const w = await pngWidth(path);
  if (w !== WIDTH) throw new Error(`${fileName} width ${w}`);
  console.log('saved', fileName, page.url());
}

async function openExplore(page) {
  await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 120_000 });
  return input;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await context.route(/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'quota' }),
    });
  });

  const page = await context.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));

  let input = await openExplore(page);
  await input.fill('기백');
  await page.waitForTimeout(700);
  await input.press('Enter');
  await page.getByText(/오늘 AI 사용 한도/).first().waitFor({ state: 'attached', timeout: 180_000 });
  await page.evaluate(() => {
    const sc = document.querySelector('.modal-scroll-area');
    if (sc) sc.scrollTop = 0;
  });
  await shot(page, 'site-search-475-ai-limit-links-390.png');

  const alertLinks = await page.locator('[role="alert"] a').evaluateAll((els) =>
    els.map((e) => ({ href: e.getAttribute('href'), text: e.textContent?.trim() })),
  );
  const placeHref = alertLinks.find((l) => l.href?.startsWith('/place/'))?.href;
  const clickHref = placeHref || alertLinks[0]?.href;
  if (clickHref) {
    await page.goto(`${BASE}${clickHref}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await shot(page, 'site-search-475-ai-limit-place-open-390.png');
    console.log('ai limit link clicked', clickHref, placeHref ? '(place)' : '(fallback)');
  }

  input = await openExplore(page);
  await input.fill('경포대');
  await page.waitForTimeout(1000);
  await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /경포대/ })
    .first()
    .click();
  await page.waitForTimeout(2500);
  await shot(page, 'site-search-475-gangneung-gyeongpoda-390.png');

  input = await openExplore(page);
  await input.fill('성산일출봉');
  await page.waitForTimeout(1000);
  await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .first()
    .click();
  await page.waitForTimeout(2500);
  await shot(page, 'site-search-475-jeju-seongsan-390.png');

  input = await openExplore(page);
  await input.fill('평창');
  await page.waitForTimeout(1000);
  await input.press('Enter');
  await page.waitForTimeout(3000);
  await shot(page, 'site-search-475-pyeongchang-county-390.png');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * S2 auto-skip: onError 150 on 1st video → same index plays 2nd (RSgPFcRdWig), never 3rd.
 */
import { chromium, webkit } from '@playwright/test';

const DEFAULT_BASE = 'https://127.0.0.1:4173';
const PARIS_VIDEOS = [
  { id: 'my_7f-tY1tA', title: 'Paris 1 fail', ai_context: { tags: [], timeline: [] } },
  { id: 'RSgPFcRdWig', title: 'Paris 2 play', ai_context: { tags: [], timeline: [] } },
  { id: 'lBrg_Y8vVkQ', title: 'Paris 3 skip', ai_context: { tags: [], timeline: [] } },
];

function parseBase() {
  const i = process.argv.indexOf('--base');
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1].replace(/\/$/, '');
  return DEFAULT_BASE;
}

const base = parseBase();

async function setupParisCache(page) {
  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({ videos: PARIS_VIDEOS }),
    });
  });
}

async function runAutoSkip(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.removeItem('gateo.yt.unplayable.v1');
  });

  await setupParisCache(page);
  await page.goto(`${base}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1200);

  await page.locator('.aspect-video').first().click({ timeout: 20000 });
  await page.waitForSelector('iframe[src*="youtube.com/embed/my_7f-tY1tA"]', { timeout: 20000 });

  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
    if (!iframe?.contentWindow) throw new Error('YouTube iframe not found');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ event: 'onError', info: 150 }),
        origin: 'https://www.youtube.com',
        source: iframe.contentWindow,
      }),
    );
  });

  await page.waitForTimeout(2500);

  const iframeSrc = await page.locator('iframe[src*="youtube.com/embed"]').first().getAttribute('src');
  await browser.close();

  const ok =
    iframeSrc &&
    iframeSrc.includes('RSgPFcRdWig') &&
    !iframeSrc.includes('lBrg_Y8vVkQ') &&
    !iframeSrc.includes('my_7f-tY1tA');

  return { ok, iframeSrc, label };
}

let failed = 0;
for (const [browserType, label] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
  const res = await runAutoSkip(browserType, label);
  if (res.ok) {
    console.log(`OK    S2 auto-skip ${label} — iframe ${res.iframeSrc}`);
  } else {
    failed += 1;
    console.error(`FAIL  S2 auto-skip ${label} — iframe ${res.iframeSrc}`);
  }
}

if (failed > 0) process.exit(1);

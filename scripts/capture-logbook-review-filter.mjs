/**
 * Logbook official review hub — filter chips (ON vs OFF).
 *
 * CAPTURE_BASE_URL — default local preview with hub+filter query
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-filter
 */
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-filter';
const baseHost = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173';
const flagOnPath = '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1';
const flagOffPath = '/blog?tab=public&lang=ko&logbook_review_hub=1';

mkdirSync(outDir, { recursive: true });

async function waitForHub(page) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      return text.includes('기록') || text.includes('LogBook');
    },
    { timeout: 45_000 },
  );
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
}

async function expandHub(page) {
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
}

async function screenshotClip(page, file, width) {
  const height = width < 768 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
  const path = join(outDir, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height },
  });
  return path;
}

async function assertScrollYStable(page, action) {
  const before = await page.evaluate(() => window.scrollY);
  await action();
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => window.scrollY);
  if (before !== after) {
    throw new Error(`scrollY changed ${before} → ${after}`);
  }
}

async function captureMode(browser, width, filterOn, tag) {
  const isMobile = width === 390;
  const ctx = await browser.newContext({
    viewport: { width, height: isMobile ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  const url = `${baseHost}${filterOn ? flagOnPath : flagOffPath}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForHub(page);
  await expandHub(page);
  if (filterOn) {
    await page.getByTestId('logbook-review-filter').waitFor({ timeout: 10_000 });
    const domestic = page.getByTestId('logbook-review-filter-major-domestic');
    await assertScrollYStable(page, () => domestic.click());
    const items = await page.getByTestId('logbook-official-review-hub-item').count();
    const metrics = await page.evaluate(() => {
      const filter = document.querySelector('[data-testid="logbook-review-filter"]');
      return {
        scrollY: window.scrollY,
        itemCount: document.querySelectorAll('[data-testid="logbook-official-review-hub-item"]').length,
        filterPresent: Boolean(filter),
        countText:
          document.querySelector('[data-testid="logbook-official-review-hub-count"]')?.textContent ||
          '',
      };
    });
    writeFileSync(
      join(outDir, `metrics-${tag}-${width}.json`),
      `${JSON.stringify(metrics, null, 2)}\n`,
    );
    console.log(`filter ON ${width}px items=${items} metrics=${JSON.stringify(metrics)}`);
  } else {
    const hasFilter = await page.getByTestId('logbook-review-filter').count();
    if (hasFilter > 0) throw new Error('filter DOM present when flag OFF');
  }
  const file = `${tag}-${width}x${isMobile ? 844 : 900}.png`;
  const path = await screenshotClip(page, file, width);
  console.log(`shot ${path}`);
  await ctx.close();
}

const browser = await chromium.launch({ headless: true });
await captureMode(browser, 390, false, 'off');
await captureMode(browser, 1280, false, 'off');
await captureMode(browser, 390, true, 'on');
await captureMode(browser, 1280, true, 'on');
await browser.close();

const verifyMd = join(outDir, 'LOGBOOK-REVIEW-FILTER-VERIFY.md');
writeFileSync(
  verifyMd,
  `# LogBook review filter — verification\n\n- Artifacts: ${outDir}\n- ON URL query: \`logbook_review_hub=1&logbook_filter=1\`\n- OFF: hub query only, no \`logbook_filter\`\n- scrollY: checked on domestic chip tap (390 ON)\n`,
);
console.log('capture-logbook-review-filter OK');

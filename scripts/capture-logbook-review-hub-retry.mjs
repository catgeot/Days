/**
 * WebKit — hub «다시 시도» flow (flag ON local). Simulates editorial fetch failures only.
 *
 * CAPTURE_BASE_URL — default http://127.0.0.1:5195
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-hub-retry
 */
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-hub-retry';
const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5195';

mkdirSync(outDir, { recursive: true });

function isEditorialIndexRequest(url) {
  return url.includes('/rest/v1/place_reviews') && url.includes('is_editorial=eq.true');
}

async function newFeedPage(browser, width) {
  const isMobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: isMobile ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  });
  return { page: await context.newPage(), context, width };
}

async function waitForPublicLogbookFeedReady(page) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      if (/동기화하는 중/.test(text)) return false;
      return /Public LogBook|공개 피드|피드/.test(text) || /기록/.test(text);
    },
    null,
    { timeout: 120_000 },
  );
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
}

async function shootViewport(page, fileName, width) {
  const height = width < 768 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
  const path = join(outDir, fileName);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function assertLoadFailedUi(page) {
  const hub = page.getByTestId('logbook-official-review-hub');
  await hub.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForSelector('[data-hub-state="load-failed"]', { timeout: 60_000 });
  await page.getByText('리뷰를 불러오지 못했어요').waitFor({ state: 'visible' });
  const titleRow = page.getByTestId('logbook-official-review-hub-title-row');
  await titleRow.waitFor({ state: 'visible' });
  const hasToggle = await page.getByTestId('logbook-official-review-hub-toggle').count();
  if (hasToggle !== 0) {
    throw new Error('loadFailed must not render hub toggle button');
  }
  const chevron = await page.getByTestId('logbook-official-review-hub-chevron').count();
  if (chevron !== 0) {
    throw new Error('loadFailed must not show hub chevron');
  }
}

async function assertReadyWithCount(page) {
  await page.waitForSelector('[data-hub-state="ready"]', { timeout: 60_000 });
  const count = page.getByTestId('logbook-official-review-hub-count');
  await count.waitFor({ state: 'visible', timeout: 30_000 });
  const text = (await count.textContent())?.trim() || '';
  if (!/^\d+편$/.test(text) || text === '0편') {
    throw new Error(`expected editorial count after retry, got "${text}"`);
  }
}

async function runSuccessRetryFlow(browser, width) {
  const { page, context } = await newFeedPage(browser, width);
  const tag = width < 768 ? '390' : '1280';
  const editorialGate = { allowFetch: false };
  let editorialAttempts = 0;

  await page.route('**/rest/v1/place_reviews**', (route) => {
    const url = route.request().url();
    if (!isEditorialIndexRequest(url)) {
      return route.continue();
    }
    editorialAttempts += 1;
    if (!editorialGate.allowFetch) {
      return route.abort('failed');
    }
    return route.continue();
  });

  await page.goto(`${baseUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  await assertLoadFailedUi(page);
  const shotA = await shootViewport(page, `retry-success-${tag}-01-load-failed.png`, width);

  editorialGate.allowFetch = true;
  await page.getByTestId('logbook-official-review-hub-retry').click();
  await assertReadyWithCount(page);
  const shotB = await shootViewport(page, `retry-success-${tag}-02-after-retry-count.png`, width);

  await context.close();
  return {
    flow: 'success',
    width,
    editorialAttempts,
    shots: [shotA, shotB],
  };
}

async function runFailAgainFlow(browser, width) {
  const { page, context } = await newFeedPage(browser, width);
  const tag = width < 768 ? '390' : '1280';

  await page.route('**/rest/v1/place_reviews**', (route) => {
    const url = route.request().url();
    if (!isEditorialIndexRequest(url)) {
      return route.continue();
    }
    return route.abort('failed');
  });

  await page.goto(`${baseUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await waitForPublicLogbookFeedReady(page);
  await assertLoadFailedUi(page);
  const shotA = await shootViewport(page, `retry-fail-again-${tag}-01-load-failed.png`, width);

  await page.getByTestId('logbook-official-review-hub-retry').click();
  await assertLoadFailedUi(page);
  const shotB = await shootViewport(page, `retry-fail-again-${tag}-02-still-failed.png`, width);

  await context.close();
  return {
    flow: 'fail-again',
    width,
    shots: [shotA, shotB],
  };
}

const browser = await webkit.launch();
const results = [];

for (const width of [390, 1280]) {
  results.push(await runSuccessRetryFlow(browser, width));
  results.push(await runFailAgainFlow(browser, width));
}

await browser.close();

const report = {
  capturedAt: new Date().toISOString(),
  baseUrl,
  results,
};
writeFileSync(join(outDir, 'retry-flow-report.json'), `${JSON.stringify(report, null, 2)}\n`);

const storeDirs = (process.env.CAPTURE_STORE_DIRS ||
  '/cursor/stores/self/artifacts/logbook-review-hub-retry,/cursor/stores/bot/artifacts/logbook-review-hub-retry')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const src = resolve(outDir);
for (const dir of storeDirs) {
  const dest = resolve(dir);
  mkdirSync(dest, { recursive: true });
  try {
    if (src !== dest) {
      cpSync(outDir, dest, { recursive: true });
    }
  } catch (error) {
    if (error?.code !== 'ERR_FS_CP_EINVAL') throw error;
  }
}

console.log('capture-logbook-review-hub-retry OK');
console.log(JSON.stringify(report, null, 2));

/**
 * 390px list heading — EN provinces/nationwide (+ optional Now tab).
 *
 *   npm run build && npm run preview &
 *   node scripts/capture-en-festival-heading-390.mjs
 *   CAPTURE_NOW_WEBKIT_ONLY=1 node scripts/capture-en-festival-heading-390.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const OUT =
  process.env.COS_QA_SCREENSHOT_DIR ||
  '/workspace/.qa-artifacts/en-festival-heading-390';
const PORT = Number(process.env.COS_QA_PREVIEW_PORT || 4174);
const BASE = `https://127.0.0.1:${PORT}`;
const NOW_WEBKIT_ONLY = process.env.CAPTURE_NOW_WEBKIT_ONLY === '1';

const SHOTS = [
  {
    id: 'en-gyeonggi-month',
    url: `${BASE}/korea/?from=theme&area=31&lang=en&qa=390`,
    timeTab: null,
    headlineRe: /Gyeonggi Province\s*·\s*This month'?s festivals$/i,
    badRe: /festivals\s+festival|festival\s+list/i,
  },
  {
    id: 'en-gangwon-month',
    url: `${BASE}/korea/?from=theme&area=32&lang=en&qa=390`,
    timeTab: null,
    headlineRe: /Gangwon Province\s*·\s*This month'?s festivals$/i,
    badRe: /festivals\s+festival|festival\s+list/i,
  },
  {
    id: 'en-gyeonggi-now',
    url: `${BASE}/korea/?from=theme&area=31&lang=en&qa=390`,
    timeTab: 'Now',
    headlineRe: /Gyeonggi Province\s*·\s*Festivals on now$/i,
    badRe: /festival\s+list/i,
  },
  {
    id: 'en-gangwon-now',
    url: `${BASE}/korea/?from=theme&area=32&lang=en&qa=390`,
    timeTab: 'Now',
    headlineRe: /Gangwon Province\s*·\s*Festivals on now$/i,
    badRe: /festival\s+list/i,
  },
  {
    id: 'en-nationwide-month',
    url: `${BASE}/korea/?from=theme&area=all&lang=en&qa=390`,
    timeTab: null,
    headlineRe: /Nationwide\s*·\s*This month'?s festivals$/i,
    badRe: /festivals\s+festival|festival\s+list/i,
  },
  {
    id: 'ko-gangwon-month',
    url: `${BASE}/korea/?from=theme&area=32&lang=ko&qa=390`,
    timeTab: null,
    headlineRe: /강원/,
    badRe: null,
  },
];

async function dismissLocationPrompt(page) {
  const hint = page.locator('p').filter({
    hasText: /위치 허용이 없어|Showing nationwide festivals without location/i,
  });
  if (!(await hint.count())) return;
  const banner = hint.first().locator('xpath=ancestor::div[1]');
  const close = banner.getByRole('button', { name: /^(닫기|Close)$/i });
  if (await close.count()) {
    await close.first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function assertHeadingLinesDoNotOverlapLarge(page) {
  const result = await page.evaluate(() => {
    const h2 = document.querySelector('[data-festival-list-heading] h2');
    const buttons = [...document.querySelectorAll('button')];
    const large = buttons.find((btn) =>
      /large|크게/i.test(btn.getAttribute('aria-label') || btn.textContent || ''),
    );
    if (!h2 || !large) {
      return { ok: false, reason: 'missing heading or Large button' };
    }
    const range = document.createRange();
    range.selectNodeContents(h2);
    const lineRects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    const b = large.getBoundingClientRect();
    for (const r of lineRects) {
      const overlap =
        r.x < b.x + b.width &&
        r.x + r.width > b.x &&
        r.y < b.y + b.height &&
        r.y + r.height > b.y;
      if (overlap) {
        return {
          ok: false,
          reason: 'text line overlaps Large button',
          line: { x: r.x, y: r.y, width: r.width, height: r.height },
          button: { x: b.x, y: b.y, width: b.width, height: b.height },
          heading: (h2.textContent || '').replace(/\s+/g, ' ').trim(),
        };
      }
    }
    return { ok: true, lineCount: lineRects.length };
  });
  if (!result.ok) {
    throw new Error(`${result.reason}: ${JSON.stringify(result)}`);
  }
  return result;
}

async function waitHeading(page, { headlineRe, badRe, timeTab }) {
  const heading = page.locator('[data-festival-list-heading] h2').first();
  await heading.waitFor({ state: 'visible', timeout: 120_000 });
  if (timeTab) {
    const timeMajor = page.getByRole('button', { name: /^Time · /i });
    await timeMajor.waitFor({ state: 'visible', timeout: 30_000 });
    await timeMajor.click();
    await page.waitForTimeout(400);
    const chip = page.getByRole('button', { name: new RegExp(`^${timeTab}\\b`, 'i') });
    await chip.waitFor({ state: 'visible', timeout: 30_000 });
    await chip.click();
    await page.waitForTimeout(600);
  }
  await page.waitForFunction(
    ({ re }) => {
      const text = document.querySelector('[data-festival-list-heading] h2')?.textContent || '';
      return new RegExp(re.source, re.flags).test(text.replace(/\s+/g, ' ').trim());
    },
    { re: headlineRe },
    { timeout: 120_000 },
  );
  const text = (await heading.innerText()).replace(/\s+/g, ' ').trim();
  if (badRe && badRe.test(text)) {
    throw new Error(`bad headline copy: ${text}`);
  }
  const lineCheck = await assertHeadingLinesDoNotOverlapLarge(page);
  await heading.scrollIntoViewIfNeeded();
  const hBox = await heading.boundingBox();
  const meta = page.locator('[data-festival-list-meta]').first();
  const metaBox = await meta.boundingBox();
  const y = Math.max(0, (hBox?.y || 0) - 6);
  const height = Math.min(
    130,
    (metaBox ? metaBox.y + metaBox.height : (hBox?.y || 0) + (hBox?.height || 0)) - y + 10,
  );
  return { clip: { x: 0, y, width: 390, height }, lineCount: lineCheck.lineCount };
}

async function runBrowser(browserType, label, shots) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  for (const shot of shots) {
    const page = await context.newPage();
    await page.goto(shot.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await dismissLocationPrompt(page);
    const { clip, lineCount } = await waitHeading(page, shot);
    const outPath = path.join(OUT, `${shot.id}-${label}-390.png`);
    await page.screenshot({ path: outPath, clip });
    console.log(`saved ${outPath} (h2 lines: ${lineCount ?? '?'})`);
    await page.close();
  }
  await browser.close();
}

await mkdir(OUT, { recursive: true });

if (NOW_WEBKIT_ONLY) {
  const nowShots = SHOTS.filter((s) => s.id === 'en-gyeonggi-now' || s.id === 'en-gangwon-now');
  await runBrowser(webkit, 'webkit', nowShots);
} else {
  await runBrowser(chromium, 'chromium', SHOTS);
  await runBrowser(webkit, 'webkit', SHOTS);
}
console.log('capture-en-festival-heading-390 OK');

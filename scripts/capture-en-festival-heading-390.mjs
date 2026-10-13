/**
 * 390px list heading — EN Gyeonggi/Gangwon/nationwide + KO Gangwon (Chromium + WebKit).
 *
 *   npm run build && npm run preview &
 *   node scripts/capture-en-festival-heading-390.mjs
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

const SHOTS = [
  {
    id: 'en-gyeonggi-month',
    url: `${BASE}/korea/?from=theme&area=31&lang=en&qa=390`,
    headlineRe: /Gyeonggi Province\s*·\s*This month'?s festivals$/i,
    badRe: /festivals\s+festival/i,
  },
  {
    id: 'en-gangwon-month',
    url: `${BASE}/korea/?from=theme&area=32&lang=en&qa=390`,
    headlineRe: /Gangwon Province\s*·\s*This month'?s festivals$/i,
    badRe: /festivals\s+festival/i,
  },
  {
    id: 'en-nationwide-month',
    url: `${BASE}/korea/?from=theme&area=all&lang=en&qa=390`,
    headlineRe: /Nationwide\s*·\s*This month'?s festivals$/i,
    badRe: /festivals\s+festival/i,
  },
  {
    id: 'ko-gangwon-month',
    url: `${BASE}/korea/?from=theme&area=32&lang=ko&qa=390`,
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

async function waitHeading(page, { headlineRe, badRe }) {
  const heading = page.locator('[data-festival-list-heading] h2').first();
  await heading.waitFor({ state: 'visible', timeout: 120_000 });
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
  const large = page.getByRole('button', { name: /Large|크게/i }).first();
  await large.waitFor({ state: 'visible', timeout: 15_000 });
  const hBox = await heading.boundingBox();
  const bBox = await large.boundingBox();
  if (!hBox || !bBox) throw new Error('heading or Large button bbox missing');
  const overlap =
    hBox.x < bBox.x + bBox.width &&
    hBox.x + hBox.width > bBox.x &&
    hBox.y < bBox.y + bBox.height &&
    hBox.y + hBox.height > bBox.y;
  if (overlap) {
    throw new Error(`heading overlaps Large button: h=${JSON.stringify(hBox)} b=${JSON.stringify(bBox)}`);
  }
  await heading.scrollIntoViewIfNeeded();
  const meta = page.locator('[data-festival-list-meta]').first();
  const metaBox = await meta.boundingBox();
  const y = Math.max(0, (hBox.y || 0) - 6);
  const height = Math.min(
    130,
    (metaBox ? metaBox.y + metaBox.height : hBox.y + hBox.height) - y + 10,
  );
  return { clip: { x: 0, y, width: 390, height } };
}

async function runBrowser(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  for (const shot of SHOTS) {
    const page = await context.newPage();
    await page.goto(shot.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await dismissLocationPrompt(page);
    const clip = await waitHeading(page, shot);
    const outPath = path.join(OUT, `${shot.id}-${label}-390.png`);
    await page.screenshot({ path: outPath, clip: clip.clip });
    console.log(`saved ${outPath}`);
    await page.close();
  }
  await browser.close();
}

await mkdir(OUT, { recursive: true });
await runBrowser(chromium, 'chromium');
await runBrowser(webkit, 'webkit');
console.log('capture-en-festival-heading-390 OK');

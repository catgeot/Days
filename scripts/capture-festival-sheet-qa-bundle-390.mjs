/**
 * 390px screenshots — nationwide EN/KO, EN promo (Chromium + WebKit).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const OUT =
  process.env.COS_QA_SCREENSHOT_DIR ||
  '/workspace/.qa-artifacts/screenshots';
const PORT = Number(process.env.COS_QA_PREVIEW_PORT || 4174);
const BASE = `https://127.0.0.1:${PORT}`;

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

async function waitNationwideHeading(page, { locale }) {
  const isEn = locale === 'en';
  const headlineRe = isEn
    ? /Nationwide\s*·\s*This month/i
    : /전국\s*·\s*이번 달/;
  const metaRe = isEn ? /By province/i : /시·도별/;
  const headline = page.locator('h2').filter({ hasText: headlineRe }).first();
  await headline.waitFor({ state: 'visible', timeout: 120_000 });
  const meta = headline.locator('xpath=following-sibling::p[1]');
  await meta.waitFor({ state: 'visible', timeout: 120_000 });
  await meta.filter({ hasText: metaRe }).waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForFunction(
    ({ en }) => {
      const el = document.querySelector('h2')?.nextElementSibling;
      const text = el?.textContent || '';
      if (en) {
        const m = text.match(/Nationwide\s*·\s*(\d+)\s*·/);
        return m && Number(m[1]) > 0;
      }
      const m = text.match(/전국\s*·\s*(\d+)/);
      return m && Number(m[1]) > 0;
    },
    { en: isEn },
    { timeout: 120_000 },
  );
  await headline.scrollIntoViewIfNeeded();
  return { headline, meta };
}

async function screenshotNationwideBlock(page, outPath, locale) {
  const { headline, meta } = await waitNationwideHeading(page, { locale });
  const headBox = await headline.boundingBox();
  const metaBox = await meta.boundingBox();
  if (!headBox || !metaBox) throw new Error('nationwide heading boxes missing');
  const y = Math.max(0, headBox.y - 8);
  const height = Math.min(120, metaBox.y + metaBox.height - y + 12);
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y, width: 390, height },
  });
}

async function waitPromoReady(page) {
  const promo = page.locator('[data-social-promo-festival-row]');
  await promo.waitFor({ state: 'visible', timeout: 120_000 });
  await promo
    .locator('[data-social-promo-title-en]')
    .first()
    .waitFor({ state: 'visible', timeout: 120_000 });
  await promo
    .locator('[data-social-promo-title-ko]')
    .first()
    .waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForFunction(
    () => {
      const cards = [...document.querySelectorAll('[data-social-promo-card]')];
      if (cards.length < 2) return false;
      return cards.every((card) => {
        const fallback = card.querySelector('[data-thumb-fallback]');
        if (fallback) return true;
        const img = card.querySelector('img');
        return Boolean(img?.complete && img.naturalWidth > 0);
      });
    },
    undefined,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(400);
}

async function screenshotPromoRow(page, outPath) {
  await waitPromoReady(page);
  const promo = page.locator('[data-social-promo-festival-row]').first();
  await promo.scrollIntoViewIfNeeded();
  const box = await promo.boundingBox();
  if (!box) throw new Error('promo row box missing');
  await page.screenshot({
    path: outPath,
    clip: {
      x: 0,
      y: Math.max(0, box.y - 8),
      width: 390,
      height: Math.min(260, box.height + 16),
    },
  });
}

async function waitPreview() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/korea/`)).ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview down');
}

async function captureSet(browserName, launchBrowser) {
  const browser = await launchBrowser();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120_000);
  page.setDefaultTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 900 });

  const suffix = `-${browserName}-390.png`;

  await page.goto(`${BASE}/korea/?lang=en&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  await dismissLocationPrompt(page);
  await screenshotNationwideBlock(
    page,
    path.join(OUT, `bundle-en-nationwide-heading${suffix}`),
    'en',
  );
  await screenshotPromoRow(
    page,
    path.join(OUT, `bundle-en-social-promo${suffix}`),
  );

  await page.goto(`${BASE}/korea/?lang=ko&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  await dismissLocationPrompt(page);
  await screenshotNationwideBlock(
    page,
    path.join(OUT, `bundle-ko-nationwide-heading${suffix}`),
    'ko',
  );

  await browser.close();
  console.log(`saved ${browserName} screenshots`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitPreview();
  await captureSet('chromium', () => chromium.launch());
  await captureSet('webkit', () => webkit.launch());
  console.log('saved bundle screenshots to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

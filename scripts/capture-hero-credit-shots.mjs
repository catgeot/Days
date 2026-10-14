import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit, devices } from 'playwright';

const BASE = process.env.PREVIEW_BASE || 'http://127.0.0.1:4180';
const OUT = '/opt/cursor/artifacts/screenshots/preview-en-summary';
const ID = '638576';

async function dismiss(page) {
  try {
    await page.getByRole('main').getByRole('button', { name: /^닫기$|^Close$/i }).first().click({ timeout: 2500 });
  } catch { /* */ }
}

async function waitDecoded(page) {
  await page.waitForFunction(
    () => {
      const img = document.querySelector('[data-festival-hero] img[data-festival-photo]');
      const decoded = document.querySelector('[data-festival-hero][data-festival-hero-decoded="true"]');
      const credit = document.querySelector('[data-festival-photo-credit]');
      return img && img.naturalWidth > 0 && decoded && credit && credit.textContent?.trim();
    },
    null,
    { timeout: 120_000 },
  );
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await webkit.launch();

  const en = await browser.newContext({ ...devices['iPhone 13'], locale: 'en-US' });
  const enPage = await en.newPage();
  await enPage.goto(`${BASE}/korea/?festival=${ID}&lang=en`, { waitUntil: 'domcontentloaded' });
  await dismiss(enPage);
  await waitDecoded(enPage);
  await enPage.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    if (d) d.scrollTop = 0;
  });
  await enPage.screenshot({
    path: join(OUT, 'preview-en-638576-hero-credit.png'),
    fullPage: false,
  });

  await enPage.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const fee = document.querySelector('[data-festival-summary-fee]');
    if (d && fee) {
      d.scrollTop = Math.max(
        0,
        fee.getBoundingClientRect().top - d.getBoundingClientRect().top + d.scrollTop - 24,
      );
    }
  });
  await enPage.waitForTimeout(500);
  await enPage.screenshot({
    path: join(OUT, 'preview-en-638576-fee-venue.png'),
    fullPage: false,
  });

  const ko = await browser.newContext({ ...devices['iPhone 13'], locale: 'ko-KR' });
  const koPage = await ko.newPage();
  await koPage.goto(`${BASE}/korea/?festival=${ID}`, { waitUntil: 'domcontentloaded' });
  await dismiss(koPage);
  await waitDecoded(koPage);
  await koPage.screenshot({
    path: join(OUT, 'preview-ko-638576-hero-credit.png'),
    fullPage: false,
  });

  const fail = await browser.newContext({ ...devices['iPhone 13'], locale: 'en-US' });
  const failPage = await fail.newPage();
  await failPage.route('**/*.{jpg,JPG,jpeg,png,webp}', (route) => {
    const url = route.request().url();
    if (url.includes('visitkorea') || url.includes('4114406')) return route.abort();
    return route.continue();
  });
  await failPage.goto(`${BASE}/korea/?festival=${ID}&lang=en`, { waitUntil: 'domcontentloaded' });
  await dismiss(failPage);
  await failPage.waitForSelector('[data-festival-hero-fallback]', { timeout: 60_000 });
  await failPage.screenshot({
    path: join(OUT, 'preview-en-hero-no-expand-badge.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('saved', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });

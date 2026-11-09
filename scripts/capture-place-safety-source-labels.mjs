/**
 * 치안 출처 링크 라벨 — 파리·카이로 390/1280 캡처.
 * Usage: npm run build && node scripts/capture-place-safety-source-labels.mjs
 */
import { mkdir } from 'node:fs/promises';
import https from 'node:https';
import { chromium } from 'playwright';

const OUT = '/opt/cursor/artifacts';
const BASE = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173';

async function waitForPreview(ms = 30_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const ok = await new Promise((resolve) => {
      const req = https.get(BASE, { rejectUnauthorized: false }, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`preview not ready at ${BASE}`);
}

async function capturePlace(browser, slug, lang, width) {
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 900 : 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  await page.goto(`${BASE}/place/${slug}?lang=${lang}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  async function expandLocalInfoSection() {
    const facts = page.getByRole('button', { name: lang === 'ko' ? /현지 정보/ : /Local info/i }).first();
    await facts.waitFor({ state: 'visible', timeout: 60_000 });
    if ((await facts.getAttribute('aria-expanded')) !== 'true') await facts.click();
  }

  if (width === 390) {
    await expandLocalInfoSection();
    const safety = page.locator('[data-local-info-row="safety"]:visible');
    await safety.waitFor({ state: 'visible', timeout: 60_000 });
    const toggle = safety.locator('button').first();
    const open = await safety.getAttribute('data-local-info-open');
    if (open !== 'true') await toggle.click();
    await page.locator('[data-fact-source]:visible').first().waitFor({ state: 'visible', timeout: 30_000 });
    const box = await safety.boundingBox();
    const clipY = Math.max(0, (box?.y ?? 0) - 8);
    const clipH = Math.min(520, (box?.height ?? 400) + 16);
    const file = `${OUT}/place-${slug}-safety-sources-${lang}-${width}.png`;
    await page.screenshot({
      path: file,
      clip: { x: 0, y: clipY, width: 390, height: clipH },
    });
    await page.close();
    return file;
  }
  await expandLocalInfoSection();
  const safety = page.locator('[data-local-info-row="safety"]:visible');
  await safety.waitFor({ state: 'visible', timeout: 60_000 });
  const toggle = safety.locator('button').first();
  if ((await safety.getAttribute('data-local-info-open')) !== 'true') await toggle.click();
  await page.locator('[data-fact-source]:visible').first().waitFor({ state: 'visible', timeout: 30_000 });
  const file = `${OUT}/place-${slug}-safety-sources-${lang}-${width}.png`;
  await page.screenshot({ path: file, fullPage: false });
  await page.close();
  return file;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForPreview();
  const browser = await chromium.launch({ headless: true });
  const saved = [];
  for (const slug of ['paris', 'cairo']) {
    for (const width of [390, 1280]) {
      saved.push(await capturePlace(browser, slug, 'ko', width));
    }
  }
  await browser.close();
  for (const path of saved) console.log('saved', path);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

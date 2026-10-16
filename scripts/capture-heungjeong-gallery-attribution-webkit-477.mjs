/**
 * WebKit 390 — 흥정계곡 gallery footer attribution (Tour-only → 한국관광공사).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { waitForGalleryFullyLoaded, scrollToGallerySection } from './lib/gallery-qa-wait.mjs';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const OUT = join(process.cwd(), 'docs/qa/pr-site-search');
const FILE = 'heungjeong-gallery-attribution-webkit-390.png';
const WIDTH = 390;
const HEIGHT = 844;

async function main() {
  await mkdir(OUT, { recursive: true });
  const useWebkit = process.env.QA_CAPTURE_BROWSER !== 'chromium';
  const launcher = useWebkit ? webkit : chromium;
  const browser = await launcher.launch({
    headless: true,
    args: useWebkit ? [] : ['--ignore-certificate-errors'],
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await page.goto(`${BASE}/place/%ED%9D%A5%EC%A0%95%EA%B3%84%EA%B3%A1`, {
    waitUntil: 'commit',
    timeout: 90_000,
  });
  await page.waitForTimeout(12_000);
  await scrollToGallerySection(page);
  await page.evaluate(() => {
    const scroller = document.querySelector('.custom-scrollbar-blue');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  await page.waitForTimeout(800);
  const credit = page.getByText('사진: 한국관광공사', { exact: true });
  await credit.waitFor({ state: 'visible', timeout: 30_000 });
  const box = await credit.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { y: Math.max(0, r.top - 280), h: Math.min(844, 400) };
  });
  const path = join(OUT, FILE);
  await page.screenshot({
    path,
    clip: { x: 0, y: box.y, width: WIDTH, height: box.h },
  });
  await browser.close();
  console.log(`Wrote ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Count visible gallery images on /place/* (390 headless).
 * Usage:
 *   PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 node scripts/audit-gallery-count-477.mjs
 */
import { chromium, webkit } from 'playwright';
import { auditGalleryImages, waitForGalleryFullyLoaded } from './lib/gallery-qa-wait.mjs';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const WIDTH = 390;

const SLUGS = [
  { label: '흥정계곡', path: '/place/%ED%9D%A5%EC%A0%95%EA%B3%84%EA%B3%A1' },
  { label: '경포대', path: '/place/gyeongpodae' },
  { label: '성산일출봉', path: '/place/seongsan-ilchulbong' },
];

async function countFor(browserType, tag) {
  const launcher = browserType === 'webkit' ? webkit : chromium;
  const browser = await launcher.launch({
    headless: true,
    args: tag === 'chromium' ? ['--ignore-certificate-errors'] : [],
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: 844 },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const rows = [];
  for (const slug of SLUGS) {
    await page.goto(`${BASE}${slug.path}`, { waitUntil: 'commit', timeout: 90_000 });
    await waitForGalleryFullyLoaded(page, {
      minImages: slug.label === '흥정계곡' ? 3 : 1,
    });
    const audit = await auditGalleryImages(page);
    rows.push({ ...slug, browser: tag, ...audit });
  }
  await browser.close();
  return rows;
}

const rows = [
  ...(await countFor('chromium', 'chromium')),
  ...(await countFor('webkit', 'webkit')),
];
console.log(JSON.stringify({ base: BASE, rows }, null, 2));

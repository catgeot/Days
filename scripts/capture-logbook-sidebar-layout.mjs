/**
 * Capture /blog desktop sidebar layout with mocked auth (for before/after QA).
 */
import { writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import {
  OWNER_ID,
  installLogbookReportRoutes,
  seedAuthSession,
} from '../e2e/fixtures/logbook-owner-edit-mocks.js';

const OUT_DIR = '/opt/cursor/artifacts/logbook-sidebar-layout';
const BASE = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5196';
const BUTTERFLY =
  'https://images.unsplash.com/photo-1604881989561-9456e87b5ae9?auto=format&fit=crop&w=800&q=80';

const WIDTHS = [390, 1024, 1280, 1440];

async function measureSidebarProfile(page) {
  return page.evaluate(() => {
    const sidebar = [...document.querySelectorAll('div')].find((el) => {
      const s = el.getAttribute('class') || '';
      return s.includes('md:flex') && s.includes('w-64') && s.includes('border-r');
    });
    if (!sidebar) return { error: 'no-sidebar' };
    const profileRoot = sidebar.querySelector('.border-t');
    const photoBox = profileRoot?.querySelector('[class*="aspect-"]');
    const img = photoBox?.querySelector('img');
    const sidebarRect = sidebar.getBoundingClientRect();
    const main = document.querySelector('[data-logbook-main-scroll]');
    const mainRect = main?.getBoundingClientRect();
    const photoRect = photoBox?.getBoundingClientRect();
    const imgRect = img?.getBoundingClientRect();
    return {
      sidebarWidth: sidebarRect.width,
      gap: mainRect ? mainRect.left - sidebarRect.right : null,
      photoBoxRatio: photoRect ? photoRect.width / photoRect.height : null,
      imgRatio: imgRect ? imgRect.width / imgRect.height : null,
      photoW: photoRect?.width,
      photoH: photoRect?.height,
      aspectComputed: photoBox ? getComputedStyle(photoBox).aspectRatio : null,
      objectFit: img ? getComputedStyle(img).objectFit : null,
    };
  });
}

async function main() {
const browser = await chromium.launch();
await mkdir(OUT_DIR, { recursive: true });

const metrics = {};

for (const width of WIDTHS) {
  const page = await browser.newPage({
    viewport: width === 390 ? { width: 390, height: 844 } : { width, height: 900 },
  });
  await seedAuthSession(page, OWNER_ID);
  await installLogbookReportRoutes(page, OWNER_ID);
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: OWNER_ID,
          email: 'e2e@example.com',
          user_metadata: {
            avatar_url: BUTTERFLY,
            avatar_urls: [BUTTERFLY],
            display_name: 'catgeot',
          },
        },
      }),
    });
  });
  await page.route('**/rest/v1/profiles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: OWNER_ID,
          display_name: 'catgeot',
          avatar_url: BUTTERFLY,
          avatar_urls: [BUTTERFLY],
          profile_public: true,
        },
      ]),
    });
  });
  await page.goto(`${BASE}/blog?tab=public&lang=ko&logbook_review_hub=1`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(2000);
  metrics[width] = await measureSidebarProfile(page);
  await page.screenshot({
    path: join(OUT_DIR, `logbook-sidebar-after-${width}-mock.png`),
    clip: { x: 0, y: 0, width, height: width === 390 ? 844 : 900 },
  });
  await page.close();
}

writeFileSync(join(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
#!/usr/bin/env node
/**
 * Mocked 390×844 gallery home — visit stories decoupled from verified facts.
 *   npm run build && npm run preview &
 *   node scripts/capture-visit-stories-slug-decouple-390.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT =
  process.env.VISIT_STORIES_DECOUPLE_OUT || '/opt/cursor/artifacts/visit-stories-slug-decouple';

const MOCK_BY_SLUG = {
  jeju: [
    {
      id: 'jeju-r1',
      content: '제주 동쪽 해안 드라이브 후기 — 다녀온 이야기 노출 확인',
      content_blocks: null,
      persona_label: '여행자',
      is_public: true,
      is_editorial: true,
      created_at: '2025-06-01T00:00:00.000Z',
    },
    {
      id: 'jeju-r2',
      content: '한라산 등산 코스 리뷰',
      content_blocks: null,
      persona_label: '등산러',
      is_public: true,
      is_editorial: false,
      created_at: '2025-05-10T00:00:00.000Z',
    },
    {
      id: 'jeju-r3',
      content: '성산일출봉 일출 감상',
      content_blocks: null,
      persona_label: null,
      is_public: true,
      is_editorial: true,
      created_at: '2025-04-20T00:00:00.000Z',
    },
  ],
  'khao-lak': [
    {
      id: 'kl-r1',
      content: '카오락 해변 리조트 숙박 후기',
      content_blocks: null,
      persona_label: null,
      is_public: true,
      is_editorial: true,
      created_at: '2025-03-01T00:00:00.000Z',
    },
  ],
  tokyo: [],
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'content-type': 'application/json',
  };
}

async function installMocks(context) {
  await context.route(/\.supabase\.co\//i, async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const url = req.url();

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders() });
    }

    if (method === 'GET' && url.includes('/rest/v1/place_reviews') && url.includes('persona_label')) {
      const slugMatch = url.match(/place_slug=eq\.([^&]+)/);
      const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : '';
      const rows = MOCK_BY_SLUG[slug] ?? [];
      return route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify(rows),
      });
    }

    if (method === 'GET' && url.includes('/rest/v1/reports')) {
      return route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify([]),
      });
    }

    return route.continue();
  });
}

async function capturePlace(page, slug, fileName) {
  await page.goto(`${BASE}place/${slug}?lang=ko`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page
    .locator('[data-place-gallery-scroll]')
    .first()
    .waitFor({ state: 'attached', timeout: 120_000 });
  const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ });
  if (await storiesHeader.count()) {
    await storiesHeader.first().waitFor({ state: 'visible', timeout: 60_000 });
    await storiesHeader.first().scrollIntoViewIfNeeded();
  }
  const factsHeader = page.getByRole('button', { name: /현지 정보/ });
  if (slug === 'jeju' && (await factsHeader.count())) {
    throw new Error('jeju must not show 현지 정보');
  }
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
});
await installMocks(context);
const page = await context.newPage();

await capturePlace(page, 'jeju', 'jeju-gallery-home-stories-no-facts-390.png');
await capturePlace(page, 'khao-lak', 'khao-lak-gallery-home-unchanged-390.png');
await capturePlace(page, 'tokyo', 'tokyo-gallery-home-no-stories-390.png');

await browser.close();
console.log(`Saved 390×844 captures under ${OUT}`);
#!/usr/bin/env node
/**
 * 식당 검색 카드 분리 QA — 390·1280 ko PNG (TourAPI mock + 로컬 dev).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const OUT_DIR = '/opt/cursor/artifacts';
const BASE = process.env.SMOKE_SITE_URL || 'http://127.0.0.1:5173';

const RESTAURANT_ROWS = [
  {
    content_id: '403053',
    title: '명동교자',
    addr1: '서울특별시 중구 명동2가',
    mapx: '126.985032',
    mapy: '37.563569',
    cat1: 'A05',
    cat3: 'A05020100',
  },
];

async function installMock(context) {
  const CORS = { 'access-control-allow-origin': '*' };
  await context.route(/api\.mapbox\.com/i, async (route) => {
    if (/suggest|forward|retrieve/i.test(route.request().url())) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: [], features: [] }),
      });
      return;
    }
    await route.continue();
  });
  await context.route(/\/functions\/v1\/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || '').trim();
    const row = RESTAURANT_ROWS[0];
    if (action === 'searchKeyword') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          items: [
            {
              contentId: row.content_id,
              title: row.title,
              addr1: row.addr1,
              mapx: row.mapx,
              mapy: row.mapy,
              contentTypeId: '39',
              cat1: row.cat1,
              cat3: row.cat3,
            },
          ],
        }),
      });
      return;
    }
    if (action === 'detailCommon') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          common: {
            contentid: row.content_id,
            contenttypeid: '39',
            title: row.title,
            addr1: row.addr1,
            mapx: row.mapx,
            mapy: row.mapy,
            overview: '명동교자 — 캡처 mock',
          },
        }),
      });
      return;
    }
    await route.fulfill({ status: 200, headers: CORS, body: '{}' });
  });
}

async function shot(page, fileName) {
  const out = path.join(OUT_DIR, fileName);
  await page.screenshot({ path: out, type: 'png' });
  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const [width, tag] of [
    [390, '390'],
    [1280, '1280'],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });
    await installMock(context);
    const page = await context.newPage();
    await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
    const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await input.waitFor({ state: 'visible', timeout: 60_000 });
    await input.fill('명동교자');
    const card = page
      .locator('[data-search-popover] li')
      .filter({ has: page.getByRole('link', { name: /명동교자.*네이버 지도/ }) })
      .first();
    await card.waitFor({ state: 'visible', timeout: 30_000 });
    await shot(page, `restaurant-search-card-${tag}-ko.png`);
    await card.locator('button').first().click();
    await page.waitForURL(/\/place\/tour-403053/, { timeout: 60_000 });
    const plannerHeader = page.getByRole('button', { name: /여행 플래너|Travel planner/i });
    await plannerHeader.waitFor({ state: 'visible', timeout: 30_000 });
    await plannerHeader.click();
    await page.getByRole('heading', { name: /여행 플래너/ }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByRole('tablist', { name: /플래너 단계|Planner steps/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForTimeout(600);
    await shot(page, `restaurant-place-planner-${tag}-ko.png`);
    await context.close();
  }
  await browser.close();
  console.log('wrote captures to', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

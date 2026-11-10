// 식당 검색 카드 — 본문 /place · 지도 링크 외부 (WebKit 390)
import { test, expect } from './fixtures.js';

const MINGDONG_ROW = {
  content_id: '403053',
  title: '명동교자',
  addr1: '서울특별시 중구 명동2가',
  addr2: '명동길 14',
  area_code: '1',
  sigungu_code: '24',
  mapx: '126.985032',
  mapy: '37.563569',
  first_image: 'https://tong.visitkorea.or.kr/cms/resource/e2e-mingdong-gyoja.jpg',
  active: true,
  cat1: 'A05',
  cat2: 'A0502',
  cat3: 'A05020100',
  content_type_id: '39',
  modified_time: '20260101000000',
};

const GANGNEUNG_ROW = {
  content_id: '3532662',
  title: '내마음에찜',
  addr1: '강원특별자치도 강릉시',
  addr2: '경강로',
  area_code: '32',
  sigungu_code: '1',
  mapx: '128.876',
  mapy: '37.751',
  first_image: 'https://tong.visitkorea.or.kr/cms/resource/e2e-gangneung-jjim.jpg',
  active: true,
  cat1: 'A05',
  cat2: 'A0502',
  cat3: 'A05020100',
  content_type_id: '39',
  modified_time: '20260101000000',
};

const RESTAURANT_ROWS = [MINGDONG_ROW, GANGNEUNG_ROW];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
};

function itemMatchesKeyword(item, keyword) {
  const k = String(keyword || '').trim().toLowerCase().replace(/\s+/g, '');
  const title = String(item.title || '').toLowerCase().replace(/\s+/g, '');
  return k.length >= 2 && (title === k || title.includes(k));
}

async function installRestaurantSearchMock(context) {
  await context.route(/api\.mapbox\.com/i, async (route) => {
    const url = route.request().url();
    if (/suggest|forward|retrieve/i.test(url)) {
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
    if (method !== 'POST') {
      await route.fulfill({ status: 200, headers: CORS, body: '{}' });
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || body.type || '').trim();
    const contentId = String(body.contentId || body.contentid || '').trim();
    const row = RESTAURANT_ROWS.find((r) => r.content_id === contentId);

    if (action === 'detailCommon' && row) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          items: [
            {
              contentid: row.content_id,
              contenttypeid: '39',
              title: row.title,
              addr1: row.addr1,
              addr2: row.addr2,
              mapx: row.mapx,
              mapy: row.mapy,
              overview: `${row.title} — E2E mock`,
              firstimage: row.first_image,
            },
          ],
          common: {
            contentid: row.content_id,
            contenttypeid: '39',
            title: row.title,
            addr1: row.addr1,
            addr2: row.addr2,
            mapx: row.mapx,
            mapy: row.mapy,
            overview: `${row.title} — E2E mock`,
            firstimage: row.first_image,
          },
        }),
      });
      return;
    }

    if (action === 'searchKeyword') {
      const items = RESTAURANT_ROWS.filter((row) =>
        itemMatchesKeyword(row, body.keyword),
      ).map((row) => ({
        contentId: row.content_id,
        contentid: row.content_id,
        title: row.title,
        addr1: row.addr1,
        addr2: row.addr2,
        mapx: row.mapx,
        mapy: row.mapy,
        firstimage: row.first_image,
        contentTypeId: '39',
        cat1: row.cat1,
        cat2: row.cat2,
        cat3: row.cat3,
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ ok: true, items }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ ok: true, item: row || null }),
    });
  });
}

async function openExploreSearch(page) {
  await page.goto('/explore');
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(input).toBeVisible({ timeout: 60_000 });
  return input;
}

test.describe('explore restaurant search card split', () => {
  test.beforeEach(async ({ context }) => {
    await installRestaurantSearchMock(context);
  });

  test('명동교자 — 본문 /place/tour-403053 · 지도 링크 네이버 새 탭', async ({ page, context }) => {
    const input = await openExploreSearch(page);
    await input.fill('명동교자');
    const card = page
      .locator('[data-search-popover] li')
      .filter({ has: page.getByRole('link', { name: /명동교자.*네이버 지도/ }) })
      .first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    const bodyBtn = card.locator('button').first();
    const mapLink = card.getByRole('link', { name: /명동교자.*네이버 지도/ }).first();
    await expect(mapLink).toBeVisible();
    await expect(mapLink).toHaveAttribute('href', /map\.naver\.com/);

    await bodyBtn.click();
    await page.waitForURL(/\/place\/tour-403053/, { timeout: 60_000 });
    await expect(page).toHaveURL(/\/place\/tour-403053(?:\/|$|\?)/);
    const plannerHeader = page.getByRole('button', { name: /여행 플래너|Travel planner/i });
    await expect(plannerHeader).toBeVisible({ timeout: 30_000 });
    await plannerHeader.click();
    await expect(page.getByRole('heading', { name: /여행 플래너/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('tablist', { name: /플래너 단계|Planner steps/i })).toBeVisible();

    await page.goto('/explore');
    const input2 = await openExploreSearch(page);
    await input2.fill('명동교자');
    await expect(mapLink).toBeVisible({ timeout: 30_000 });
    const popupPromise = context.waitForEvent('page');
    await mapLink.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/map\.naver\.com/, { timeout: 20_000 });
    await popup.close();
  });
});

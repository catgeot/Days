import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const RECORDED_DETAIL = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-2989642-detail.json'), 'utf8'),
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

/** Central belt — enough coords for a road line (wonju → pyeongchang → jeongseon). */
export const WONJU_ROAD_WINDOW_ITEMS = [
  {
    contentId: 'road-wonju-1',
    title: '원주 단풍 축제',
    addr1: '강원특별자치도 원주시 단구로',
    areaCode: '32',
    eventStartDate: '20261022',
    eventEndDate: '20261028',
    mapx: '127.9202',
    mapy: '37.3422',
  },
  {
    contentId: 'road-pc-1',
    title: '평창 송어 축제',
    addr1: '강원특별자치도 평창군 대관령면',
    areaCode: '32',
    eventStartDate: '20261022',
    eventEndDate: '20261028',
    mapx: '128.3900',
    mapy: '37.3700',
  },
  {
    contentId: 'road-js-1',
    title: '정선 아리랑 축제',
    addr1: '강원특별자치도 정선군 정선읍',
    areaCode: '32',
    eventStartDate: '20261022',
    eventEndDate: '20261028',
    mapx: '128.6600',
    mapy: '37.3800',
  },
  {
    contentId: 'road-wonju-next',
    title: '원주 다음주 축제',
    addr1: '강원특별자치도 원주시',
    areaCode: '32',
    eventStartDate: '20261029',
    eventEndDate: '20261104',
    mapx: '127.9250',
    mapy: '37.3450',
  },
];

function jsonFulfill(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(payload),
  });
}

function detailFor(contentId) {
  const row = WONJU_ROAD_WINDOW_ITEMS.find((item) => item.contentId === contentId);
  if (!row) return { ...RECORDED_DETAIL, contentId };
  return {
    ok: true,
    contentId: row.contentId,
    intro: {
      contentId: row.contentId,
      contentTypeId: '15',
      eventStartDate: row.eventStartDate,
      eventEndDate: row.eventEndDate,
      eventplace: row.title,
      mapx: row.mapx,
      mapy: row.mapy,
    },
    common: {
      contentId: row.contentId,
      title: row.title,
      addr1: row.addr1,
      mapx: row.mapx,
      mapy: row.mapy,
    },
  };
}

export async function installFestivalRoadWonjuFixtures(context) {
  await context.route(/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
    if (method !== 'POST') {
      await route.fulfill({ status: 200, headers: CORS, body: '' });
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || '');
    const contentId = String(body.contentId || body.contentid || '').trim();

    if (action === 'festivalWindow') {
      await jsonFulfill(route, { ok: true, items: WONJU_ROAD_WINDOW_ITEMS, fromCache: true });
      return;
    }
    if (action === 'festivalDetail' || action === 'detailIntro' || action === 'detailCommon') {
      await jsonFulfill(route, detailFor(contentId || WONJU_ROAD_WINDOW_ITEMS[0].contentId));
      return;
    }
    await jsonFulfill(route, { ok: true, items: [], fromCache: true });
  });
}
